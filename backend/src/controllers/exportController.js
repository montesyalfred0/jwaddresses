import pool from '../config/database.js';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  TableLayoutType,
  Footer,
  PageNumber,
} from 'docx';

const DOCX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Paleta de marca (coherente con la app) */
const C = {
  primary: '304973',   // jw-700
  dark: '18253F',      // jw-900
  mid: '243759',       // jw-800
  accentLine: 'B3C7E3',// jw-200
  zebra: 'F0F4F9',     // jw-50
  muted: '555555',
  faint: '8A8A8A',
};

const FONT = 'Segoe UI';

/** Sanitiza un texto para usarlo como nombre de archivo y evitar inyección de cabeceras HTTP */
const safeFilenamePart = (value) =>
  String(value)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'territorio';

/** Fecha actual en formato YYYY-MM-DD para el nombre del archivo */
const dateStamp = () => new Date().toISOString().slice(0, 10);

/**
 * Obtiene las direcciones agrupadas por territorio y barrio.
 * Si territoryId es null incluye todos los territorios.
 * Consulta parametrizada: sin riesgo de inyección SQL.
 */
const fetchGroupedData = async (territoryId = null) => {
  const params = [];
  let where = '';
  if (Number.isInteger(territoryId)) {
    params.push(territoryId);
    where = `WHERE t.id = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT t.id AS territory_id,
            t.name AS territory_name,
            n.id AS neighborhood_id,
            n.name AS neighborhood_name,
            a.name AS person_name,
            a.family,
            a.address
     FROM territories t
     LEFT JOIN neighborhoods n ON n.territory_id = t.id
     LEFT JOIN addresses a ON a.neighborhood_id = n.id
     ${where}
     ORDER BY t.id, n.id, a.name ASC`,
    params
  );

  const territories = new Map();
  for (const row of result.rows) {
    if (!territories.has(row.territory_id)) {
      territories.set(row.territory_id, { name: row.territory_name, neighborhoods: new Map() });
    }
    if (row.neighborhood_id === null) continue;
    const territory = territories.get(row.territory_id);
    if (!territory.neighborhoods.has(row.neighborhood_id)) {
      territory.neighborhoods.set(row.neighborhood_id, { name: row.neighborhood_name, addresses: [] });
    }
    if (row.person_name !== null) {
      territory.neighborhoods.get(row.neighborhood_id).addresses.push({
        name: row.person_name,
        family: row.family,
        address: row.address,
      });
    }
  }

  return [...territories.values()];
};

/** Borde fino azul suave para todas las líneas de la tabla */
const softBorder = { style: BorderStyle.SINGLE, size: 4, color: C.accentLine };
const tableBorders = {
  top: softBorder,
  bottom: softBorder,
  left: softBorder,
  right: softBorder,
  insideHorizontal: softBorder,
  insideVertical: softBorder,
};

const cellMargins = { top: 110, bottom: 110, left: 150, right: 150 };

/**
 * Ancho útil de página en twips (DXA): A4 (11906) menos márgenes (1150 x 2).
 * IMPORTANTE: los anchos deben ser DXA absolutos; los porcentajes generan un
 * tblGrid inválido que colapsa las columnas a ~2mm y apila el texto en vertical.
 */
const PAGE_CONTENT_WIDTH = 11906 - 1150 * 2;

const cellParagraph = (text, options = {}) =>
  new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: String(text ?? ''), size: 21, font: FONT, ...options })],
  });

/** Encabezado de tabla: fondo azul de marca, texto blanco en negrita */
const buildHeaderRow = (columns) =>
  new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: columns.map(
      (col) =>
        new TableCell({
          width: { size: col.width, type: WidthType.DXA },
          shading: { fill: C.primary, type: 'clear' },
          margins: cellMargins,
          children: [cellParagraph(col.header, { bold: true, color: 'FFFFFF' })],
        })
    ),
  });

/** Filas de direcciones con franjas alternadas (cebra) */
const buildBodyRows = (addresses, columns) =>
  addresses.map((addr, i) =>
    new TableRow({
      cantSplit: true,
      children: columns.map((col, ci) => {
        const value =
          ci === 0 ? addr.name : ci === 1 ? addr.family : addr.address;
        return new TableCell({
          width: { size: col.width, type: WidthType.DXA },
          shading: { fill: i % 2 === 1 ? C.zebra : 'FFFFFF', type: 'clear' },
          margins: cellMargins,
          children: [
            cellParagraph(value, ci === 0 ? { bold: true } : {}),
          ],
        });
      }),
    })
  );

/** Tabla de direcciones del barrio: Nombre · Familia · Dirección */
const buildAddressTable = (addresses) => {
  const columns = [
    { header: 'Nombre', width: 2650 },
    { header: 'Familia', width: 2350 },
    { header: 'Dirección', width: PAGE_CONTENT_WIDTH - 2650 - 2350 },
  ];

  return new Table({
    // columnWidths define el tblGrid real que Word usa con layout fijo
    columnWidths: columns.map((col) => col.width),
    width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    rows: [buildHeaderRow(columns), ...buildBodyRows(addresses, columns)],
  });
};

/** Título del documento con línea de acento y resumen */
const buildDocHeader = (docTitle, grouped) => {
  const totalAddresses = grouped.reduce(
    (total, t) => total + [...t.neighborhoods.values()].reduce((sum, nb) => sum + nb.addresses.length, 0),
    0
  );
  return [
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: docTitle, bold: true, size: 52, color: C.dark, font: FONT })],
    }),
    new Paragraph({
      spacing: { after: 320 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.primary, space: 10 } },
      children: [
        new TextRun({
          text: `Generado el ${new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}  ·  ${totalAddresses} direcciones en ${grouped.length} ${grouped.length === 1 ? 'territorio' : 'territorios'}`,
          size: 20,
          color: C.muted,
          font: FONT,
        }),
      ],
    }),
  ];
};

/** Encabezado de territorio con contador y línea divisoria (flujo continuo, sin saltos de página) */
const buildTerritoryHeading = (territory, isFirst) => {
  const count = [...territory.neighborhoods.values()].reduce((sum, nb) => sum + nb.addresses.length, 0);
  return new Paragraph({
    keepNext: true,
    spacing: { before: isFirst ? 0 : 560, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accentLine, space: 6 } },
    children: [
      new TextRun({ text: territory.name, bold: true, size: 38, color: C.primary, font: FONT }),
      new TextRun({
        text: `   ${count} ${count === 1 ? 'dirección' : 'direcciones'}`,
        size: 20,
        color: C.muted,
        font: FONT,
      }),
    ],
  });
};

/**
 * Encabezado de barrio. Los barrios sin direcciones se anotan en la misma línea
 * para no ocupar espacio adicional en el documento.
 */
const buildNeighborhoodHeading = (neighborhood) => {
  const isEmpty = neighborhood.addresses.length === 0;
  return new Paragraph({
    keepNext: !isEmpty,
    spacing: { before: isEmpty ? 160 : 300, after: isEmpty ? 40 : 120 },
    children: [
      new TextRun({ text: neighborhood.name, bold: true, size: 27, color: C.mid, font: FONT }),
      isEmpty
        ? new TextRun({ text: '   · sin direcciones', italics: true, size: 20, color: C.faint, font: FONT })
        : new TextRun({ text: `  (${neighborhood.addresses.length})`, size: 19, color: C.faint, font: FONT }),
    ],
  });
};

/** Construye el documento Word completo a partir de los datos agrupados */
const buildDocument = (grouped, docTitle) => {
  const children = [...buildDocHeader(docTitle, grouped)];

  grouped.forEach((territory, tIdx) => {
    children.push(buildTerritoryHeading(territory, tIdx === 0));

    if (territory.neighborhoods.size === 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Sin barrios registrados.', italics: true, color: C.muted, font: FONT })],
        })
      );
      return;
    }

    for (const neighborhood of territory.neighborhoods.values()) {
      children.push(buildNeighborhoodHeading(neighborhood));

      if (neighborhood.addresses.length === 0) {
        continue;
      }

      children.push(buildAddressTable(neighborhood.addresses));
      children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
    }
  });

  return new Document({
    creator: 'jwaddresses',
    title: docTitle,
    styles: {
      default: {
        document: { run: { font: FONT, size: 21 }, paragraph: { spacing: { after: 0 } } },
        heading1: { run: { font: FONT } },
        heading2: { run: { font: FONT } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1100, bottom: 1100, left: 1150, right: 1150 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.accentLine, space: 4 } },
                children: [
                  new TextRun({ text: 'Página ', size: 18, color: C.muted, font: FONT }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.muted, font: FONT }),
                  new TextRun({ text: ' de ', size: 18, color: C.muted, font: FONT }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: C.muted, font: FONT }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
};

/** Configura cabeceras seguras de descarga y envía el buffer del documento */
const sendDocxResponse = async (res, document, filename) => {
  const buffer = await Packer.toBuffer(document);
  res.status(200);
  res.setHeader('Content-Type', DOCX_CONTENT_TYPE);
  // filename ASCII saneado + filename* RFC 5987 para conservar caracteres UTF-8 de forma segura
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeFilenamePart(filename)}.docx"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );
  // El documento contiene datos personales: nunca debe cachearse por proxies ni navegador
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(buffer);
};

/**
 * GET /api/territories/export/docx — exporta todas las direcciones agrupadas por territorio.
 * Requiere autenticación y rol admin (aplicado en la ruta).
 */
export const exportAllTerritoriesDocx = async (req, res) => {
  try {
    const grouped = await fetchGroupedData(null);
    console.log(`[EXPORT] usuario=${req.userId} alcance=todos fecha=${new Date().toISOString()}`);
    await sendDocxResponse(res, buildDocument(grouped, 'Direcciones por territorio'), `direcciones-completas-${dateStamp()}`);
  } catch (error) {
    console.error('Export all territories error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

/**
 * GET /api/territories/from-neighborhood/:neighborhoodId/export/docx —
 * exporta el territorio completo al que pertenece el barrio indicado.
 * Requiere autenticación y rol admin (aplicado en la ruta).
 */
export const exportTerritoryByNeighborhoodDocx = async (req, res) => {
  // ID ya validado como entero positivo por middleware en la ruta
  const neighborhoodId = parseInt(req.params.neighborhoodId, 10);

  try {
    const found = await pool.query(
      `SELECT t.id, t.name
       FROM neighborhoods n
       JOIN territories t ON t.id = n.territory_id
       WHERE n.id = $1`,
      [neighborhoodId]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró un territorio para este barrio' });
    }

    const territory = found.rows[0];
    const grouped = await fetchGroupedData(territory.id);
    console.log(`[EXPORT] usuario=${req.userId} alcance=territorio:${territory.id} fecha=${new Date().toISOString()}`);
    await sendDocxResponse(
      res,
      buildDocument(grouped, `Direcciones — ${territory.name}`),
      `territorio-${safeFilenamePart(territory.name)}-${dateStamp()}`
    );
  } catch (error) {
    console.error('Export territory error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

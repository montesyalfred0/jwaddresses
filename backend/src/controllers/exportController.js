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
} from 'docx';

const DOCX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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
            a.age,
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
        age: row.age,
        address: row.address,
      });
    }
  }

  return [...territories.values()];
};

const cellParagraph = (text, options = {}) =>
  new Paragraph({ children: [new TextRun({ text: String(text ?? ''), ...options })] });

/** Construye una tabla de direcciones con fila de encabezado */
const buildAddressTable = (addresses) => {
  const columns = [
    { header: 'Nombre', width: 22 },
    { header: 'Familia', width: 18 },
    { header: 'Edad', width: 8 },
    { header: 'Dirección', width: 52 },
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map(
      (col) =>
        new TableCell({
          width: { size: col.width, type: WidthType.PERCENTAGE },
          shading: { fill: 'E8E8E8' },
          children: [cellParagraph(col.header, { bold: true })],
        })
    ),
  });

  const bodyRows = addresses.map((addr) =>
    new TableRow({
      children: [addr.name, addr.family, addr.age != null ? String(addr.age) : '', addr.address].map(
        (value, i) =>
          new TableCell({
            width: { size: columns[i].width, type: WidthType.PERCENTAGE },
            children: [cellParagraph(value)],
          })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
};

/** Construye el documento Word completo a partir de los datos agrupados */
const buildDocument = (grouped, docTitle) => {
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(docTitle)],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Generado el ${new Date().toLocaleString('es-CO')} · ${grouped.reduce(
            (total, t) => total + [...t.neighborhoods.values()].reduce((sum, nb) => sum + nb.addresses.length, 0),
            0
          )} direcciones`,
          italics: true,
          size: 20,
        }),
      ],
    }),
  ];

  for (const territory of grouped) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: grouped[0] && grouped.indexOf(territory) > 0,
        children: [new TextRun(territory.name)],
      })
    );

    if (territory.neighborhoods.size === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'Sin barrios registrados.', italics: true })] }));
      continue;
    }

    for (const neighborhood of territory.neighborhoods.values()) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240 },
          children: [new TextRun(neighborhood.name)],
        })
      );

      if (neighborhood.addresses.length === 0) {
        children.push(
          new Paragraph({ children: [new TextRun({ text: 'Sin direcciones registradas.', italics: true })] })
        );
        continue;
      }

      children.push(buildAddressTable(neighborhood.addresses));
      children.push(new Paragraph({ text: '' }));
    }
  }

  return new Document({
    creator: 'jwaddresses',
    title: docTitle,
    sections: [{ properties: {}, children }],
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

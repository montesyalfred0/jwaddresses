import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const territoryAPI = {
  getTerritories: () => api.get('/territories'),
};

export const addressAPI = {
  getAddresses: (neighborhoodId) => api.get(`/addresses/neighborhood/${neighborhoodId}`),
  createAddress: (data) => api.post('/addresses', data),
  updateAddress: (id, data) => api.put(`/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
};

/** Dispara la descarga de un blob en el navegador con el nombre del archivo indicado */
const triggerBrowserDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/** Descarga un .docx y lanza un Error legible si el servidor responde JSON de error */
const downloadDocx = async (url) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('wordprocessingml')) {
      throw new Error('El servidor devolvió una respuesta inesperada');
    }
    const disposition = response.headers['content-disposition'] || '';
    let filename = 'direcciones.docx';
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
      filename = decodeURIComponent(utf8Match[1]);
    } else {
      const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (asciiMatch) filename = asciiMatch[1];
    }
    triggerBrowserDownload(new Blob([response.data], { type: contentType }), filename);
  } catch (error) {
    const data = error.response?.data;
    if (data instanceof Blob && data.type.includes('application/json')) {
      let message = 'Error al generar el documento';
      try {
        const parsed = JSON.parse(await data.text());
        if (parsed.error) message = parsed.error;
      } catch {
        // respuesta JSON ilegible: se conserva el mensaje por defecto
      }
      throw new Error(message);
    }
    if (error.response?.status === 403) {
      throw new Error('No tiene permisos para descargar este documento');
    }
    if (error.response?.status === 429) {
      throw new Error('Límite de descargas alcanzado. Intente de nuevo en unos minutos.');
    }
    // Errores locales (sin respuesta del servidor): conservar el mensaje original
    if (!error.response) {
      throw error;
    }
    throw new Error('Error al generar el documento');
  }
};

export const exportAPI = {
  /** Descarga todas las direcciones agrupadas por territorio (solo admin) */
  downloadAllTerritories: () => downloadDocx('/territories/export/docx'),
  /** Descarga el territorio completo al que pertenece un barrio (solo admin) */
  downloadTerritoryFromNeighborhood: (neighborhoodId) =>
    downloadDocx(`/territories/from-neighborhood/${neighborhoodId}/export/docx`),
};

export default api;

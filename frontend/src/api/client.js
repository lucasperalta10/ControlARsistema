/**
 * Cliente HTTP para la API de ControlAR
 */

// Normaliza la URL base de la API para soportar URLs completas o relativas
const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const cleanUrl = rawApiUrl.replace(/\/+$/, '');
const API_BASE = cleanUrl.endsWith('/api') ? cleanUrl : (cleanUrl === '' ? '/api' : `${cleanUrl}/api`);

export async function apiRequest(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem('controlar_token');

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, config);
  } catch (networkError) {
    throw new Error('No se pudo conectar con el servidor. Verificá tu conexión a internet.');
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    data = { message: 'Respuesta inesperada del servidor.' };
  }

  if (!response.ok) {
    // Si la sesión expiró o es inválida, limpiar token
    if (response.status === 401 && endpoint !== '/auth/login') {
      localStorage.removeItem('controlar_token');
      localStorage.removeItem('controlar_user');
      window.dispatchEvent(new Event('auth-expired'));
    }

    const error = new Error(data.message || 'Ocurrió un error al procesar la solicitud.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default {
  apiRequest
};

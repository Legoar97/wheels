// ================================================
// 🔹 Configuración del Servidor de Optimización
// ================================================

const OPTIMIZATION_CONFIG = {
  // URL del servidor Python de optimización
  API_BASE_URL: 'http://localhost:5001/api',
  
  // Configuración de timeout para las peticiones
  TIMEOUT: 10000, // 10 segundos
  
  // Configuración de reintentos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  
  // Configuración de polling para verificar estado del servidor
  HEALTH_CHECK_INTERVAL: 30000, // 30 segundos
  
  // Configuración de fallback si el servidor no está disponible
  FALLBACK_ENABLED: true,
  FALLBACK_MESSAGE: 'Servidor de optimización no disponible. Usando ruta básica.'
};

// Función para verificar si el servidor está disponible
export const checkServerHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPTIMIZATION_CONFIG.TIMEOUT);
    
    const response = await fetch(`${OPTIMIZATION_CONFIG.API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return data.success === true;
    }
    
    return false;
  } catch (error) {
    console.warn('Servidor de optimización no disponible:', error.message);
    return false;
  }
};

// Función para obtener la URL base del API
export const getApiBaseUrl = () => {
  return OPTIMIZATION_CONFIG.API_BASE_URL;
};

// Función para obtener la configuración completa
export const getOptimizationConfig = () => {
  return { ...OPTIMIZATION_CONFIG };
};

export default OPTIMIZATION_CONFIG;

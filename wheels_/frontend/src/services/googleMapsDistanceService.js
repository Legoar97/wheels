/**
 * Servicio para calcular distancias reales usando Google Maps Distance Matrix API
 * Reemplaza el cálculo de distancia espacial por distancias de carretera reales
 */

class GoogleMapsDistanceService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    this.cache = new Map(); // Cache para evitar llamadas repetidas
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Calcula la distancia real entre dos puntos usando Google Maps
   * @param {Object} origin - {lat: number, lng: number}
   * @param {Object} destination - {lat: number, lng: number}
   * @returns {Promise<Object>} - {distance: number, duration: string, status: string}
   */
  async calculateDistance(origin, destination) {
    try {
      // Crear clave de cache
      const cacheKey = this.createCacheKey(origin, destination);
      
      // Verificar cache
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📍 Usando distancia desde cache:', cached);
        return cached;
      }

      // Validar API key
      if (!this.apiKey) {
        console.warn('⚠️ Google Maps API key no configurada, usando distancia espacial');
        return this.calculateHaversineDistance(origin, destination);
      }

      // Preparar parámetros para la API
      const params = new URLSearchParams({
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        key: this.apiKey,
        units: 'metric',
        mode: 'driving',
        traffic_model: 'best_guess',
        departure_time: 'now'
      });

      console.log('🚗 Calculando distancia real con Google Maps...');
      
      // Llamar a la API
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('❌ Error en Google Maps API:', data.status);
        return this.calculateHaversineDistance(origin, destination);
      }

      const element = data.rows[0]?.elements[0];
      
      if (!element || element.status !== 'OK') {
        console.warn('⚠️ No se pudo calcular ruta, usando distancia espacial');
        return this.calculateHaversineDistance(origin, destination);
      }

      // Extraer distancia y duración
      const distance = element.distance.value / 1000; // Convertir a km
      const duration = element.duration.text;
      const durationInTraffic = element.duration_in_traffic?.text || duration;

      const result = {
        distance: Math.round(distance * 100) / 100, // Redondear a 2 decimales
        duration: durationInTraffic,
        status: 'success',
        source: 'google_maps'
      };

      // Guardar en cache
      this.saveToCache(cacheKey, result);
      
      console.log('✅ Distancia calculada:', result);
      return result;

    } catch (error) {
      console.error('❌ Error al calcular distancia:', error);
      // Fallback a distancia espacial
      return this.calculateHaversineDistance(origin, destination);
    }
  }

  /**
   * Calcula múltiples distancias en lote (más eficiente)
   * @param {Object} origin - {lat: number, lng: number}
   * @param {Array} destinations - [{lat: number, lng: number}, ...]
   * @returns {Promise<Array>} - Array de resultados
   */
  async calculateMultipleDistances(origin, destinations) {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ Google Maps API key no configurada, usando distancia espacial');
        return destinations.map(dest => this.calculateHaversineDistance(origin, dest));
      }

      // Preparar destinos como string
      const destinationsStr = destinations
        .map(dest => `${dest.lat},${dest.lng}`)
        .join('|');

      const params = new URLSearchParams({
        origins: `${origin.lat},${origin.lng}`,
        destinations: destinationsStr,
        key: this.apiKey,
        units: 'metric',
        mode: 'driving',
        traffic_model: 'best_guess',
        departure_time: 'now'
      });

      console.log('🚗 Calculando múltiples distancias con Google Maps...');
      
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('❌ Error en Google Maps API:', data.status);
        return destinations.map(dest => this.calculateHaversineDistance(origin, dest));
      }

      const results = data.rows[0].elements.map((element, index) => {
        if (element.status !== 'OK') {
          return this.calculateHaversineDistance(origin, destinations[index]);
        }

        return {
          distance: Math.round((element.distance.value / 1000) * 100) / 100,
          duration: element.duration_in_traffic?.text || element.duration.text,
          status: 'success',
          source: 'google_maps'
        };
      });

      console.log('✅ Múltiples distancias calculadas:', results.length);
      return results;

    } catch (error) {
      console.error('❌ Error al calcular múltiples distancias:', error);
      return destinations.map(dest => this.calculateHaversineDistance(origin, dest));
    }
  }

  /**
   * Fallback: Calcula distancia espacial usando fórmula de Haversine
   * @param {Object} origin - {lat: number, lng: number}
   * @param {Object} destination - {lat: number, lng: number}
   * @returns {Object} - {distance: number, duration: string, status: string}
   */
  calculateHaversineDistance(origin, destination) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLon = (destination.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return {
      distance: Math.round(distance * 100) / 100,
      duration: '~' + Math.round(distance * 1.5) + ' min', // Estimación aproximada
      status: 'fallback',
      source: 'haversine'
    };
  }

  /**
   * Crea una clave única para el cache
   * @param {Object} origin - {lat: number, lng: number}
   * @param {Object} destination - {lat: number, lng: number}
   * @returns {string} - Clave de cache
   */
  createCacheKey(origin, destination) {
    // Redondear coordenadas para agrupar ubicaciones cercanas
    const roundCoord = (coord) => Math.round(coord * 1000) / 1000;
    return `${roundCoord(origin.lat)},${roundCoord(origin.lng)}-${roundCoord(destination.lat)},${roundCoord(destination.lng)}`;
  }

  /**
   * Obtiene resultado del cache si no ha expirado
   * @param {string} key - Clave de cache
   * @returns {Object|null} - Resultado cacheado o null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  /**
   * Guarda resultado en cache
   * @param {string} key - Clave de cache
   * @param {Object} data - Datos a cachear
   */
  saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Limpia el cache expirado
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtiene estadísticas del cache
   * @returns {Object} - Estadísticas del cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxAge: this.cacheExpiry,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Crear instancia singleton
const googleMapsDistanceService = new GoogleMapsDistanceService();

export default googleMapsDistanceService;

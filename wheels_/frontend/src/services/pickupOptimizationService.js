// ================================================
// 🔹 Servicio de Optimización de Rutas
// ================================================

const API_BASE_URL = 'http://localhost:5001/api';

class PickupOptimizationService {
  constructor() {
    this.currentTripData = null;
    this.currentStep = 0;
    this.tripType = 'ida'; // 'ida' o 'regreso'
  }

  // ================================================
  // 🔹 Métodos principales
  // ================================================

  /**
   * Verifica si el servidor está disponible
   * @returns {Promise<boolean>} True si el servidor está disponible
   */
  async isServerAvailable() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
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
      console.warn('⚠️ Error al verificar servidor:', error);
      return false;
    }
  }

  /**
   * Obtiene la optimización completa de un viaje
   * @param {string} tripId - ID del viaje
   * @param {string} tripType - Tipo de viaje ('ida' o 'regreso')
   * @returns {Promise<Object>} Datos optimizados del viaje
   */
  async getTripOptimization(tripId, tripType = 'ida') {
    try {
      console.log(`🔍 Obteniendo optimización para viaje ${tripId} (${tripType})`);
      
      // Verificar si el servidor está disponible
      const serverAvailable = await this.isServerAvailable();
      if (!serverAvailable) {
        throw new Error('Servidor de optimización no disponible. Por favor, inicia el servidor Python.');
      }
      
      const response = await fetch(`${API_BASE_URL}/trip-optimization/${tripId}?trip_type=${tripType}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al obtener optimización del viaje');
      }
      
      this.currentTripData = data.data;
      this.currentStep = 0;
      this.tripType = tripType;
      
      console.log('✅ Optimización obtenida:', data.data);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error al obtener optimización:', error);
      throw error;
    }
  }

  /**
   * Obtiene un paso específico del viaje
   * @param {string} tripId - ID del viaje
   * @param {number} stepNumber - Número del paso
   * @returns {Promise<Object>} Datos del paso
   */
  async getTripStep(tripId, stepNumber) {
    try {
      console.log(`🔍 Obteniendo paso ${stepNumber} del viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/trip-optimization/${tripId}/step/${stepNumber}?trip_type=${this.tripType}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al obtener paso del viaje');
      }
      
      return data.data;
      
    } catch (error) {
      console.error('❌ Error al obtener paso:', error);
      throw error;
    }
  }

  /**
   * Obtiene el siguiente paso del viaje
   * @param {string} tripId - ID del viaje
   * @returns {Promise<Object>} Datos del siguiente paso
   */
  async getNextStep(tripId) {
    try {
      console.log(`🔍 Obteniendo siguiente paso del viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/trip-optimization/${tripId}/next-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_step: this.currentStep,
          trip_type: this.tripType
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        if (data.trip_completed) {
          return { trip_completed: true };
        }
        throw new Error(data.error || 'Error al obtener siguiente paso');
      }
      
      this.currentStep = data.data.current_step;
      return data.data;
      
    } catch (error) {
      console.error('❌ Error al obtener siguiente paso:', error);
      throw error;
    }
  }

  /**
   * Marca un paso como completado
   * @param {string} tripId - ID del viaje
   * @param {number} stepNumber - Número del paso completado
   * @returns {Promise<Object>} Confirmación
   */
  async completeStep(tripId, stepNumber) {
    try {
      console.log(`✅ Completando paso ${stepNumber} del viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/trip-optimization/${tripId}/complete-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step_number: stepNumber,
          trip_type: this.tripType
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al completar paso');
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Error al completar paso:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado actual del viaje
   * @param {string} tripId - ID del viaje
   * @returns {Promise<Object>} Estado del viaje
   */
  async getTripStatus(tripId) {
    try {
      console.log(`🔍 Obteniendo estado del viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/trip-optimization/${tripId}/status?trip_type=${this.tripType}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al obtener estado del viaje');
      }
      
      return data.data;
      
    } catch (error) {
      console.error('❌ Error al obtener estado:', error);
      throw error;
    }
  }

  // ================================================
  // 🔹 Métodos de utilidad
  // ================================================

  /**
   * Obtiene el paso actual
   * @returns {number} Número del paso actual
   */
  getCurrentStep() {
    return this.currentStep;
  }

  /**
   * Establece el paso actual
   * @param {number} step - Número del paso
   */
  setCurrentStep(step) {
    this.currentStep = step;
  }

  /**
   * Obtiene el tipo de viaje actual
   * @returns {string} Tipo de viaje ('ida' o 'regreso')
   */
  getTripType() {
    return this.tripType;
  }

  /**
   * Establece el tipo de viaje
   * @param {string} type - Tipo de viaje ('ida' o 'regreso')
   */
  setTripType(type) {
    this.tripType = type;
  }

  /**
   * Obtiene los datos del viaje actual
   * @returns {Object|null} Datos del viaje
   */
  getCurrentTripData() {
    return this.currentTripData;
  }

  /**
   * Limpia los datos del viaje actual
   */
  clearCurrentTrip() {
    this.currentTripData = null;
    this.currentStep = 0;
    this.tripType = 'ida';
  }

  /**
   * Verifica si hay más pasos disponibles
   * @returns {boolean} True si hay más pasos
   */
  hasMoreSteps() {
    if (!this.currentTripData) return false;
    
    const totalSteps = this.currentTripData.optimized_route?.total_steps || 0;
    return this.currentStep < totalSteps - 1;
  }

  /**
   * Obtiene el progreso del viaje como porcentaje
   * @returns {number} Porcentaje de progreso (0-100)
   */
  getProgressPercentage() {
    if (!this.currentTripData) return 0;
    
    const totalSteps = this.currentTripData.optimized_route?.total_steps || 0;
    if (totalSteps === 0) return 0;
    
    return Math.round((this.currentStep / (totalSteps - 1)) * 100);
  }

  /**
   * Formatea la duración en minutos a texto legible
   * @param {number} minutes - Duración en minutos
   * @returns {string} Duración formateada
   */
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}min`;
    }
  }

  /**
   * Formatea la distancia en metros a texto legible
   * @param {number} meters - Distancia en metros
   * @returns {string} Distancia formateada
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      const km = (meters / 1000).toFixed(1);
      return `${km} km`;
    }
  }
}

// ================================================
// 🔹 Instancia singleton
// ================================================

export const pickupOptimizationService = new PickupOptimizationService();
export default pickupOptimizationService;

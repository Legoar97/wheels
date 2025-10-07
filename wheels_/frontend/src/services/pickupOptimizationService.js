// wheels_/frontend/src/services/pickupOptimizationService.js

// ✅ ACTUALIZADO: Apuntar al puerto correcto (5000 en lugar de 5001)
const API_BASE_URL = 'http://localhost:5000/api';

class PickupOptimizationService {
  constructor() {
    this.currentTripData = null;
    this.currentStep = 0;
    this.tripType = 'ida';
  }

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
        // ✅ ACTUALIZADO: Verificar que route_optimization esté habilitado
        return data.success === true && data.services?.route_optimization === 'enabled';
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️ Error al verificar servidor:', error);
      return false;
    }
  }

  async getTripOptimization(tripId, tripType = 'ida') {
    try {
      console.log(`🔍 Obteniendo optimización para viaje ${tripId} (${tripType})`);
      
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

  // ===== NUEVO: Obtener siguiente paso =====
  async getNextStep(tripId) {
    try {
      const nextStepNumber = this.currentStep + 1;
      console.log(`🔍 Obteniendo siguiente paso (${nextStepNumber}) del viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/trip-optimization/${tripId}/step/${nextStepNumber}?trip_type=${this.tripType}`);
      const data = await response.json();
      
      if (!data.success) {
        // Si no hay más pasos, el viaje está completo
        if (data.error && data.error.includes('Paso no encontrado')) {
          return { trip_completed: true };
        }
        throw new Error(data.error || 'Error al obtener siguiente paso');
      }
      
      this.currentStep = nextStepNumber;
      return data.data;
      
    } catch (error) {
      console.error('❌ Error al obtener siguiente paso:', error);
      throw error;
    }
  }

  async completeStep(tripId, stepNumber) {
    try {
      console.log(`✅ Completando paso ${stepNumber} del viaje ${tripId}`);
      
      // El backend no tiene un endpoint específico para completar pasos
      // Solo avanzamos el contador local
      this.currentStep = stepNumber;
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error al completar paso:', error);
      throw error;
    }
  }

  // ===== NUEVO: Obtener estado del viaje =====
  async getTripStatus(tripId) {
    try {
      console.log(`🔍 Obteniendo estado del viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/trip/${tripId}/status`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al obtener estado del viaje');
      }
      
      return data.trip;
      
    } catch (error) {
      console.error('❌ Error al obtener estado:', error);
      throw error;
    }
  }

  // Resto de métodos sin cambios...
  getCurrentStep() {
    return this.currentStep;
  }

  setCurrentStep(step) {
    this.currentStep = step;
  }

  getTripType() {
    return this.tripType;
  }

  setTripType(type) {
    this.tripType = type;
  }

  getCurrentTripData() {
    return this.currentTripData;
  }

  clearCurrentTrip() {
    this.currentTripData = null;
    this.currentStep = 0;
    this.tripType = 'ida';
  }

  hasMoreSteps() {
    if (!this.currentTripData) return false;
    
    const totalSteps = this.currentTripData.optimized_route?.total_steps || 0;
    return this.currentStep < totalSteps - 1;
  }

  getProgressPercentage() {
    if (!this.currentTripData) return 0;
    
    const totalSteps = this.currentTripData.optimized_route?.total_steps || 0;
    if (totalSteps === 0) return 0;
    
    return Math.round((this.currentStep / (totalSteps - 1)) * 100);
  }

  formatDuration(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}min`;
    }
  }

  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      const km = (meters / 1000).toFixed(1);
      return `${km} km`;
    }
  }
}

export const pickupOptimizationService = new PickupOptimizationService();
export default pickupOptimizationService;
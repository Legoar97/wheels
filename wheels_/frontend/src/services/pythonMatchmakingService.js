// wheels_/frontend/src/services/pythonMatchmakingService.js

// Función para calcular distancia espacial (fallback)
function calculateSpatialDistance(point1, point2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Servicio para conectar con el script Python de emparejamiento
export class PythonMatchmakingService {
  
  // ===== ACTUALIZADO: Usar el endpoint correcto =====
  static async executePythonAPI() {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log("🐍 Llamando a la API Python de matchmaking...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // ✅ ACTUALIZADO: Usar GET en lugar de POST
      const response = await fetch(`${API_BASE_URL}/api/python-matchmaking`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API Python no disponible (${response.status}). Asegúrate de que el servidor Python esté ejecutándose en ${API_BASE_URL}`);
      }
      
      const data = await response.json();
      
      console.log("✅ Respuesta de la API Python:", data);
      
      if (!data.success) {
        throw new Error(data.error || 'Error en la API Python');
      }
      
      return data.matches || [];
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('La API Python no responde (timeout). Verifica que el servidor esté ejecutándose.');
      }
      
      if (error.message.includes('fetch')) {
        throw new Error('No se pudo conectar con la API Python. Asegúrate de ejecutar: python wheels_api.py');
      }
      
      console.error("❌ Error en API Python:", error);
      throw error;
    }
  }
  
  // ===== NUEVO: Obtener estado activo del usuario =====
  static async getUserActiveState(userEmail) {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log(`🔍 Obteniendo estado activo para: ${userEmail}`);
      
      const response = await fetch(`${API_BASE_URL}/api/user-active-state/${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error("❌ Error obteniendo estado del usuario:", error);
      throw error;
    }
  }
  
  // ===== ACTUALIZADO: Usar el endpoint correcto para matches del usuario =====
  static async getUserMatches(userEmail) {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log(`🔍 Obteniendo matches para usuario: ${userEmail}`);
      
      const response = await fetch(`${API_BASE_URL}/api/matches/${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo matches del usuario');
      }
      
      return data.matches || [];
      
    } catch (error) {
      console.error("❌ Error obteniendo matches del usuario:", error);
      throw error;
    }
  }
  
  // ===== NUEVO: Obtener viaje del pasajero =====
  static async getPassengerTrip(userEmail) {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log(`🔍 Obteniendo viaje del pasajero: ${userEmail}`);
      
      const response = await fetch(`${API_BASE_URL}/api/passenger-trip/${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No hay viaje activo
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        return null;
      }
      
      return data.trip;
      
    } catch (error) {
      console.error("❌ Error obteniendo viaje del pasajero:", error);
      return null;
    }
  }
  
  // ===== NUEVO: Obtener viaje activo del conductor =====
  static async getDriverActiveTrip(driverEmail) {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log(`🔍 Obteniendo viaje activo del conductor: ${driverEmail}`);
      
      const response = await fetch(`${API_BASE_URL}/api/driver/${encodeURIComponent(driverEmail)}/active-trip`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No hay viaje activo
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        return null;
      }
      
      return data.trip;
      
    } catch (error) {
      console.error("❌ Error obteniendo viaje del conductor:", error);
      return null;
    }
  }
  
  // ===== NUEVO: Completar dropoff de pasajero =====
  static async completePassengerDropoff(tripId, passengerEmail) {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log(`✅ Completando dropoff de ${passengerEmail} en viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/trip/${tripId}/complete-passenger/${encodeURIComponent(passengerEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error completando dropoff');
      }
      
      return data;
      
    } catch (error) {
      console.error("❌ Error completando dropoff:", error);
      throw error;
    }
  }
  
  // ===== NUEVO: Completar viaje completo =====
  static async completeTrip(tripId, driverEmail) {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log(`🏁 Completando viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/trip/${tripId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_email: driverEmail
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error completando viaje');
      }
      
      return data;
      
    } catch (error) {
      console.error("❌ Error completando viaje:", error);
      throw error;
    }
  }
  
  // ===== NUEVO: Obtener estado del viaje =====
  static async getTripStatus(tripId) {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log(`🔍 Obteniendo estado del viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/trip/${tripId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo estado');
      }
      
      return data.trip;
      
    } catch (error) {
      console.error("❌ Error obteniendo estado del viaje:", error);
      throw error;
    }
  }
  
  // ===== NUEVO: Obtener pasajeros del viaje =====
  static async getTripPassengers(tripId) {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log(`🔍 Obteniendo pasajeros del viaje ${tripId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/trip/${tripId}/passengers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo pasajeros');
      }
      
      return data;
      
    } catch (error) {
      console.error("❌ Error obteniendo pasajeros del viaje:", error);
      throw error;
    }
  }
  
  // Mantener funciones existentes...
  static async executeSupabaseFallback() {
    try {
      console.log("🔄 Usando Supabase como fallback...");
      
      const { supabase } = await import('../lib/supabaseClient');
      
      const { data: searchingPool, error: poolError } = await supabase
        .from('searching_pool')
        .select(`
          *,
          profiles!driver_id(*)
        `)
        .eq('status', 'searching')
        .order('created_at', { ascending: false });
      
      if (poolError) {
        console.error("Error obteniendo searching pool:", poolError);
        return [];
      }
      
      if (!searchingPool || searchingPool.length === 0) {
        console.log("No hay registros activos en searching pool");
        return [];
      }
      
      const drivers = searchingPool.filter(record => record.tipo_de_usuario === 'conductor');
      const passengers = searchingPool.filter(record => record.tipo_de_usuario === 'pasajero');
      
      console.log(`Fallback: ${drivers.length} conductores, ${passengers.length} pasajeros`);
      
      const matches = [];
      
      for (const driver of drivers) {
        const matchedPassengers = passengers
          .filter(passenger => passenger.destino === driver.destino)
          .slice(0, driver.available_seats || 1)
          .map(passenger => {
            const distance = calculateSpatialDistance(
              { lat: driver.pickup_lat, lng: driver.pickup_lng },
              { lat: passenger.pickup_lat, lng: passenger.pickup_lng }
            );
            
            return {
              pasajero_id: passenger.id,
              nombre: passenger.nombre_usuario || 'Pasajero',
              correo: passenger.correo_usuario,
              pickup: passenger.pickup_address,
              destino: passenger.destino,
              distance_km: Math.round(distance * 100) / 100,
              duration: `~${Math.round(distance * 1.5)} min`,
              distance_source: 'spatial_fallback'
            };
          });
        
        if (matchedPassengers.length > 0) {
          const sortedPassengers = matchedPassengers.sort((a, b) => a.distance_km - b.distance_km);
          
          matches.push({
            conductor_id: driver.id,
            nombre_conductor: driver.nombre_usuario || 'Conductor',
            correo_conductor: driver.correo_usuario,
            pickup: driver.pickup_address,
            destino: driver.destino,
            available_seats: driver.available_seats || 1,
            price_per_seat: driver.price_per_seat || 0,
            pasajeros_asignados: sortedPassengers,
            pickup_order: sortedPassengers.map((passenger, index) => ({
              step: index + 1,
              passenger_id: passenger.pasajero_id,
              nombre: passenger.nombre,
              pickup_address: passenger.pickup,
              distance_from_previous: index === 0 ? 0 : passenger.distance_km,
              estimated_time: passenger.duration
            }))
          });
        }
      }
      
      console.log(`✅ Fallback completado: ${matches.length} matches encontrados`);
      return matches;
      
    } catch (error) {
      console.error("❌ Error en fallback de Supabase:", error);
      return [];
    }
  }
  
  static async checkApiAvailability() {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log("🔍 API Python no disponible:", error.message);
      return false;
    }
  }

  static async runMatchmaking() {
    try {
      const forceFallback = import.meta.env.VITE_FORCE_FALLBACK === 'true';
      const apiDisabled = import.meta.env.VITE_PYTHON_API_URL === 'disabled';
      
      if (forceFallback || apiDisabled) {
        console.log("🔄 Modo fallback forzado, usando Supabase directamente");
        return await this.executeSupabaseFallback();
      }
      
      const isApiAvailable = await this.checkApiAvailability();
      
      if (!isApiAvailable) {
        console.log("📱 API Python no disponible, usando fallback directamente");
        return await this.executeSupabaseFallback();
      }
      
      return await this.executePythonAPI();
      
    } catch (error) {
      console.error("❌ Error en API Python:", error);
      console.log("🔄 Cambiando a fallback de Supabase...");
      
      try {
        return await this.executeSupabaseFallback();
      } catch (fallbackError) {
        console.error("❌ Error en fallback:", fallbackError);
        return [];
      }
    }
  }
}
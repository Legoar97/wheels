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
  
  // Función para ejecutar el script Python (en producción esto sería una API)
  static async executePythonScript() {
    try {
      // En desarrollo, simulamos la respuesta del Python
      // En producción, esto sería una llamada HTTP a tu servidor Python
      
      console.log("🐍 Ejecutando script Python de emparejamiento...");
      
      // Simular delay del procesamiento Python
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular la respuesta JSON que retorna tu Python (con distancias de Google Maps)
      const pythonResponse = [
        {
          "conductor_id": "15589b1c-7e6b-45e2-b89d-69d1c95b842b",
          "nombre_conductor": "juan",
          "pickup": "Av. Boyacá #17a-63, Bogotá, Colombia",
          "destino": "Hacia la universidad",
          "pasajeros_asignados": [
            {
              "pasajero_id": "4b15ca14-ff3e-4d8e-bda0-2f2ff5b7af03",
              "nombre": "jesus",
              "pickup": "Av. Boyacá #17a-63, Bogotá, Colombia",
              "destino": "Hacia la universidad",
              "distance_km": 2.3,
              "duration": "8 min",
              "distance_source": "google_maps"
            }
          ]
        }
      ];
      
      console.log("✅ Respuesta del Python:", pythonResponse);
      return pythonResponse;
      
    } catch (error) {
      console.error("❌ Error ejecutando Python:", error);
      throw new Error("No se pudo ejecutar el emparejamiento Python");
    }
  }
  
  // Función para ejecutar Python en producción (API REST)
  static async executePythonAPI() {
    try {
      // Determinar la URL base de la API
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      
      console.log("🐍 Llamando a la API Python de matchmaking...");
      
      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch(`${API_BASE_URL}/api/python-matchmaking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'run_matchmaking',
          timestamp: new Date().toISOString()
        }),
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
        throw new Error('No se pudo conectar con la API Python. Asegúrate de ejecutar: python matchmaking_api.py');
      }
      
      console.error("❌ Error en API Python:", error);
      throw error;
    }
  }
  
  // Función para ejecutar Python localmente (usando child_process en Node.js)
  static async executePythonLocal() {
    try {
      // En desarrollo local, podrías usar Node.js para ejecutar Python
      // Esto requiere que tengas Node.js con child_process
      
      console.log("🐍 Ejecutando Python localmente...");
      
      // Simular ejecución local (con distancias de Google Maps)
      const localResponse = [
        {
          "conductor_id": "local-test-123",
          "nombre_conductor": "Conductor Local",
          "pickup": "Ubicación de prueba",
          "destino": "Destino de prueba",
          "pasajeros_asignados": [
            {
              "pasajero_id": "local-passenger-456",
              "nombre": "Pasajero Local",
              "pickup": "Pickup de prueba",
              "destino": "Destino de prueba",
              "distance_km": 1.8,
              "duration": "6 min",
              "distance_source": "google_maps"
            }
          ]
        }
      ];
      
      return localResponse;
      
    } catch (error) {
      console.error("❌ Error ejecutando Python local:", error);
      throw error;
    }
  }
  
  // Función para obtener matches de un usuario específico por email
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
  
  // Función para obtener matches usando Supabase como fallback
  static async executeSupabaseFallback() {
    try {
      console.log("🔄 Usando Supabase como fallback...");
      
      // Importar supabase dinámicamente
      const { supabase } = await import('../lib/supabaseClient');
      
      // Obtener datos del searching pool activo
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
      
      // Separar conductores y pasajeros
      const drivers = searchingPool.filter(record => record.tipo_de_usuario === 'conductor');
      const passengers = searchingPool.filter(record => record.tipo_de_usuario === 'pasajero');
      
      console.log(`Fallback: ${drivers.length} conductores, ${passengers.length} pasajeros`);
      
      const matches = [];
      
      // Emparejamiento básico por destino (con distancia espacial como fallback)
      for (const driver of drivers) {
        const matchedPassengers = passengers
          .filter(passenger => passenger.destino === driver.destino)
          .slice(0, driver.available_seats || 1)
          .map(passenger => {
            // Calcular distancia espacial como fallback
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
          // Ordenar pasajeros por distancia para optimizar ruta
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
            // Agregar información adicional para el orden de recogida
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
  
  // Función para detectar si es un dispositivo móvil
  static isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Función para verificar si la API está disponible
  static async checkApiAvailability() {
    try {
      const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos para verificación rápida
      
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

  // Función principal que decide cómo ejecutar Python
  static async runMatchmaking() {
    try {
      // Verificar si se fuerza el uso de fallback
      const forceFallback = import.meta.env.VITE_FORCE_FALLBACK === 'true';
      const apiDisabled = import.meta.env.VITE_PYTHON_API_URL === 'disabled';
      
      if (forceFallback || apiDisabled) {
        console.log("🔄 Modo fallback forzado, usando Supabase directamente");
        return await this.executeSupabaseFallback();
      }
      
      // Verificar disponibilidad de la API primero
      const isApiAvailable = await this.checkApiAvailability();
      
      if (!isApiAvailable) {
        console.log("📱 API Python no disponible, usando fallback directamente");
        return await this.executeSupabaseFallback();
      }
      
      // Intentar usar la API real de Python
      return await this.executePythonAPI();
      
    } catch (error) {
      console.error("❌ Error en API Python:", error);
      console.log("🔄 Cambiando a fallback de Supabase...");
      
      // Si la API falla, usar Supabase como fallback
      try {
        return await this.executeSupabaseFallback();
      } catch (fallbackError) {
        console.error("❌ Error en fallback:", fallbackError);
        console.log("🔄 Usando simulación como último recurso...");
        return await this.executePythonScript();
      }
    }
  }
}


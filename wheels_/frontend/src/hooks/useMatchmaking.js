import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import googleMapsDistanceService from '../services/googleMapsDistanceService';

export const useMatchmaking = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }
    };
    getUser();
  }, []);

  // Función para ejecutar el emparejamiento
  const runMatchmaking = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Por ahora, simulamos el emparejamiento usando las funciones de Supabase
      // En producción, esto se ejecutaría en un servidor Python
      const result = await performMatchmaking();
      setMatches(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función que simula el emparejamiento usando Supabase con Google Maps
  const performMatchmaking = async () => {
    try {
      console.log('🚀 Iniciando emparejamiento con Google Maps...');
      
      // Obtener todos los usuarios en el pool de búsqueda
      const { data: searchingPool, error: poolError } = await supabase
        .from('searching_pool')
        .select(`
          *,
          profiles!inner(*)
        `)
        .eq('status', 'searching');

      if (poolError) throw poolError;

      // Separar conductores y pasajeros
      const drivers = searchingPool.filter(item => item.vehicle_id);
      const passengers = searchingPool.filter(item => !item.vehicle_id);

      console.log(`🔍 Encontrados ${drivers.length} conductores y ${passengers.length} pasajeros`);

      const matches = [];

      // Para cada conductor, buscar pasajeros compatibles
      for (const driver of drivers) {
        const driverLocation = { lat: driver.pickup_lat, lng: driver.pickup_lng };
        const matchedPassengers = [];

        // Filtrar pasajeros por destino primero (más eficiente)
        const compatiblePassengers = passengers.filter(passenger => 
          passenger.dropoff_address === driver.dropoff_address
        );

        console.log(`🚗 Procesando conductor ${driver.profiles?.full_name} - ${compatiblePassengers.length} pasajeros compatibles por destino`);

        if (compatiblePassengers.length === 0) continue;

        // Preparar ubicaciones de pasajeros para cálculo en lote
        const passengerLocations = compatiblePassengers.map(p => ({
          lat: p.pickup_lat,
          lng: p.pickup_lng
        }));

        // Calcular distancias en lote usando Google Maps
        const distanceResults = await googleMapsDistanceService.calculateMultipleDistances(
          driverLocation,
          passengerLocations
        );

        // Procesar resultados y crear matches
        for (let i = 0; i < compatiblePassengers.length; i++) {
          const passenger = compatiblePassengers[i];
          const distanceResult = distanceResults[i];
          
          // Verificar distancia máxima (5km)
          if (distanceResult.distance > 5) {
            console.log(`❌ Pasajero ${passenger.profiles?.full_name} muy lejos: ${distanceResult.distance}km`);
            continue;
          }
          
          // Verificar cupos disponibles
          if (matchedPassengers.length < driver.available_seats) {
            matchedPassengers.push({
              pasajero_id: passenger.driver_id,
              nombre: passenger.profiles?.full_name || 'Pasajero',
              pickup: passenger.pickup_address,
              destino: passenger.dropoff_address,
              distance_km: distanceResult.distance,
              duration: distanceResult.duration,
              distance_source: distanceResult.source
            });
            
            console.log(`✅ Pasajero asignado: ${passenger.profiles?.full_name} - ${distanceResult.distance}km (${distanceResult.duration})`);
          }
        }

        if (matchedPassengers.length > 0) {
          matches.push({
            conductor_id: driver.driver_id,
            nombre_conductor: driver.profiles?.full_name || 'Conductor',
            pickup: driver.pickup_address,
            destino: driver.dropoff_address,
            vehicle_info: {
              available_seats: driver.available_seats,
              price_per_seat: driver.price_per_seat || 0
            },
            pasajeros_asignados: matchedPassengers
          });
          
          console.log(`🎯 Match creado para conductor: ${driver.profiles?.full_name} con ${matchedPassengers.length} pasajeros`);
        }
      }

      console.log(`🎉 Emparejamiento completado: ${matches.length} matches encontrados`);
      return matches;
    } catch (error) {
      console.error('❌ Error en emparejamiento:', error);
      throw error;
    }
  };

  // Función para calcular distancia entre dos puntos
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Función para crear solicitud de viaje
  const createTripRequest = async (passengerId, driverPoolId, pickupAddress, dropoffAddress, 
                                  pickupLat, pickupLng, dropoffLat, dropoffLng) => {
    try {
      const { data, error } = await supabase
        .from('trip_requests')
        .insert({
          passenger_id: passengerId,
          driver_pool_id: driverPoolId,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_lat: dropoffLat,
          dropoff_lng: dropoffLng,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      throw error;
    }
  };

  // Función para confirmar viaje
  const confirmTrip = async (driverId, passengerId, pickupAddress, dropoffAddress,
                            pickupLat, pickupLng, dropoffLat, dropoffLng) => {
    try {
      const { data, error } = await supabase
        .from('confirmed_trips')
        .insert({
          driver_id: driverId,
          passenger_id: passengerId,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_lat: dropoffLat,
          dropoff_lng: dropoffLng,
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al confirmar viaje:', error);
      throw error;
    }
  };

  // Función para obtener matches específicos del usuario actual
  const getUserMatches = useCallback(() => {
    if (!currentUser) return [];
    
    // Si es conductor, buscar sus pasajeros asignados
    if (currentUser.vehicle_id) {
      return matches.filter(match => match.conductor_id === currentUser.id);
    }
    
    // Si es pasajero, buscar su conductor asignado
    return matches.filter(match => 
      match.pasajeros_asignados.some(passenger => passenger.pasajero_id === currentUser.id)
    );
  }, [matches, currentUser]);

  return {
    matches,
    loading,
    error,
    currentUser,
    runMatchmaking,
    createTripRequest,
    confirmTrip,
    getUserMatches
  };
};







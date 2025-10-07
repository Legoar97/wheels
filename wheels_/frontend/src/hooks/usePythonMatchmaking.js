import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PythonMatchmakingService } from '../services/pythonMatchmakingService';

export const usePythonMatchmaking = () => {
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

  // Función que obtiene la respuesta del Python usando el servicio
  const getPythonMatchmakingResult = async () => {
    // Usar el servicio que ejecuta tu Python
    return await PythonMatchmakingService.runMatchmaking();
  };

  // Función para ejecutar el emparejamiento del Python
  const runPythonMatchmaking = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener el resultado del emparejamiento Python
      const pythonMatches = await getPythonMatchmakingResult();
      setMatches(pythonMatches);
      
      console.log("🎯 Matches del Python:", pythonMatches);
    } catch (err) {
      setError(err.message);
      console.error("❌ Error en emparejamiento Python:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener matches específicos del usuario actual usando email
  const getUserMatches = useCallback((onlyDrivers = false) => {
    if (!currentUser || !currentUser.email) return [];
    
    const userEmail = currentUser.email;
    const userMatches = [];
    
    console.log("🔍 Buscando matches para usuario:", userEmail, "onlyDrivers:", onlyDrivers);
    console.log("🔍 Matches disponibles:", matches);
    
    for (const match of matches) {
      const conductorEmail = match.conductor_correo || match.correo_conductor;
      if (conductorEmail === userEmail) {
        if (onlyDrivers) {
          userMatches.push({ ...match, role: 'driver' });
          console.log("✅ Agregado como conductor (onlyDrivers=true)");
        }
        continue;
      }
      if (!onlyDrivers) {
        const isPassengerAlreadyAssigned = match.pasajeros_asignados?.some(passenger => {
          const passengerEmail = passenger.pasajero_correo || passenger.correo;
          return passengerEmail === userEmail;
        });
        if (isPassengerAlreadyAssigned) {
          // ¡Este es el match que el pasajero debe ver!
          userMatches.push({ ...match, role: 'assigned_passenger' });
          console.log("✅ Match asignado para pasajero:", match);
          continue;
        }
        // Si el conductor tiene cupos disponibles, mostrarlo como opción para el pasajero
        const availableSeats = match.available_seats || 0;
        const assignedPassengers = match.pasajeros_asignados?.length || 0;
        
        if (availableSeats > assignedPassengers) {
          userMatches.push({
            ...match,
            role: 'available_driver' // Nuevo rol para conductores disponibles
          });
          console.log("✅ Conductor disponible encontrado para pasajero:", match);
        }
      }
    }
    
    console.log("🎯 Matches encontrados para usuario:", userMatches);
    return userMatches;
  }, [matches, currentUser]);

  // Función para crear solicitud de viaje usando correo (NUEVA VERSIÓN)
  const createTripRequestByEmail = async (passengerEmail, driverPoolId, pickupAddress, dropoffAddress, 
                                  pickupLat, pickupLng, dropoffLat, dropoffLng) => {
    try {
      console.log("🔧 Creando solicitud de viaje usando correo:", passengerEmail);
      
      const { data, error } = await supabase
        .rpc('create_trip_request_by_email', {
          passenger_email_param: passengerEmail,
          driver_pool_id_param: driverPoolId,
          pickup_address_param: pickupAddress,
          dropoff_address_param: dropoffAddress,
          pickup_lat_param: pickupLat,
          pickup_lng_param: pickupLng,
          dropoff_lat_param: dropoffLat,
          dropoff_lng_param: dropoffLng
        });

      if (error) {
        console.error("❌ Error en función SQL por correo:", error);
        throw error;
      }
      
      console.log("✅ Solicitud creada exitosamente con función por correo, ID:", data);
      
      // Obtener la solicitud completa
      const { data: requestData, error: selectError } = await supabase
        .from('trip_requests')
        .select('*')
        .eq('id', data)
        .single();

      if (selectError) throw selectError;
      return requestData;
      
    } catch (error) {
      console.error('❌ Error al crear solicitud por correo:', error);
      throw error;
    }
  };

  // Función para crear solicitud de viaje usando la función SQL segura (VERSIÓN ANTERIOR)
  const createTripRequest = async (passengerId, driverPoolId, pickupAddress, dropoffAddress, 
                                  pickupLat, pickupLng, dropoffLat, dropoffLng) => {
    try {
      console.log("🔧 Creando solicitud de viaje...");
      
      // Intentar usar la función SQL segura primero
      let data, error;
      
      try {
        const result = await supabase
          .rpc('create_trip_request_secure', {
            passenger_id_param: passengerId,
            driver_pool_id_param: driverPoolId,
            pickup_address_param: pickupAddress,
            dropoff_address_param: dropoffAddress,
            pickup_lat_param: pickupLat,
            pickup_lng_param: pickupLng,
            dropoff_lat_param: dropoffLat,
            dropoff_lng_param: dropoffLng
          });
        
        data = result.data;
        error = result.error;
        
        if (!error) {
          console.log("✅ Solicitud creada con función segura, ID:", data);
        }
        
      } catch (secureError) {
        console.log("⚠️ Función segura no disponible, usando fallback...");
        
        // Usar función fallback
        const fallbackResult = await supabase
          .rpc('create_trip_request_fallback', {
            passenger_id_param: passengerId,
            driver_pool_id_param: driverPoolId,
            pickup_address_param: pickupAddress,
            dropoff_address_param: dropoffAddress,
            pickup_lat_param: pickupLat,
            pickup_lng_param: pickupLng,
            dropoff_lat_param: dropoffLat,
            dropoff_lng_param: dropoffLng
          });
          
        data = fallbackResult.data;
        error = fallbackResult.error;
        
        if (!error) {
          console.log("✅ Solicitud creada con función fallback, ID:", data);
        }
      }

      if (error) {
        console.error("❌ Error en función SQL:", error);
        
        // Si ambas funciones fallan, intentar inserción directa
        console.log("⚠️ Funciones SQL no disponibles, insertando directamente...");
        
        const directResult = await supabase
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
            status: 'pending',
            seats_requested: 1,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (directResult.error) {
          throw directResult.error;
        }
        
        console.log("✅ Solicitud creada por inserción directa:", directResult.data);
        return directResult.data;
      }
      
      // Obtener la solicitud completa
      const { data: requestData, error: selectError } = await supabase
        .from('trip_requests')
        .select('*')
        .eq('id', data)
        .single();

      if (selectError) throw selectError;
      return requestData;
      
    } catch (error) {
      console.error('❌ Error al crear solicitud:', error);
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

  return {
    matches,
    loading,
    error,
    currentUser,
    runPythonMatchmaking,
    createTripRequest,
    createTripRequestByEmail,
    confirmTrip,
    getUserMatches
  };
};

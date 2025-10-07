import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [activeTrip, setActiveTrip] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(null);

  useEffect(() => {
    // Cargar estado del viaje desde localStorage al iniciar la app
    const storedTrip = localStorage.getItem('activeTrip');
    const storedScreen = localStorage.getItem('currentScreen');
    if (storedTrip) {
      setActiveTrip(JSON.parse(storedTrip));
    }
    if (storedScreen) {
      setCurrentScreen(storedScreen);
    }
  }, []);

  // Función para detectar el estado del usuario
  const detectUserState = async (userEmail) => {
    if (!userEmail) return { state: 'idle', data: null };

    try {
      // 1. ¿Está en viaje activo? (start_of_trip)
      const { data: activeTrip } = await supabase
        .from('start_of_trip')
        .select('*')
        .eq('correo', userEmail)
        .order('created_at', { ascending: false })
        .limit(1);

      if (activeTrip?.length > 0) {
        const trip = activeTrip[0];
        return { 
          state: 'in_trip', 
          data: { 
            ...trip, 
            role: trip.tipo_de_usuario,
            trip_id: trip.trip_id, // Asegurar que trip_id esté disponible
            state: 'in_trip'
          },
          screen: '/app' // Siempre redirigir a la pantalla principal de matchmaking
        };
      }

      // 2. ¿Tiene aceptación pendiente? (driver_acceptances)
      const { data: acceptance } = await supabase
        .from('driver_acceptances')
        .select('*')
        .or(`passenger_email.eq.${userEmail},driver_email.eq.${userEmail}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (acceptance?.length > 0) {
        const role = acceptance[0].driver_email === userEmail ? 'conductor' : 'pasajero';
        return { 
          state: 'acceptance_pending', 
          data: { ...acceptance[0], role },
          screen: '/app'
        };
      }

      // 3. ¿Está emparejado? (searching_pool con status 'matched')
      const { data: matched } = await supabase
        .from('searching_pool')
        .select('*')
        .eq('correo_usuario', userEmail)
        .eq('status', 'matched')
        .order('created_at', { ascending: false })
        .limit(1);

      if (matched?.length > 0) {
        return { 
          state: 'matched', 
          data: { ...matched[0], role: matched[0].tipo_de_usuario },
          screen: '/app'
        };
      }

      // 4. ¿Está buscando? (searching_pool con status 'searching')
      const { data: searching } = await supabase
        .from('searching_pool')
        .select('*')
        .eq('correo_usuario', userEmail)
        .eq('status', 'searching')
        .order('created_at', { ascending: false })
        .limit(1);

      if (searching?.length > 0) {
        return { 
          state: 'searching', 
          data: { ...searching[0], role: searching[0].tipo_de_usuario },
          screen: '/app'
        };
      }

      return { state: 'idle', data: null, screen: null };
    } catch (error) {
      console.error('Error detectando estado del usuario:', error);
      return { state: 'idle', data: null, screen: null };
    }
  };

  // Función para establecer un viaje activo
  const setTrip = (tripDetails, screenPath) => {
    setActiveTrip(tripDetails);
    setCurrentScreen(screenPath);
    localStorage.setItem('activeTrip', JSON.stringify(tripDetails));
    localStorage.setItem('currentScreen', screenPath);
  };

  // Función para limpiar el estado del viaje
  const clearTrip = () => {
    setActiveTrip(null);
    setCurrentScreen(null);
    localStorage.removeItem('activeTrip');
    localStorage.removeItem('currentScreen');
  };

  // Función para verificar y actualizar el estado
  const checkAndUpdateState = async (userEmail) => {
    const state = await detectUserState(userEmail);
    
    if (state.state !== 'idle') {
      console.log('✅ TripContext - Viaje activo detectado:', state.state);
      setTrip(state.data, state.screen);
    } else {
      clearTrip();
    }
    return state;
  };

  return (
    <TripContext.Provider value={{ 
      activeTrip, 
      currentScreen, 
      setTrip, 
      clearTrip, 
      setCurrentScreen,
      detectUserState,
      checkAndUpdateState
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};

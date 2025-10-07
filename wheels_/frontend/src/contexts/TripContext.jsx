// wheels_/frontend/src/contexts/TripContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { PythonMatchmakingService } from '@/services/pythonMatchmakingService';

// Crear el contexto
export const TripContext = createContext(null);

// Provider del contexto
export const TripProvider = ({ children }) => {
  const [activeTrip, setActiveTrip] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(null);

  useEffect(() => {
    const storedTrip = localStorage.getItem('activeTrip');
    const storedScreen = localStorage.getItem('currentScreen');
    if (storedTrip) {
      setActiveTrip(JSON.parse(storedTrip));
    }
    if (storedScreen) {
      setCurrentScreen(storedScreen);
    }
  }, []);

  const detectUserState = async (userEmail) => {
    if (!userEmail) return { state: 'idle', data: null };

    try {
      console.log('🔍 Detectando estado del usuario:', userEmail);
      
      // ✅ NUEVA PRIORIDAD: Primero verificar si hay un viaje activo en trip_data
      const { data: tripDataRecords } = await supabase
        .from('trip_data')
        .select('*')
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (tripDataRecords && tripDataRecords.length > 0) {
        // Buscar si el usuario es conductor o pasajero en algún viaje
        for (const trip of tripDataRecords) {
          // Verificar si es conductor
          const { data: driverProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', trip.driver_id)
            .single();
          
          if (driverProfile?.email === userEmail) {
            console.log('✅ Usuario es conductor en viaje activo:', trip.id);
            return {
              state: 'in_trip',
              data: {
                trip_id: trip.id,
                role: 'conductor',
                state: 'in_trip',
                status: 'in_progress'
              },
              screen: `/trip/${trip.id}`
            };
          }
          
          // Verificar si es pasajero
          const passengersData = trip.passengers_data || [];
          const isPassenger = passengersData.some(p => 
            p.passenger_email === userEmail || p.correo === userEmail
          );
          
          if (isPassenger) {
            console.log('✅ Usuario es pasajero en viaje activo:', trip.id);
            return {
              state: 'in_trip',
              data: {
                trip_id: trip.id,
                role: 'pasajero',
                state: 'in_trip',
                status: 'in_progress'
              },
              screen: `/trip/${trip.id}`
            };
          }
        }
      }
      
      // Fallback al método anterior
      const stateData = await PythonMatchmakingService.getUserActiveState(userEmail);
      
      if (stateData.state === 'in_trip') {
        return {
          state: 'in_trip',
          data: {
            ...stateData.trip,
            role: stateData.trip.tipo_de_usuario,
            trip_id: stateData.trip.trip_id,
            state: 'in_trip'
          },
          screen: `/trip/${stateData.trip.trip_id}`
        };
      }
      
      return { state: 'idle', data: null, screen: null };
      
    } catch (error) {
      console.error('Error detectando estado del usuario:', error);
      return { state: 'idle', data: null, screen: null };
    }
  };

  const setTrip = (tripDetails, screenPath) => {
    setActiveTrip(tripDetails);
    setCurrentScreen(screenPath);
    localStorage.setItem('activeTrip', JSON.stringify(tripDetails));
    localStorage.setItem('currentScreen', screenPath);
  };

  const clearTrip = () => {
    setActiveTrip(null);
    setCurrentScreen(null);
    localStorage.removeItem('activeTrip');
    localStorage.removeItem('currentScreen');
  };

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

  const value = {
    activeTrip, 
    currentScreen, 
    setTrip, 
    clearTrip, 
    setCurrentScreen,
    detectUserState,
    checkAndUpdateState
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};
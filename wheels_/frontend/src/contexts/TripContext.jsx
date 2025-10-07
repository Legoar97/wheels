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
          screen: '/app'
        };
      }
      
      if (stateData.state === 'acceptance_pending') {
        return {
          state: 'acceptance_pending',
          data: {
            ...stateData.acceptance,
            role: stateData.acceptance.driver_email === userEmail ? 'conductor' : 'pasajero'
          },
          screen: '/app'
        };
      }
      
      if (stateData.state === 'matched') {
        return {
          state: 'matched',
          data: {
            ...stateData.pool,
            role: stateData.pool.tipo_de_usuario
          },
          screen: '/app'
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
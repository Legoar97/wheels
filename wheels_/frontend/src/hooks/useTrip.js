// wheels_/frontend/src/hooks/useTrip.js

import { useContext } from 'react';
import { TripContext } from '@/contexts/TripContext';

export const useTrip = () => {
  const context = useContext(TripContext);
  
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  
  return context;
};
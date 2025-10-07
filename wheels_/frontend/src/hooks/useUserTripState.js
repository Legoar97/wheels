import { useState, useEffect } from 'react';
import { useTrip } from '@/contexts/TripContext';
import { useAuth } from '@/contexts/AuthContext';

export const useUserTripState = () => {
  const { user } = useAuth();
  const { checkAndUpdateState, activeTrip, clearTrip } = useTrip();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      clearTrip();
      return;
    }

    const checkState = async () => {
      setIsChecking(true);
      try {
        await checkAndUpdateState(user.email);
      } catch (error) {
        console.error('Error checking user trip state:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkState();

    // TEMPORALMENTE DESHABILITADO: Verificación automática para evitar loops
    // const interval = setInterval(checkState, 60000);

    return () => {
      // clearInterval(interval);
    };
  }, [user?.email, checkAndUpdateState, clearTrip]);

  return {
    activeTrip,
    isChecking,
    hasActiveTrip: !!activeTrip
  };
};

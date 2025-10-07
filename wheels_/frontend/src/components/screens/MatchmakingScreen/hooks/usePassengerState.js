import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { usePythonMatchmaking } from '@/hooks/usePythonMatchmaking';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const getTripDirection = (destination) => {
    if (!destination) return 'unknown';
    const dest = destination.toLowerCase();
    const universityKeywords = ['universidad', 'university', 'hacia la universidad', 'externado'];
    return universityKeywords.some(keyword => dest.includes(keyword)) ? 'to_university' : 'from_university';
};

export const usePassengerState = (searchRequestId, onPassengerRequest) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { matches, loading, runPythonMatchmaking, createTripRequest, getUserMatches } = usePythonMatchmaking();

  const [initialLoading, setInitialLoading] = useState(true);
  const [driverInfo, setDriverInfo] = useState(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [passengerConfirmed, setPassengerConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [tripId, setTripId] = useState(null);
  const tripStartedNotifiedRef = useRef(false);

  useEffect(() => {
    if (!searchRequestId || !user?.email) {
      setInitialLoading(false);
      return;
    }

    const checkDriverAcceptance = async () => {
      // Prioridad 1: LocalStorage
      const storageKey = `driver_accepted_${user.email}`;
      const driverData = localStorage.getItem(storageKey);
      if (driverData) {
        try {
          const parsedData = JSON.parse(driverData);
          setDriverInfo(parsedData);
          setInitialLoading(false);
          return true;
        } catch (e) { console.error("Error parsing driver data from localStorage", e); }
      }
      
      // Prioridad 2: Base de datos
      const { data: acceptanceData, error } = await supabase
        .from('driver_acceptances')
        .select('*')
        .eq('passenger_email', user.email)
        .order('accepted_at', { ascending: false })
        .limit(1);

      if (acceptanceData && acceptanceData.length > 0) {
        const acceptance = acceptanceData[0];
        setDriverInfo({
          conductor_email: acceptance.driver_email,
          conductor_full_name: acceptance.driver_name,
          accepted_at: new Date(acceptance.accepted_at).toLocaleString(),
          trip_info: acceptance.trip_info,
        });
        setInitialLoading(false);
        return true;
      }
      return false;
    };

    const checkPassengerInStartOfTrip = async () => {
        const { data } = await supabase
            .from('start_of_trip')
            .select('*')
            .eq('correo', user.email)
            .eq('tipo_de_usuario', 'pasajero')
            .limit(1);

        if (data && data.length > 0) {
            setTripStarted(true);
        }
    }

    const initialChecks = async () => {
        const found = await checkDriverAcceptance();
        if (found) {
            await checkPassengerInStartOfTrip();
        } else {
            await runPythonMatchmaking();
        }
        setInitialLoading(false);
    };

    initialChecks();

    const pollingInterval = setInterval(async () => {
        if (!driverInfo) {
            await checkDriverAcceptance();
            await runPythonMatchmaking();
        }
    }, 10000);

    const startOfTripChannel = supabase.channel(`start-of-trip-${user.email}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'start_of_trip', filter: `correo=eq.${user.email}` },
        (payload) => {
          if (payload.new?.tipo_de_usuario === 'pasajero' && !tripStartedNotifiedRef.current) {
            toast({ title: "¡El viaje ha comenzado!", description: "El conductor ha iniciado el viaje." });
            setTripStarted(true);
            tripStartedNotifiedRef.current = true;
          }
        }
      ).subscribe();
      
    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(startOfTripChannel);
    };
  }, [searchRequestId, user, driverInfo]);

  useEffect(() => {
    const fetchTripId = async () => {
      if (!user?.id || !driverInfo || tripId) return;
      const { data } = await supabase
        .from('confirmed_trips')
        .select('id')
        .eq('passenger_id', user.id)
        .in('status', ['confirmed', 'in_progress'])
        .maybeSingle();
      if (data) setTripId(data.id);
    };
    fetchTripId();
  }, [user, driverInfo, tripId]);

  const handlePassengerRequestTrip = async (driverMatch, selectedSeats) => {
    setIsSubmitting(driverMatch.id);
    try {
      const tripRequest = await createTripRequest(
        user.id, driverMatch.id, driverMatch.pickup_address, driverMatch.dropoff_address
      );
      toast({ title: "Solicitud Enviada", description: "Esperando la confirmación del conductor..." });
      if (onPassengerRequest) onPassengerRequest(tripRequest.id, { conductor_full_name: driverMatch.profile.full_name });
    } catch (err) {
      toast({ title: "Error al solicitar", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleConfirmPickup = async () => {
      const direction = getTripDirection(driverInfo?.trip_info?.destino);
      const confirmationType = direction === 'to_university' ? 'picked_up' : 'dropped_off';
      if (tripId && user?.email) {
          await supabase.from('trip_confirmations').upsert({
              trip_id: tripId,
              passenger_email: user.email,
              confirmed: true,
              confirmation_type: confirmationType
          }, { onConflict: ['trip_id', 'passenger_email'] });
      }
      setPassengerConfirmed(true);
      toast({ title: "¡Confirmado!", description: "Gracias por confirmar." });
  };

  const availableDrivers = getUserMatches(false).filter(match => match.role === 'available_driver' && match.conductor_email !== user?.email);

  return {
    initialLoading,
    driverInfo,
    tripStarted,
    passengerConfirmed,
    availableDrivers,
    isSubmitting,
    tripId,
    handlePassengerRequestTrip,
    handleConfirmPickup,
    getTripDirection
  };
};
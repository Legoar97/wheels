import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { usePythonMatchmaking } from '@/hooks/usePythonMatchmaking';
import { useTrip } from '@/hooks/useTrip';
import { toast } from '@/components/ui/use-toast';

export const useDriverState = (searchRequestId, onTripConfirmed) => {
  const { user } = useAuth();
  const { setTrip } = useTrip();
  const { loading, matches, runPythonMatchmaking, getUserMatches } = usePythonMatchmaking();

  const [initialLoading, setInitialLoading] = useState(true);
  const [userMatches, setUserMatches] = useState([]);
  const [acceptedPassengers, setAcceptedPassengers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(null);
  
  const [showPickupOrder, setShowPickupOrder] = useState(false);
  const [currentTripId, setCurrentTripId] = useState(null);
  const [preservedPassengers, setPreservedPassengers] = useState([]);
  const [currentPickupStep, setCurrentPickupStep] = useState(0);

  // Efecto #1: Se encarga del polling y la verificación de un viaje ya activo
  useEffect(() => {
    if (!searchRequestId || showPickupOrder) {
      setInitialLoading(false);
      return;
    }

    const checkAndFetch = async () => {
      // Primero, verifica si este conductor ya está en un viaje 'matched'
      const { data: currentTrip } = await supabase
        .from('searching_pool')
        .select('status, confirmed_trip_id')
        .eq('id', searchRequestId)
        .single();
        
      // Si ya está en un viaje, llamamos a matchmaking una vez para obtener los datos
      // y la lógica reactiva del efecto #2 se encargará de mostrar la pantalla correcta.
      if (currentTrip?.status === 'matched') {
        await runPythonMatchmaking();
        // No necesitamos hacer nada más aquí, el siguiente useEffect se activará
        return; 
      }

      // Si no, llamamos a matchmaking para buscar nuevos pasajeros
      await runPythonMatchmaking();
    };

    checkAndFetch(); // Llama una vez al cargar la pantalla
    const interval = setInterval(checkAndFetch, 10000); // Y luego sigue buscando cada 10 segundos
    
    return () => clearInterval(interval); // Limpia el intervalo al desmontar el componente

  }, [searchRequestId, showPickupOrder, runPythonMatchmaking]);

  // Efecto #2: Es REACTIVO. Se dispara CADA VEZ que la lista `matches` del hook principal cambia.
  useEffect(() => {
    // Si el matchmaking está en proceso, no hacemos nada aún
    if (loading) return;

    // Si ya no está cargando, quitamos la pantalla de carga inicial
    setInitialLoading(false);

    // Verificamos si hay matches del backend
    if (matches && matches.length > 0) {
      const driverMatches = getUserMatches(true); // Filtra los matches para este conductor
      
      // Si se encontraron matches para este conductor, actualizamos el estado
      if (driverMatches.length > 0) {
        setUserMatches(driverMatches);

        // Lógica para restaurar la vista de recogida si el viaje ya estaba 'matched'
        const currentPoolStatus = matches.find(m => m.driver_pool_id === searchRequestId)?.status;
        if (currentPoolStatus === 'matched') {
          setPreservedPassengers(driverMatches[0]?.pasajeros_asignados || []);
          setShowPickupOrder(true);
        }
      } else {
        // Si no hay matches específicos para este conductor, limpiamos la lista
        setUserMatches([]);
      }
    } else {
      // Si no hay matches en general, limpiamos la lista
      setUserMatches([]);
    }
  }, [matches, loading, getUserMatches, searchRequestId]); // Dependencias clave: matches y loading

  
  // --- FUNCIONES DE ACCIÓN DEL CONDUCTOR (Sin cambios) ---

  const handleDriverAcceptPassenger = async (passengerMatch) => {
    const passengerEmail = passengerMatch.pasajero_correo || passengerMatch.correo;
    setIsSubmitting(passengerEmail);

    const driverInfo = {
      conductor_email: user?.email,
      conductor_full_name: user?.user_metadata?.full_name || 'Conductor',
      passenger_email: passengerEmail,
      accepted_at: new Date().toISOString(), // Usar ISO para consistencia
      trip_info: { pickup: passengerMatch.pickup, destino: passengerMatch.destino }
    };

    localStorage.setItem(`driver_accepted_${passengerEmail}`, JSON.stringify(driverInfo));
    
    await supabase.from('driver_acceptances').insert({
        passenger_email: passengerEmail,
        driver_email: user?.email,
        driver_name: driverInfo.conductor_full_name,
        trip_info: driverInfo.trip_info,
        accepted_at: driverInfo.accepted_at
    });

    setAcceptedPassengers(prev => [...new Set([...prev, passengerEmail])]); // Evitar duplicados
    toast({ title: "Pasajero Aceptado", description: `${passengerMatch.nombre} ha sido notificado.` });
    setIsSubmitting(null);
  };
  
  const handleStartTrip = async () => {
    setIsSubmitting('start_trip');
    try {
      const { data: tripDataId, error } = await supabase
        .rpc('start_trip_with_data', { driver_pool_id_param: searchRequestId });
        
      if (error) throw error;
      
      const currentAssignedPassengers = userMatches.length > 0 ? (userMatches[0].pasajeros_asignados || userMatches) : [];
      
      setPreservedPassengers(currentAssignedPassengers);
      setCurrentTripId(tripDataId);
      setShowPickupOrder(true);
      setTrip({ trip_id: tripDataId, role: 'conductor', state: 'in_trip' }, '/app');
      toast({ title: "¡Viaje Iniciado!", description: "Los pasajeros han sido notificados." });

    } catch (err) {
      toast({ title: "Error al iniciar viaje", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleCompleteTrip = async () => {
    try {
      // Idealmente, llamar a una función RPC que archive el viaje y limpie los datos.
      // Por ahora, solo reseteamos el estado del frontend.
      toast({ title: "¡Viaje Completado!", description: "Todos los pasajeros han sido recogidos."});

      setShowPickupOrder(false);
      setPreservedPassengers([]);
      setCurrentTripId(null);
      if (onTripConfirmed) onTripConfirmed({ trip_data_id: currentTripId });

    } catch (error) {
       toast({ title: "Error al completar", description: error.message, variant: "destructive" });
    }
  };

  const handleNextPickup = () => {
    if (currentPickupStep < preservedPassengers.length - 1) {
      setCurrentPickupStep(prev => prev + 1);
    } else {
      handleCompleteTrip();
    }
  };

  const handleBackFromPickup = () => {
      setShowPickupOrder(false);
      setCurrentPickupStep(0);
      setCurrentTripId(null);
      setPreservedPassengers([]);
  };

  return {
    initialLoading,
    userMatches,
    acceptedPassengers,
    isSubmitting,
    showPickupOrder,
    preservedPassengers,
    currentPickupStep,
    loading,
    handleDriverAcceptPassenger,
    handleStartTrip,
    handleNextPickup,
    handleBackFromPickup,
  };
};
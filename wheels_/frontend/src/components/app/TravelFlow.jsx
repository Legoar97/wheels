import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserTypeScreen from '@/components/screens/UserTypeScreen';
import DirectionScreen from '@/components/screens/DirectionScreen';
import TripDetailsScreen from '@/components/screens/TripDetailsScreen';
import MatchmakingScreen from '@/components/screens/MatchmakingScreen';
import WaitingScreen from '@/components/screens/WaitingScreen';
import PassengerWaitingScreen from '@/components/screens/PassengerWaitingScreen';
import PassengerPickupScreen from '@/components/screens/PassengerPickupScreen';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePythonMatchmaking } from '@/hooks/usePythonMatchmaking';
import { useTrip } from '@/contexts/TripContext';

const TravelFlow = ({ currentUser, pageVariants, pageTransition }) => {
  const [currentStep, setCurrentStep] = useState('userType');
  const [userType, setUserType] = useState(currentUser?.user_type || null);
  const [searchRequestId, setSearchRequestId] = useState(null);
  const [passengerRequestInfo, setPassengerRequestInfo] = useState(null);
  
  const navigate = useNavigate();
  const { activeTrip } = useTrip();

  const handleFindMatches = ({ searchRequestId }) => {
    setSearchRequestId(searchRequestId);
    setCurrentStep('matchmaking');
  };

  /**
   * Esta función se ejecuta cuando la confirmación final del viaje llega desde Supabase.
   * La llama el componente MatchmakingScreen cuando el status en la tabla 'searching_pool' cambia a 'matched'.
   * Su única responsabilidad es redirigir a ambos usuarios a la pantalla del viaje en vivo.
   */
  const handleTripConfirmed = (payload) => {
    console.log("⚠️ ATENCIÓN: handleTripConfirmed llamado - COMENTADO para evitar redirección automática");
    console.log("¡Confirmación final recibida en TravelFlow! Payload:", payload);

    // COMENTADO TEMPORALMENTE PARA EVITAR REDIRECCIÓN AUTOMÁTICA
    // const tripId = payload.confirmed_trip_id;

    // if (tripId) {
    //   toast({
    //     title: "¡Viaje Confirmado!",
    //     description: "Tu viaje está listo. Te estamos redirigiendo...",
    //     variant: "default",
    //     duration: 3000,
    //   });
    //   navigate(`/trip/${tripId}`);
    // } else {
    //   console.error("Error: No se recibió un ID de viaje en la confirmación final.");
    //   toast({
    //     title: "Error de Confirmación",
    //     description: "Hubo un problema al recibir los detalles del viaje. Por favor, revisa tus viajes activos.",
    //     variant: "destructive",
    //   });
    //   navigate('/app');
    // }
  };

  const handleCancelSearch = async () => {
    if (searchRequestId) {
      await supabase.from('searching_pool').update({ status: 'cancelled' }).eq('id', searchRequestId);
      toast({ title: "Búsqueda cancelada", description: "Tu solicitud de viaje ha sido cancelada." });
    }
    resetTravelFlow();
  };
  
  const resetTravelFlow = () => {
    setCurrentStep('userType');
    setUserType(null);
    setSearchRequestId(null);
  };
  
  const handleStartWaiting = () => {
    toast({ 
      title: "Esperando", 
      description: "Te notificaremos cuando aparezca un viaje compatible" 
    });
    setCurrentStep('waiting');
  };

  // Nueva función para manejar cuando el pasajero hace una solicitud
  const handlePassengerRequest = (tripRequestId, driverInfo) => {
    console.log("🎯 TravelFlow: Pasajero hizo solicitud:", { tripRequestId, driverInfo });
    console.log("🎯 TravelFlow: Cambiando step a passengerWaiting");
    
    setPassengerRequestInfo({
      tripRequestId,
      driverInfo
    });
    setCurrentStep('passengerWaiting'); // CORREGIDO: Ahora sí cambia a passengerWaiting
    
    console.log("✅ TravelFlow: Estado actualizado");
  };

  // Función para manejar cuando el conductor acepta al pasajero
  const handlePassengerTripAccepted = (tripData) => {
    console.log("✅ Conductor aceptó al pasajero:", tripData);
    
    // Verificar si tenemos un confirmed_trip_id
    if (tripData.id || tripData.confirmed_trip_id) {
      const tripId = tripData.id || tripData.confirmed_trip_id;
      navigate(`/trip/${tripId}`);
    } else {
      // Si no tenemos un trip confirmado, redirigir al dashboard
      toast({
        title: "Viaje Aceptado",
        description: "Tu solicitud fue aceptada. Revisa tus viajes activos.",
        variant: "default"
      });
      navigate('/app');
    }
  };

  // Función para manejar cuando el pasajero cancela su solicitud
  const handlePassengerCancel = () => {
    setPassengerRequestInfo(null);
    setCurrentStep('matchmaking');
  };

  const [direction, setDirection] = useState(null);
  const [formData, setFormData] = useState({
    date: '', time: '', pickupAddress: '', pickupLatitude: null, pickupLongitude: null,
    dropoffAddress: '', dropoffLatitude: null, dropoffLongitude: null, seats: '', price: ''
  });

  const { currentUser: authUser, getUserMatches } = usePythonMatchmaking();
  const userMatches = getUserMatches(false);
  const [passengerTrip, setPassengerTrip] = useState(null);

  // Detecta si el usuario es pasajero y tiene un viaje asignado
  const assignedMatch = userMatches.find(m => m.role === 'assigned_passenger');
  let assignedPassenger = null;
  if (assignedMatch && authUser) {
    assignedPassenger = assignedMatch.pasajeros_asignados.find(
      p => p.correo === authUser.email || p.pasajero_correo === authUser.email
    );
  }

  // NUEVO: Si no hay matches activos, consulta el endpoint backend para el viaje en curso
  useEffect(() => {
    if (!authUser?.email) return;
    if (userMatches.length === 0) {
      fetch(`http://localhost:5000/api/passenger-trip/${encodeURIComponent(authUser.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.trip) {
            setPassengerTrip(data.trip);
          }
        });
    } else {
      setPassengerTrip(null);
    }
  }, [authUser, userMatches]);

  if (assignedMatch && assignedPassenger && assignedMatch.status === 'in_progress') {
    return (
      <PassengerPickupScreen
        passenger={assignedPassenger}
        tripId={assignedMatch.driver_pool_id}
        tripType="ida" // o "regreso" según corresponda
      />
    );
  }

  // NUEVO: Si hay viaje activo desde el contexto, redirigir automáticamente
  useEffect(() => {
    if (activeTrip && activeTrip.state === 'in_trip') {
      console.log('🚗 TravelFlow - Viaje activo detectado, redirigiendo a matchmaking');
      setCurrentStep('matchmaking');
      // Establecer el searchRequestId basado en el viaje activo
      if (activeTrip.trip_id) {
        setSearchRequestId(activeTrip.trip_id);
      }
    }
  }, [activeTrip]);

  // NUEVO: Si hay viaje en curso desde el backend, mostrar pantalla de recogida SOLO si status es 'in_progress'
  if (passengerTrip && passengerTrip.status === 'in_progress') {
    return (
      <PassengerPickupScreen
        passenger={passengerTrip.passenger}
        tripId={passengerTrip.trip_id}
        tripType="ida"
      />
    );
  }

  console.log("🎬 TravelFlow rendering - currentStep:", currentStep, "passengerRequestInfo:", passengerRequestInfo);

  // Si hay un viaje activo, forzar el paso a matchmaking
  if (activeTrip && activeTrip.state === 'in_trip' && currentStep === 'userType') {
    console.log('🚗 TravelFlow - Viaje activo detectado, saltando a matchmaking');
    setCurrentStep('matchmaking');
  }

  switch (currentStep) {
    case 'userType':
      return <UserTypeScreen setCurrentStep={setCurrentStep} userType={userType} setUserType={(type) => { setUserType(type); setCurrentStep('direction'); }} pageVariants={pageVariants} pageTransition={pageTransition} />;
    
    case 'direction':
      return <DirectionScreen setCurrentStep={setCurrentStep} direction={direction} setDirection={setDirection} pageVariants={pageVariants} pageTransition={pageTransition} onBack={() => { setDirection(null); setCurrentStep('userType'); }} setTripFormData={setFormData} />;
    
    case 'tripDetails':
      return <TripDetailsScreen userType={userType} direction={direction} formData={formData} setFormData={setFormData} onBack={() => setCurrentStep('direction')} onFindMatches={handleFindMatches} pageVariants={pageVariants} pageTransition={pageTransition} currentUser={authUser} />;
    
    case 'matchmaking':
      return (
        <MatchmakingScreen 
          searchRequestId={searchRequestId} 
          onTripConfirmed={handleTripConfirmed} 
          onBack={() => setCurrentStep('tripDetails')} 
          currentUserType={userType} 
          onStartWaiting={handleStartWaiting}
          onPassengerRequest={handlePassengerRequest}
          pageVariants={pageVariants} 
          pageTransition={pageTransition} 
        />
      );

    case 'waiting':
      return (
        <WaitingScreen 
          tripRequest={{ id: searchRequestId }} 
          onMatchFound={handleTripConfirmed} 
          onCancel={handleCancelSearch} 
          pageVariants={pageVariants} 
          pageTransition={pageTransition} 
        />
      );

    case 'passengerWaiting':
      return (
        <PassengerWaitingScreen 
          tripRequestId={passengerRequestInfo?.tripRequestId}
          driverInfo={passengerRequestInfo?.driverInfo}
          onTripAccepted={handlePassengerTripAccepted}
          onCancel={handlePassengerCancel}
          pageVariants={pageVariants} 
          pageTransition={pageTransition} 
        />
      );
    
    default:
      return <UserTypeScreen setCurrentStep={setCurrentStep} userType={userType} setUserType={(type) => { setUserType(type); setCurrentStep('direction'); }} pageVariants={pageVariants} pageTransition={pageTransition} />;
  }
};

export default TravelFlow;
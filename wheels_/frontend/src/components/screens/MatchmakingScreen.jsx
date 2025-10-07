import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, UserCheck, Clock, Users, DollarSign, Car, MapPin, Navigation, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePythonMatchmaking } from '@/hooks/usePythonMatchmaking';
import { useTrip } from '@/contexts/TripContext';
import { useNavigate } from 'react-router-dom';
// import DriverPickupScreen from './DriverPickupScreen';
// import DriverPickupFallback from './DriverPickupFallback';

// --- COMPONENTE-HIJO: Tarjeta para la vista del PASAJERO (Sin cambios) ---
const PassengerMatchCard = ({ match, onConfirm, isRequesting }) => {
  const [selectedSeats, setSelectedSeats] = useState(1);
  const seatOptions = Array.from({ length: match.available_seats || 1 }, (_, i) => i + 1);

  return (
    <Card className="bg-card/80 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <img
            className="w-12 h-12 rounded-full"
            alt={`Avatar de ${match.profile.full_name}`}
            src={match.profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${match.profile.full_name}`}
          />
          <div>
            <p className="font-semibold text-lg">{match.profile.full_name}</p>
            <p className="text-sm text-muted-foreground">
              <Clock className="w-3 h-3 mr-1.5 inline-block" />
              Sale a las: {new Date(match.trip_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-b border-border py-3 my-3">
          <div className="flex flex-col">
            <Label className="text-xs text-muted-foreground mb-1">Precio por Pasajero</Label>
            <div className="flex items-center font-bold">
              <DollarSign className="w-4 h-4 mr-2 text-primary"/>
              {match.price_per_seat.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
            </div>
          </div>
          <div className="flex flex-col">
            <Label className="text-xs text-muted-foreground mb-1">Cupos Disponibles</Label>
            <div className="flex items-center font-bold">
              <Users className="w-4 h-4 mr-2 text-primary"/>
              {match.available_seats}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-grow">
            <Label htmlFor={`seats-${match.id}`}>¿Cuántos cupos necesitas?</Label>
            <Select value={String(selectedSeats)} onValueChange={(value) => setSelectedSeats(Number(value))}>
              <SelectTrigger id={`seats-${match.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seatOptions.map(seat => (
                  <SelectItem key={seat} value={String(seat)}>
                    {seat} cupo{seat > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => onConfirm(match, selectedSeats)}
            disabled={isRequesting}
            className="self-end mt-auto"
          >
            {isRequesting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserCheck className="w-4 h-4 mr-2" />
            )}
            {isRequesting ? 'Enviando...' : 'Solicitar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- COMPONENTE-HIJO: Tarjeta para la vista del CONDUCTOR (MODIFICADO) ---
const DriverRequestCard = ({ request, onAccept, isAccepting, aceptada }) => {
  const seatsRequested = request.seats_requested || 1;
  const passengerProfile = request.passenger_profile || {  };

  return (
    <Card className="bg-card/80 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <img
              className="w-12 h-12 rounded-full"
              alt={`Avatar de ${passengerProfile.full_name}`}
              src={passengerProfile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${passengerProfile.full_name}`}
            />
            <div>
              <p className="font-semibold text-lg">{passengerProfile.full_name || 'Pasajero'}</p>
              <p className="text-sm text-muted-foreground">
                <Users className="w-3 h-3 mr-1.5 inline-block" />
                Solicita: {seatsRequested} cupo{seatsRequested > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button onClick={() => onAccept(request)} disabled={isAccepting || aceptada}>
            <Car className="w-4 h-4 mr-2" />
            {aceptada ? 'Aceptado' : isAccepting ? 'Aceptando...' : 'Aceptar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- COMPONENTE PRINCIPAL (MODIFICADO) ---
const MatchmakingScreen = ({
  searchRequestId,
  onTripConfirmed,
  onBack,
  currentUserType,
  onPassengerRequest,
}) => {
  const { user } = useAuth();
  const { setTrip, clearTrip } = useTrip();
  const {
    matches,
    loading,
    error,
    currentUser,
    runPythonMatchmaking,
    createTripRequest,
    createTripRequestByEmail,
    confirmTrip,
    getUserMatches
  } = usePythonMatchmaking();

  const [isPolling, setIsPolling] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [acceptedPassengers, setAcceptedPassengers] = useState([]);
  const [userMatches, setUserMatches] = useState([]);
  const [passengerWaitingForDriver, setPassengerWaitingForDriver] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [showPickupOptimization, setShowPickupOptimization] = useState(false);
  const [currentTripId, setCurrentTripId] = useState(null);
  const [showPickupOrder, setShowPickupOrder] = useState(false);
  const [currentPickupStep, setCurrentPickupStep] = useState(0);
  const [tripStarted, setTripStarted] = useState(false);
  const tripStartedNotifiedRef = useRef(false); // Evitar notificaciones duplicadas
  const [preservedPassengers, setPreservedPassengers] = useState([]); // NUEVO: Preservar datos de pasajeros
  const [passengerConfirmed, setPassengerConfirmed] = useState(false); // NUEVO: Estado de confirmación del pasajero

  const pollingRef = useRef(null);
  const waitingTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const [tripId, setTripId] = useState(null); // Nuevo estado para el tripId

  const isPassenger = currentUserType === 'pasajero';

  // NUEVO: Función helper para determinar la dirección del viaje
  const getTripDirection = (destination) => {
    if (!destination) return 'unknown';
    
    const dest = destination.toLowerCase();
    const universityKeywords = ['universidad', 'university', 'hacia la universidad', 'externado'];
    
    return universityKeywords.some(keyword => dest.includes(keyword)) ? 'to_university' : 'from_university';
  };

  // --- Lógica para el PASAJERO ---
  useEffect(() => {
    if (!searchRequestId || !isPassenger) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setInitialLoading(false);
      return;
    }

    // Verificar si un conductor ya aceptó al pasajero
    const checkDriverAcceptance = async () => {
      if (user?.email) {
        // MÉTODO PRINCIPAL: Verificar localStorage (más confiable)
        const storageKey = `driver_accepted_${user.email}`;
        const genericKey = `driver_accepted_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        console.log("🔍 Pasajero: Verificando localStorage con claves:", { storageKey, genericKey });
        
        // Intentar con ambas claves
        let driverData = localStorage.getItem(storageKey) || localStorage.getItem(genericKey);
        console.log("🔍 Pasajero: Datos encontrados en localStorage:", driverData);

        if (driverData) {
          try {
            const basicDriverInfo = JSON.parse(driverData);
            console.log("🎉 ¡Conductor encontrado! Información básica:", basicDriverInfo);

            // Obtener información completa del conductor desde la tabla profiles
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('email', basicDriverInfo.conductor_email)
              .single();

            if (error) {
              console.error("Error al obtener perfil del conductor:", error);
              // Usar información básica si no se puede obtener de profiles
              setDriverInfo({
                ...basicDriverInfo,
                conductor_full_name: basicDriverInfo.conductor_name,
                conductor_email: basicDriverInfo.conductor_email
              });
            } else {
              console.log("✅ Perfil del conductor obtenido desde profiles:", profileData);
              setDriverInfo({
                ...basicDriverInfo,
                conductor_full_name: profileData.full_name,
                conductor_email: profileData.email
              });
            }

            setInitialLoading(false); // Mostrar información del conductor
            return; // Salir temprano si encontramos datos
          } catch (error) {
            console.error("Error al parsear información del conductor:", error);
          }
        }

        // MÉTODO SECUNDARIO: Verificar en la base de datos (opcional)
        try {
          const { data: realtimeData, error: realtimeError } = await supabase
            .from('driver_acceptances')
            .select('*')
            .eq('passenger_email', user.email)
            .order('accepted_at', { ascending: false })
            .limit(1);

          if (!realtimeError && realtimeData && realtimeData.length > 0) {
            const acceptance = realtimeData[0];
            console.log("🎉 ¡Conductor encontrado via tiempo real! Información:", acceptance);
            
            setDriverInfo({
              conductor_email: acceptance.driver_email,
              conductor_full_name: acceptance.driver_name,
              conductor_name: acceptance.driver_name, // Para compatibilidad
              passenger_email: acceptance.passenger_email,
              accepted_at: new Date(acceptance.accepted_at).toLocaleString(),
              trip_info: acceptance.trip_info
            });
            
            setInitialLoading(false); // Mostrar información del conductor
            console.log("✅ DriverInfo establecido, initialLoading desactivado");
            
            // NUEVO: Verificar si el pasajero ya está en start_of_trip después de encontrar conductor
            setTimeout(async () => {
              console.log('🔍 Verificando start_of_trip después de encontrar conductor (localStorage)...');
              await checkPassengerInStartOfTrip();
            }, 1000);
            
            return;
          } else {
            console.log("🔍 No se encontraron datos en driver_acceptances para:", user.email);
          }
        } catch (error) {
          console.log("⚠️ Tabla driver_acceptances no disponible, usando solo localStorage:", error);
        }

        console.log("🔍 Pasajero: No se encontraron datos de conductor");
      } else {
        console.log("🔍 Pasajero: No hay email de usuario disponible");
      }
    };

    // Verificar inmediatamente
    checkDriverAcceptance();

    // Verificar cada 2 segundos si un conductor aceptó
    const acceptanceInterval = setInterval(checkDriverAcceptance, 2000);

    // NUEVO: Escuchar eventos personalizados de aceptación del conductor
    const handleDriverAccepted = (event) => {
      const { passengerEmail, driverInfo } = event.detail;
      console.log("🔔 Evento personalizado recibido:", { passengerEmail, driverInfo });
      
      if (passengerEmail === user?.email) {
        console.log("🎉 ¡Conductor aceptó al pasajero actual!");
        setDriverInfo(driverInfo);
        setInitialLoading(false);
        setPassengerWaitingForDriver(false);
      }
    };

    // Agregar listener para eventos personalizados
    window.addEventListener('driverAccepted', handleDriverAccepted);

    // NUEVO: Función para verificar si el pasajero está en start_of_trip
    const checkPassengerInStartOfTrip = async () => {
      if (!user?.email) {
        console.log('❌ No hay email de usuario para verificar start_of_trip');
        return;
      }
      
      try {
        console.log('🔍 Verificando si el pasajero está en start_of_trip para:', user.email);
        
        const { data: startOfTripData, error } = await supabase
          .from('start_of_trip')
          .select('*')
          .eq('correo', user.email)
          .eq('tipo_de_usuario', 'pasajero')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('❌ Error verificando start_of_trip:', error);
          return;
        }

        console.log('📊 Resultado de la consulta start_of_trip:', startOfTripData);

        if (startOfTripData && startOfTripData.length > 0) {
          console.log('✅ Pasajero encontrado en start_of_trip:', startOfTripData[0]);
          console.log('🔄 Cambiando tripStarted a true...');
          setTripStarted(true);
          
          // TEMPORAL: No mostrar notificación aquí para evitar duplicados
          console.log('ℹ️ Viaje iniciado detectado - sin notificación para evitar duplicados');
        } else {
          console.log('ℹ️ Pasajero no está en start_of_trip aún');
        }
      } catch (error) {
        console.error('❌ Error en checkPassengerInStartOfTrip:', error);
      }
    };

    // Verificar inmediatamente si el pasajero ya está en start_of_trip
    checkPassengerInStartOfTrip();

    // NUEVO: Escuchar en tiempo real cuando se inserta el pasajero en start_of_trip
    let startOfTripChannel = null;
    try {
      console.log("🔧 Configurando canal de start_of_trip para:", user?.email);
      startOfTripChannel = supabase.channel(`start-of-trip-${user?.email}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'start_of_trip',
          filter: `correo=eq.${user?.email}`
        }, (payload) => {
          console.log("🚀 EVENTO: Pasajero insertado en start_of_trip:", payload);
          console.log("📋 Payload completo:", JSON.stringify(payload, null, 2));
          
          if (payload.new && payload.new.tipo_de_usuario === 'pasajero') {
            console.log("✅ Viaje iniciado - cambiando pantalla del pasajero");
            console.log("🔄 Llamando setTripStarted(true)...");
            setTripStarted(true);
            
            // Solo mostrar notificación si no se ha mostrado antes
            if (!tripStartedNotifiedRef.current) {
              tripStartedNotifiedRef.current = true;
              console.log("🔔 Mostrando notificación de viaje iniciado...");
              toast({
                title: "¡El viaje ha comenzado!",
                description: "El conductor ha iniciado el viaje.",
                variant: "default"
              });
            } else {
              console.log("ℹ️ Notificación ya mostrada, evitando duplicado");
            }
          } else {
            console.log("⚠️ Evento recibido pero no es un pasajero:", payload.new?.tipo_de_usuario);
          }
        })
        .subscribe();
      console.log("✅ Canal de start_of_trip configurado exitosamente");
    } catch (error) {
      console.log("⚠️ No se pudo configurar canal de start_of_trip:", error);
    }

    // NUEVO: Escuchar notificaciones en tiempo real de aceptaciones del conductor (opcional)
    let acceptanceChannel = null;
    try {
      acceptanceChannel = supabase.channel(`driver-acceptance-${user?.email}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_acceptances',
          filter: `passenger_email=eq.${user?.email}`
        }, (payload) => {
          console.log("🔔 Notificación en tiempo real recibida:", payload);
          if (payload.new) {
            const acceptance = payload.new;
            setDriverInfo({
              conductor_email: acceptance.driver_email,
              conductor_full_name: acceptance.driver_name,
              conductor_name: acceptance.driver_name, // Para compatibilidad
              passenger_email: acceptance.passenger_email,
              accepted_at: new Date(acceptance.accepted_at).toLocaleString(),
              trip_info: acceptance.trip_info
            });
            setInitialLoading(false); // Mostrar información del conductor inmediatamente
            
            toast({
              title: "¡Conductor Encontrado!",
              description: `${acceptance.driver_name} ha aceptado tu solicitud de viaje.`,
              variant: "default"
            });

            // NUEVO: Verificar si el pasajero ya está en start_of_trip después de encontrar conductor
            setTimeout(async () => {
              console.log('🔍 Verificando start_of_trip después de encontrar conductor...');
              await checkPassengerInStartOfTrip();
            }, 1000);
          }
        })
        .subscribe();
      console.log("✅ Canal de tiempo real configurado");
    } catch (error) {
      console.log("⚠️ No se pudo configurar canal de tiempo real, usando solo polling:", error);
    }

    const findMatches = async () => {
      try {
        // Evitar ejecutar matchmaking si ya está en proceso
        if (loading) {
          console.log("⏳ Pasajero: Matchmaking ya en proceso, saltando...");
          return;
        }
        
        console.log("🔍 Pasajero: Ejecutando emparejamiento...");
        await runPythonMatchmaking();
        console.log("🔍 Pasajero: Matches obtenidos:", matches);
        console.log("🔍 Pasajero: passengerWaitingForDriver:", passengerWaitingForDriver);
        console.log("🔍 Pasajero: initialLoading:", initialLoading);

        // MODIFICADO: Solo mantener loading si no hay conductor aceptado
        if (driverInfo) {
          console.log("✅ Pasajero: Conductor ya aceptado, desactivando loading");
          setInitialLoading(false);
        } else if (matches.length > 0) {
          // NUEVO: Mostrar conductores disponibles, pero NO mostrar información hasta que acepten
          console.log("✅ Pasajero: Encontrados conductores, desactivando loading para mostrar opciones");
          setInitialLoading(false);
        } else {
          // Mantener pantalla de carga si no hay conductores disponibles
          console.log("🔍 Pasajero: No hay conductores disponibles, manteniendo pantalla de carga...");
        }

        // CORREGIDO: Verificar conductores disponibles (no matches completos)
        const userMatches = getUserMatches(false);
        const availableDrivers = userMatches.filter(match => match.role === 'available_driver');
        
        console.log("🔍 Pasajero: Conductores disponibles encontrados:", availableDrivers.length);
        
        // NUEVO: Verificar que no haya auto-emparejamiento
        const selfMatches = userMatches.filter(match => {
          const conductorEmail = match.conductor_correo || match.correo_conductor;
          return conductorEmail === user?.email;
        });
        
        if (selfMatches.length > 0) {
          console.log("❌ AUTO-EMPAREJAMIENTO DETECTADO EN FRONTEND:", selfMatches);
          console.log("❌ El pasajero se está emparejando consigo mismo - esto es un error");
        }
        
        // CORREGIDO: Solo mostrar conductores disponibles, NO matches completos
        if (availableDrivers.length > 0) {
          console.log("✅ Conductores disponibles para el pasajero:", availableDrivers);
          setInitialLoading(false); // Mostrar conductores disponibles
        } else {
          console.log("🔍 Pasajero: No hay conductores disponibles, manteniendo pantalla de carga...");
        }
      } catch (error) {
        console.error("Error en polling de pasajero:", error);
        console.log("🔒 FORZADO: NO desactivar loading ni siquiera en error para pasajero");
        // setInitialLoading(false);
      }
    };

    if(isPolling) {
      findMatches();
      pollingRef.current = setInterval(findMatches, 10000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      clearInterval(acceptanceInterval);
      if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
      
      // NUEVO: Remover listener de eventos personalizados
      window.removeEventListener('driverAccepted', handleDriverAccepted);
      
      // NUEVO: Limpiar canal de notificaciones en tiempo real (si existe)
      if (acceptanceChannel) {
        try {
          supabase.removeChannel(acceptanceChannel);
        } catch (error) {
          console.log("⚠️ Error limpiando canal de tiempo real:", error);
        }
      }
      
      // NUEVO: Limpiar canal de start_of_trip (si existe)
      if (startOfTripChannel) {
        try {
          supabase.removeChannel(startOfTripChannel);
        } catch (error) {
          console.log("⚠️ Error limpiando canal de start_of_trip:", error);
        }
      }
    };
  }, [searchRequestId, isPolling, isPassenger, initialLoading, runPythonMatchmaking, passengerWaitingForDriver]);

  // NUEVO: useEffect para verificar start_of_trip cuando se encuentra el conductor
  useEffect(() => {
    if (driverInfo && user?.email && isPassenger) {
      console.log('🔍 Conductor encontrado, verificando start_of_trip en 2 segundos...');
      // Reset de la bandera de notificación para cada nuevo conductor
      tripStartedNotifiedRef.current = false;
      console.log('🔄 Bandera de notificación reseteada para nuevo conductor');
      
      const timer = setTimeout(async () => {
        console.log('🔍 Verificando start_of_trip después de encontrar conductor...');
        await checkPassengerInStartOfTrip();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [driverInfo, user?.email, isPassenger]);

  // NUEVO: Reset de bandera cuando el componente se monta
  useEffect(() => {
    tripStartedNotifiedRef.current = false;
    console.log('🔄 Bandera de notificación reseteada al montar componente');
  }, []);

  // --- Lógica para el CONDUCTOR ---
  useEffect(() => {
    if (isPassenger) {
      return;
    }

    if (!searchRequestId) {
      setInitialLoading(false);
      return;
    }

    // NUEVO: No ejecutar polling si estamos en la pantalla de orden de recogida
    if (showPickupOrder) {
      console.log("🚫 Conductor: Polling pausado - mostrando orden de recogida");
      return;
    }

    // NUEVO: No ejecutar polling si tenemos pasajeros preservados (viaje iniciado)
    if (preservedPassengers.length > 0) {
      console.log("🚫 Conductor: Polling pausado - viaje iniciado con pasajeros preservados");
      return;
    }

    // NUEVO: No ejecutar polling si tenemos un tripId activo (viaje iniciado)
    if (currentTripId) {
      console.log("🚫 Conductor: Polling pausado - viaje iniciado con tripId:", currentTripId);
      return;
    }

    const fetchNearbyPassengers = async () => {
      try {
        // Evitar ejecutar matchmaking si ya está en proceso
        if (loading) {
          console.log("⏳ Conductor: Matchmaking ya en proceso, saltando...");
          return;
        }
        
        console.log("🔍 Conductor: Ejecutando emparejamiento...");
        await runPythonMatchmaking();

        // Solo obtener matches para conductores
        const userMatches = getUserMatches(true);
        console.log("🔍 Conductor: User matches obtenidos:", userMatches);
        setUserMatches(userMatches);

        // Si hay pasajeros asignados, mostrar la lista
        if (userMatches.length > 0) {
          console.log("✅ Conductor: Encontrados pasajeros asignados, desactivando loading");
          setInitialLoading(false);
        } else {
          // Si no hay pasajeros, mantener la pantalla de carga
          // NO configurar timeout - solo cambiar cuando haya pasajeros o cuando acepte
          console.log("🔍 Conductor: No hay pasajeros asignados, manteniendo pantalla de carga...");
        }
      } catch (error) {
        console.error("Error en polling de conductor:", error);
        // Mostrar error al usuario
        toast({
          title: "Error de Conexión",
          description: "No se pudo conectar con el servicio de emparejamiento. Mostrando modo básico.",
          variant: "destructive"
        });
        setInitialLoading(false);
      }
    };

    fetchNearbyPassengers();

    // Polling cada 10 segundos para conductores (solo si no estamos en orden de recogida)
    const pollingInterval = setInterval(() => {
      if (!showPickupOrder) {
        fetchNearbyPassengers();
      } else {
        console.log("🚫 Conductor: Polling saltado - mostrando orden de recogida");
      }
    }, 10000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [isPassenger, searchRequestId, initialLoading, runPythonMatchmaking, getUserMatches, showPickupOrder, preservedPassengers, currentTripId]);

  // --- Lógica de Confirmación Final (Solo para pasajero) ---
  useEffect(() => {
    if (!searchRequestId || !isPassenger) return;

    // Escuchar cambios en trip_requests para cuando el conductor acepta
    const tripRequestChannel = supabase.channel(`trip-request-${searchRequestId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'trip_requests',
        filter: `driver_pool_id=eq.${searchRequestId}`
      }, (payload) => {
        console.log("🔔 Cambio en trip_request:", payload);
        if (payload.new.status === 'accepted') {
          console.log("✅ ¡Conductor aceptó el viaje!");
          
          // Detener polling
          if (pollingRef.current) clearInterval(pollingRef.current);
          setIsPolling(false);

          // Mostrar mensaje de confirmación
          toast({
            title: "¡Viaje Confirmado!",
            description: "El conductor ha aceptado tu solicitud. ¡Disfruta tu viaje!",
            variant: "default"
          });

          // COMENTADO: No redirigir automáticamente hasta que esté completamente confirmado
          console.log("⚠️ ATENCIÓN: onTripConfirmed comentado para evitar redirección automática");
          // if (onTripConfirmed) {
          //   onTripConfirmed({
          //     trip_request_id: payload.new.id,
          //     status: 'accepted',
          //     driver_pool_id: searchRequestId
          //   });
          // }
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(tripRequestChannel);
    };
  }, [searchRequestId, onTripConfirmed, isPassenger]);

  // Obtener tripId si el pasajero ya tiene conductor asignado y no lo tenemos aún
  useEffect(() => {
    const fetchTripId = async () => {
      if (!user?.id || !isPassenger || !driverInfo || tripId) return;
      
      // NUEVO: Buscar en trip_data usando el email del pasajero
      const { data: tripData, error: tripDataError } = await supabase
        .from('trip_data')
        .select('id, status, passengers_data')
        .in('status', ['created', 'in_progress'])
        .maybeSingle();
      
      // Filtrar manualmente por email del pasajero
      if (tripData && tripData.passengers_data) {
        const hasPassenger = tripData.passengers_data.some(passenger => 
          passenger.passenger_email === user.email || passenger.correo === user.email
        );
        if (!hasPassenger) {
          console.log('❌ Pasajero no encontrado en trip_data para:', user.email);
          return;
        }
      }
      
      if (tripData && tripData.id) {
        console.log('✅ Pasajero: TripId encontrado en trip_data:', tripData.id);
        setTripId(tripData.id);
        return;
      }
      
      // Fallback: buscar en confirmed_trips
      const { data, error } = await supabase
        .from('confirmed_trips')
        .select('id') // Confirmado: usar 'id'
        .eq('passenger_id', user.id)
        .in('status', ['confirmed', 'in_progress'])
        .maybeSingle();
      if (data && data.id) {
        console.log('✅ Pasajero: TripId encontrado en confirmed_trips:', data.id);
        setTripId(data.id); // Usar 'id' como tripId
      }
    };
    fetchTripId();
  }, [user, isPassenger, driverInfo, tripId]);

  // Listener universal SOLO para el pasajero, con logs detallados
  useEffect(() => {
    if (!tripId || !isPassenger) {
      console.log('[Listener] No se suscribe: tripId o isPassenger faltante', { tripId, isPassenger });
      return;
    }
    console.log('[Listener] Suscribiendo pasajero a cambios de status para tripId:', tripId);
    
    // NUEVO: Escuchar cambios en trip_data (donde se actualiza cuando el conductor inicia viaje)
    const tripDataChannel = supabase
      .channel(`trip-data-status-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trip_data',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          console.log('[Listener] Payload recibido en trip-data-status:', payload);
          if (payload?.new) {
            console.log('[Listener] Nuevo status en trip_data:', payload.new.status);
          }
          if (payload.new && payload.new.status === 'in_progress') {
            // SOLO cambiar el estado, NO navegar automáticamente
            console.log('[Listener] Viaje iniciado detectado, cambiando tripStarted a true');
            setTripStarted(true);
            
            // Mostrar notificación pero NO navegar automáticamente
            toast({
              title: "¡El viaje ha comenzado!",
              description: "El conductor ha iniciado el viaje.",
              variant: "default"
            });
          }
        }
      )
      .subscribe();
    
    // También escuchar cambios en trips por compatibilidad
    const tripChannel = supabase
      .channel(`trip-status-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          console.log('[Listener] Payload recibido en trip-status:', payload);
          if (payload?.new) {
            console.log('[Listener] Nuevo status en trips:', payload.new.status);
          }
          if (payload.new && payload.new.status === 'in_progress') {
            // SOLO cambiar el estado, NO navegar automáticamente
            console.log('[Listener] Viaje iniciado detectado en trips, cambiando tripStarted a true');
            setTripStarted(true);
            
            // Mostrar notificación pero NO navegar automáticamente
            toast({
              title: "¡El viaje ha comenzado!",
              description: "El conductor ha iniciado el viaje.",
              variant: "default"
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      console.log('[Listener] Removiendo canales trip-status para tripId:', tripId);
      supabase.removeChannel(tripDataChannel);
      supabase.removeChannel(tripChannel);
    };
  }, [tripId, isPassenger]);

  // NUEVO: Listener para detectar cuando el viaje inicia (para la pantalla de "¡Conductor Encontrado!")
  useEffect(() => {
    if (!driverInfo || !isPassenger || tripStarted) {
      console.log("🚫 Listener no se activa:", { driverInfo: !!driverInfo, isPassenger, tripStarted });
      return;
    }
    
    console.log("🎧 Escuchando inicio de viaje para pantalla de conductor encontrado...");
    console.log("🔍 Usuario actual:", user?.id, user?.email);
    
    let tripChannel = null;
    let isMounted = true;
    
    // Buscar el tripId en confirmed_trips basado en el passenger_id (el pasajero actual)
    const findTripId = async () => {
      try {
        console.log("🔍 Buscando confirmed_trips para passenger_id:", user?.id);
        const { data: confirmedTrips, error } = await supabase
          .from('confirmed_trips')
          .select('id, status, driver_id, passenger_id')
          .eq('passenger_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        console.log("📊 Resultado de búsqueda:", { confirmedTrips, error });
        
        if (!isMounted) return; // Evitar actualizaciones si el componente se desmontó
        
        if (!error && confirmedTrips && confirmedTrips.length > 0) {
          const tripId = confirmedTrips[0].id;
          const currentStatus = confirmedTrips[0].status;
          console.log("🔍 TripId encontrado:", tripId);
          console.log("📊 Status actual:", currentStatus);
          
          // Si ya está in_progress, cambiar pantalla inmediatamente
          if (currentStatus === 'in_progress') {
            console.log("⚡ Viaje ya está in_progress, cambiando pantalla inmediatamente");
            setTripStarted(true);
            toast({
              title: "¡El viaje ha comenzado!",
              description: "El conductor ha iniciado el viaje.",
              variant: "default"
            });
            // NO navegar automáticamente - dejar que el usuario controle la navegación
            console.log("ℹ️ Viaje ya iniciado detectado, pero NO navegando automáticamente");
            return;
          }
          
          // Escuchar cambios en confirmed_trips directamente
          console.log("🎧 Configurando listener para tripId:", tripId);
          tripChannel = supabase
            .channel(`trip-start-${tripId}`)
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'confirmed_trips',
              filter: `id=eq.${tripId}`,
            }, (payload) => {
              if (!isMounted) return; // Evitar actualizaciones si el componente se desmontó
              
              console.log("🚀 Cambio detectado en confirmed_trips:", payload);
              console.log("📊 Status anterior:", payload.old?.status);
              console.log("📊 Status nuevo:", payload.new?.status);
              
              if (payload.new.status === 'in_progress') {
                console.log("✅ Viaje iniciado, cambiando pantalla...");
                setTripStarted(true);
                toast({
                  title: "¡El viaje ha comenzado!",
                  description: "El conductor ha iniciado el viaje.",
                  variant: "default"
                });
                
                // NO redirigir automáticamente - dejar que el usuario controle la navegación
                console.log("ℹ️ Viaje iniciado detectado, pero NO navegando automáticamente");
              } else {
                console.log("⚠️ Status cambió pero no es in_progress:", payload.new.status);
              }
            })
            .subscribe();
            
          console.log("✅ Listener configurado exitosamente");
        } else {
          console.log("❌ No se encontraron confirmed_trips para el pasajero");
          if (error) {
            console.error("❌ Error en la búsqueda:", error);
          }
        }
      } catch (error) {
        console.error("❌ Error al buscar tripId:", error);
      }
    };
    
    findTripId();
    
    // Función de cleanup
    return () => {
      console.log("🧹 Limpiando listener de inicio de viaje");
      isMounted = false;
      if (tripChannel) {
        supabase.removeChannel(tripChannel);
      }
    };
  }, [driverInfo, isPassenger, user?.id, navigate, tripStarted]);

  const handlePassengerRequestTrip = async (driverMatch, selectedSeats) => {
    console.log("🎯 Pasajero solicitando viaje:", { driverMatch, selectedSeats, user: user.id });
    
    // Verificar si ya hay una solicitud activa
    if (passengerWaitingForDriver) {
      toast({
        title: "Ya tienes una solicitud activa",
        description: "Espera la respuesta del conductor o cancela la solicitud actual.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(driverMatch.id);

    try {
      const tripRequest = await createTripRequest(
        user.id,
        driverMatch.id,
        driverMatch.pickup_address,
        driverMatch.dropoff_address,
        driverMatch.pickup_lat,
        driverMatch.pickup_lng,
        driverMatch.dropoff_lat,
        driverMatch.dropoff_lng
      );

      console.log("✅ Trip request creado:", tripRequest);

      toast({
        title: "Solicitud Enviada",
        description: "Esperando la confirmación del conductor...",
        variant: "default"
      });

      // CORREGIDO: Llamar a onPassengerRequest para cambiar a PassengerWaitingScreen
      console.log("🔄 Cambiando a PassengerWaitingScreen...");
      if (onPassengerRequest) {
        onPassengerRequest(tripRequest.id, {
          conductor_email: driverMatch.conductor_email,
          conductor_full_name: driverMatch.nombre_conductor || driverMatch.profile?.full_name,
          conductor_name: driverMatch.nombre_conductor || driverMatch.profile?.full_name,
          pickup: driverMatch.pickup_address || driverMatch.pickup,
          destino: driverMatch.dropoff_address || driverMatch.destino,
          distance_km: driverMatch.distance_km,
          price_per_seat: driverMatch.price_per_seat
        });
      }

    } catch (error) {
      console.error("❌ Error al solicitar viaje:", error);
      toast({
        title: "Error al solicitar",
        description: error.message || "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleDriverAcceptPassenger = async (passengerMatch) => {
    // Usar el correo del pasajero como identificador único
    const passengerEmail = passengerMatch.pasajero_correo || passengerMatch.correo;
    setIsSubmitting(passengerEmail);

    console.log("🚗 Conductor aceptando pasajero:", passengerMatch);
    console.log("🔍 Identificador único del pasajero:", passengerEmail);

    // Marcar el pasajero como aceptado localmente usando su correo como ID único
    setAcceptedPassengers(prev => [...prev, passengerEmail]);

    // NUEVO: Obtener información completa del conductor desde la base de datos
    let conductorFullName = user?.user_metadata?.full_name || 'Conductor';
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('email', user?.email)
        .single();

      if (!error && profileData) {
        conductorFullName = profileData.full_name;
      }
    } catch (error) {
      console.log("⚠️ No se pudo obtener perfil del conductor, usando datos básicos");
    }

    // Crear información completa del conductor para enviar al pasajero
    const driverInfo = {
      conductor_email: user?.email,
      conductor_full_name: conductorFullName,
      conductor_name: conductorFullName, // Para compatibilidad
      passenger_email: passengerEmail,
      accepted_at: new Date().toLocaleString(),
      // Información adicional del viaje
      trip_info: {
        pickup: passengerMatch.pickup,
        destino: passengerMatch.destino,
        distance_km: passengerMatch.distance_km
      }
    };

    // Guardar en localStorage para que el pasajero pueda acceder
    const storageKey = `driver_accepted_${passengerEmail}`;
    localStorage.setItem(storageKey, JSON.stringify(driverInfo));

    // NUEVO: También guardar con una clave más genérica para facilitar la búsqueda
    const genericKey = `driver_accepted_${passengerEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    localStorage.setItem(genericKey, JSON.stringify(driverInfo));

    // NUEVO: Disparar evento personalizado para notificar a otras pestañas
    window.dispatchEvent(new CustomEvent('driverAccepted', {
      detail: { passengerEmail, driverInfo }
    }));

    console.log("📤 Información del conductor guardada para pasajero:", driverInfo);
    console.log("🔑 Clave de localStorage:", storageKey);
    console.log("🔑 Clave genérica:", genericKey);
    console.log("📋 Datos guardados:", JSON.stringify(driverInfo));

    // NUEVO: Intentar enviar notificación en tiempo real (opcional)
    try {
      const { error: channelError } = await supabase
        .from('driver_acceptances')
        .insert({
          passenger_email: passengerEmail,
          driver_email: user?.email,
          driver_name: conductorFullName,
          accepted_at: new Date().toISOString(),
          trip_info: driverInfo.trip_info
        });

      if (channelError) {
        console.log("⚠️ Tabla driver_acceptances no disponible, usando solo localStorage:", channelError);
      } else {
        console.log("✅ Notificación en tiempo real enviada");
      }
    } catch (error) {
      console.log("⚠️ Tabla driver_acceptances no existe, usando solo localStorage:", error);
      // Continuar con localStorage como método principal
    }

    toast({
      title: "¡Pasajero Aceptado!",
      description: `${passengerMatch.nombre} ha sido notificado y puede ver tu información.`
    });

    // Simular un pequeño delay para el feedback visual
    setTimeout(() => {
      setIsSubmitting(null);
    }, 1000);
  };

  // MODIFICADO: Solo marca como aceptada localmente, no navega
  const handleDriverAcceptRequest = async (passengerRequest) => {
    setIsSubmitting(passengerRequest.id);
    
    try {
      const { error } = await supabase.rpc('accept_trip_request', {
        request_id_param: passengerRequest.id,
        driver_pool_id_param: searchRequestId
      });

      if (error) throw error;

      setAcceptedRequests(prev => [...prev, passengerRequest.id]);

      toast({
        title: "¡Pasajero Aceptado!",
        description: "Solicitud aceptada. Puedes aceptar más o iniciar el viaje."
      });

    } catch (error) {
      toast({
        title: "Error al aceptar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  // Botón para iniciar viaje - FUNCIONALIDAD ORIGINAL RESTAURADA
  const handleStartTrip = async () => {
    try {
      setIsSubmitting('start_trip');

      console.log('🚀 Iniciando viaje...');

      // Usar la función SQL para iniciar el viaje y crear datos
      const { data: tripDataId, error } = await supabase
        .rpc('start_trip_with_data', {
          driver_pool_id_param: searchRequestId
        });

      if (error) {
        throw error;
      }

      console.log('✅ Datos del viaje creados con ID:', tripDataId);

      // ACTUALIZAR MÚLTIPLES TABLAS PARA NOTIFICAR AL PASAJERO
      if (tripDataId) {
        // 1. Actualizar trip_data
        const { error: tripDataUpdateError } = await supabase
          .from('trip_data')
          .update({ status: 'in_progress' })
          .eq('id', tripDataId);
        
        if (tripDataUpdateError) {
          console.error('❌ Error al actualizar trip_data:', tripDataUpdateError);
        } else {
          console.log('✅ Status actualizado en trip_data:', tripDataId);
        }

        // 2. Actualizar confirmed_trips
        const { error: confirmedTripsError } = await supabase
          .from('confirmed_trips')
          .update({ status: 'in_progress' })
          .eq('driver_id', user?.id);
        
        if (confirmedTripsError) {
          console.error('❌ Error al actualizar confirmed_trips:', confirmedTripsError);
        } else {
          console.log('✅ Status actualizado en confirmed_trips');
        }

        // 3. Actualizar trips (si existe)
        const { error: tripsError } = await supabase
          .from('trips')
          .update({ status: 'in_progress' })
          .eq('id', tripDataId);
        
        if (tripsError) {
          console.warn('⚠️ Error al actualizar trips (tabla puede no existir):', tripsError);
        } else {
          console.log('✅ Status actualizado en trips');
        }

        // 4. NUEVO: Insertar registros en start_of_trip (conductor + pasajeros)
        try {
          // Obtener dirección del conductor desde searching_pool
          const { data: poolData, error: poolError } = await supabase
            .from('searching_pool')
            .select('pickup_address')
            .eq('id', searchRequestId)
            .single();

          const driverPickupAddress = poolData?.pickup_address || '';
          
          // Generar un trip_id numérico único para start_of_trip (diferente del UUID de trip_data)
          const numericTripId = Date.now() + Math.floor(Math.random() * 1000);
          
          console.log('🔍 Procesando registros para start_of_trip:', {
            tripDataId: tripDataId, // UUID para trip_data
            numericTripId: numericTripId, // Número para start_of_trip
            driver_email: user?.email,
            pickup_address: driverPickupAddress
          });

          // CORREGIDO: start_trip_with_data SÍ inserta el conductor, solo necesitamos actualizarlo
          console.log('📝 start_trip_with_data ya insertó el conductor, actualizando su trip_id...');
          
          // CORREGIDO: Determinar la dirección del viaje basada en el destino del conductor desde searching_pool
          const { data: driverPoolData, error: driverPoolError } = await supabase
            .from('searching_pool')
            .select('dropoff_address, destino')
            .eq('id', searchRequestId)
            .single();

          const driverDestination = driverPoolData?.destino || driverPoolData?.dropoff_address || '';
          const direction = getTripDirection(driverDestination);
          const destinoValue = direction === 'to_university' ? 'hacia_universidad' : 'desde_universidad';
          
          console.log('🧭 Dirección del viaje determinada para conductor:', { 
            driverDestination, 
            direction, 
            destinoValue,
            driverPoolData 
          });

          // Actualizar el registro del conductor que ya creó start_trip_with_data
          const { error: updateDriverError } = await supabase
            .from('start_of_trip')
            .update({ 
              trip_id: numericTripId,
              direccion_de_viaje: driverPickupAddress,
              destino: destinoValue,
              updated_at: new Date().toISOString()
            })
            .eq('correo', user?.email)
            .eq('tipo_de_usuario', 'conductor');

          if (updateDriverError) {
            console.error('❌ Error actualizando registro del conductor:', updateDriverError);
          } else {
            console.log('✅ Registro del conductor actualizado con trip_id:', numericTripId);
          }

          // 1. Obtener y insertar pasajeros aceptados en start_of_trip
          const { data: acceptedPassengers, error: passengersError } = await supabase
            .from('driver_acceptances')
            .select('*')
            .eq('driver_email', user?.email)
            .not('accepted_at', 'is', null);

          console.log('🔍 Pasajeros aceptados encontrados:', acceptedPassengers);
          console.log('🔍 Cantidad de pasajeros:', acceptedPassengers?.length || 0);

          if (passengersError) {
            console.error('❌ Error obteniendo pasajeros aceptados:', passengersError);
          } else if (acceptedPassengers && acceptedPassengers.length > 0) {
            console.log('✅ Procesando', acceptedPassengers.length, 'pasajeros aceptados');
            const passengerRows = acceptedPassengers.map((p) => {
              let pickupAddress = '';
              let passengerDestination = '';
              try {
                if (p.trip_info) {
                  const tripInfo = typeof p.trip_info === 'string' ? JSON.parse(p.trip_info) : p.trip_info;
                  pickupAddress = tripInfo.pickup || '';
                  passengerDestination = tripInfo.destino || '';
                }
              } catch (e) {
                console.warn('⚠️ Error parseando trip_info:', e);
              }

              // Determinar la dirección del viaje para cada pasajero
              const passengerDirection = getTripDirection(passengerDestination);
              const passengerDestinoValue = passengerDirection === 'to_university' ? 'hacia_universidad' : 'desde_universidad';

              return {
                trip_id: numericTripId,
                correo: p.passenger_email,
                direccion_de_viaje: pickupAddress,
                destino: passengerDestinoValue,
                tipo_de_usuario: 'pasajero',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            });

            console.log('🔍 Filas de pasajeros a insertar:', passengerRows);

            console.log('🚀 Intentando insertar pasajeros en start_of_trip...');
            const { error: insertPassengersError } = await supabase
              .from('start_of_trip')
              .insert(passengerRows);

            if (insertPassengersError) {
              console.error('❌ Error insertando pasajeros en start_of_trip:', insertPassengersError);
              console.error('❌ Detalles del error:', JSON.stringify(insertPassengersError, null, 2));
            } else {
              console.log('✅ Pasajeros insertados en start_of_trip:', passengerRows.length);
              
              // NUEVO: Verificar inmediatamente que los pasajeros se insertaron
              setTimeout(async () => {
                const { data: verifyData, error: verifyError } = await supabase
                  .from('start_of_trip')
                  .select('*')
                  .eq('trip_id', numericTripId);
                
                if (verifyError) {
                  console.error('❌ Error verificando inserción de pasajeros:', verifyError);
                } else {
                  console.log('🔍 Verificación post-inserción - Registros en start_of_trip:', verifyData?.length || 0);
                  console.log('📋 Detalles de verificación:', verifyData);
                }
              }, 1000);
            }

            // 3. CRÍTICO: También actualizar trip_data.passengers_data para que el pasajero pueda encontrar su viaje
            try {
              // Obtener IDs de pasajeros desde profiles
              const passengerEmails = acceptedPassengers.map(p => p.passenger_email);
              const { data: passengerProfiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email')
                .in('email', passengerEmails);

              if (profilesError) {
                console.error('❌ Error obteniendo perfiles de pasajeros:', profilesError);
              } else if (passengerProfiles && passengerProfiles.length > 0) {
                const passengersData = acceptedPassengers.map((acceptance) => {
                  const profile = passengerProfiles.find(p => p.email === acceptance.passenger_email);
                  let tripInfo = {};
                  try {
                    tripInfo = typeof acceptance.trip_info === 'string' ? JSON.parse(acceptance.trip_info) : acceptance.trip_info;
                  } catch (e) {
                    console.warn('⚠️ Error parseando trip_info para trip_data:', e);
                  }

                  return {
                    passenger_id: profile?.id || null,
                    passenger_email: acceptance.passenger_email,
                    pickup_address: tripInfo.pickup || '',
                    dropoff_address: tripInfo.destino || '',
                    pickup_lat: null,
                    pickup_lng: null,
                    dropoff_lat: null,
                    dropoff_lng: null,
                    seats_requested: 1
                  };
                });

                console.log('🔍 Actualizando trip_data.passengers_data:', passengersData);

                const { error: updateTripDataError } = await supabase
                  .from('trip_data')
                  .update({
                    passengers_data: passengersData,
                    total_passengers: passengersData.length
                  })
                  .eq('id', tripDataId);

                if (updateTripDataError) {
                  console.error('❌ Error actualizando trip_data.passengers_data:', updateTripDataError);
                } else {
                  console.log('✅ trip_data.passengers_data actualizado correctamente');
                }
              }
            } catch (error) {
              console.error('❌ Error actualizando passengers_data en trip_data:', error);
            }

          } else {
            console.log('⚠️ No se encontraron pasajeros aceptados para el conductor:', user?.email);
          }

          // 4. LIMPIEZA: Eliminar registros duplicados del conductor con trip_id diferente (MÁS ESPECÍFICO)
          try {
            console.log('🧹 Limpiando registros duplicados del conductor...');
            
            // Solo eliminar registros del conductor que tengan trip_id diferente al actual
            const { error: cleanupError } = await supabase
              .from('start_of_trip')
              .delete()
              .eq('correo', user?.email)
              .eq('tipo_de_usuario', 'conductor')
              .neq('trip_id', numericTripId);

            if (cleanupError) {
              console.error('❌ Error limpiando registros duplicados:', cleanupError);
            } else {
              console.log('✅ Registros duplicados del conductor eliminados');
              
              // NUEVO: Verificar qué registros quedan después de la limpieza
              setTimeout(async () => {
                const { data: afterCleanupData, error: afterCleanupError } = await supabase
                  .from('start_of_trip')
                  .select('*')
                  .eq('trip_id', numericTripId);
                
                if (afterCleanupError) {
                  console.error('❌ Error verificando después de limpieza:', afterCleanupError);
                } else {
                  console.log('🔍 Después de limpieza - Registros en start_of_trip:', afterCleanupData?.length || 0);
                  console.log('📋 Detalles después de limpieza:', afterCleanupData);
                }
              }, 500);
            }
          } catch (error) {
            console.error('❌ Error en limpieza de duplicados:', error);
          }

          console.log('✅ Todos los registros (conductor + pasajeros) procesados en start_of_trip con trip_id:', numericTripId);

          // NUEVO: Establecer el viaje en el contexto global
          const tripDetails = {
            trip_id: tripDataId,
            numeric_trip_id: numericTripId,
            driver_email: user?.email,
            status: 'in_progress',
            role: 'conductor',
            state: 'in_trip'
          };
          setTrip(tripDetails, '/app');

          // NUEVO: COMENTADO - No copiar automáticamente, solo cuando presione "Completar Recogida"
          // setTimeout(async () => {
          //   try {
          //     console.log('🔄 COPIA INMEDIATA: Copiando registros a successful_trips...');
          //     
          //     // Obtener todos los registros del trip_id actual
          //     const { data: allRecords, error: fetchError } = await supabase
          //       .from('start_of_trip')
          //       .select('*')
          //       .eq('trip_id', numericTripId);

          //     if (fetchError) {
          //       console.error('❌ Error obteniendo registros para copia inmediata:', fetchError);
          //       return;
          //     }

          //     console.log('📊 Registros encontrados para copia inmediata:', allRecords?.length || 0);

          //     if (allRecords && allRecords.length > 0) {
          //       // COPIAR a successful_trips (sin eliminar de start_of_trip)
          //       const { error: insertError } = await supabase
          //         .from('successful_trips')
          //         .insert(allRecords.map(record => ({
          //           trip_id: record.trip_id,
          //           correo: record.correo,
          //           direccion_de_viaje: record.direccion_de_viaje,
          //           destino: record.destino,
          //           tipo_de_usuario: record.tipo_de_usuario,
          //           created_at: record.created_at,
          //           updated_at: record.updated_at
          //         })));

          //       if (insertError) {
          //         console.error('❌ Error en copia inmediata:', insertError);
          //       } else {
          //         console.log('✅ Copia inmediata exitosa:', allRecords.length, 'registros copiados');
          //         console.log('📋 Los registros permanecen en start_of_trip y se copiaron a successful_trips');
          //       }
          //     }
          //   } catch (error) {
          //     console.error('❌ Error en copia inmediata:', error);
          //   }
          // }, 2000); // Esperar 2 segundos para que se complete la inserción

        } catch (error) {
          console.error('❌ Error ejecutando inserción en start_of_trip:', error);
        }
      }

      toast({
        title: "¡Viaje Iniciado!",
        description: "El viaje ha comenzado. Los pasajeros han sido notificados.",
        variant: "default"
      });

      // NUEVO: Establecer el viaje en el contexto global (movido dentro del bloque try)
      // Esta lógica se moverá dentro del bloque try donde se define numericTripId

      // CRÍTICO: Preservar datos de pasajeros ANTES de mostrar la pantalla de orden de recogida
      const currentAssignedPassengers = !isPassenger && userMatches.length > 0 && userMatches[0].pasajeros_asignados
        ? userMatches[0].pasajeros_asignados
        : !isPassenger && userMatches.length > 0
        ? userMatches // Usar userMatches directamente si no hay pasajeros_asignados
        : [];
      
      console.log('💾 Preservando datos de pasajeros:', {
        currentAssignedPassengersLength: currentAssignedPassengers.length,
        userMatchesLength: userMatches.length,
        hasPasajerosAsignados: userMatches.length > 0 && userMatches[0]?.pasajeros_asignados
      });
      
      // Preservar los datos de pasajeros para evitar que se pierdan
      setPreservedPassengers(currentAssignedPassengers);

      // Mostrar pantalla de orden de recogida
      setCurrentTripId(tripDataId);
      setShowPickupOrder(true);
      setCurrentPickupStep(0);

      // Disparar evento para notificar al pasajero
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tripStarted', { detail: { tripDataId } }));
        }
      }, 500);

    } catch (error) {
      console.error('❌ Error al iniciar viaje:', error);
      
      toast({
        title: "Error al iniciar viaje",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  // NUEVO: Función para completar el viaje y COPIAR registros a successful_trips
  const handleCompleteTrip = async () => {
    try {
      console.log('🔄 Completando viaje y copiando registros a successful_trips...');
      
      // 0. Verificar registros antes de procesar
      console.log('🔍 Verificando registros en start_of_trip antes de procesar...');
      const { data: beforeRecords, error: beforeError } = await supabase
        .from('start_of_trip')
        .select('*');

      if (beforeError) {
        console.error('❌ Error verificando registros antes:', beforeError);
      } else {
        console.log('📊 Registros encontrados antes de procesar:', beforeRecords?.length || 0);
        console.log('📋 Detalles antes:', beforeRecords);
      }

      // 0.1. Verificar registros existentes en successful_trips (solo para logging)
      console.log('🔍 Verificando registros existentes en successful_trips...');
      const { data: existingSuccessRecords, error: existingError } = await supabase
        .from('successful_trips')
        .select('*');

      if (existingError) {
        console.error('❌ Error verificando successful_trips:', existingError);
      } else {
        console.log('📊 Registros existentes en successful_trips:', existingSuccessRecords?.length || 0);
        console.log('📋 Detalles existentes:', existingSuccessRecords);
      }

      // NOTA: No impedimos la transferencia aunque ya existan registros en successful_trips
      // porque successful_trips puede tener múltiples registros del mismo usuario (para gráficos)
      console.log('✅ Procediendo con la transferencia de registros actuales de start_of_trip a successful_trips...');
      
      // 1. Primero limpiar duplicados en start_of_trip
      console.log('🧹 Limpiando duplicados en start_of_trip...');
      const { data: cleanResult, error: cleanError } = await supabase
        .rpc('clean_duplicates_in_start_of_trip');

      if (cleanError) {
        console.error('❌ Error limpiando duplicados:', cleanError);
        console.error('❌ Detalles del error:', JSON.stringify(cleanError, null, 2));
      } else {
        console.log('✅ Duplicados limpiados:', cleanResult);
      }
      
      // 2. Verificar registros después de limpiar
      console.log('🔍 Verificando registros después de limpiar...');
      const { data: afterCleanRecords, error: afterCleanError } = await supabase
        .from('start_of_trip')
        .select('*');

      if (afterCleanError) {
        console.error('❌ Error verificando registros después de limpiar:', afterCleanError);
      } else {
        console.log('📊 Registros después de limpiar:', afterCleanRecords?.length || 0);
        console.log('📋 Detalles después de limpiar:', afterCleanRecords);
      }
      
      // 3. Copiar registros de start_of_trip a successful_trips (transferencia directa)
      console.log('📋 Copiando registros de start_of_trip a successful_trips...');
      
      if (!afterCleanRecords || afterCleanRecords.length === 0) {
        console.log('⚠️ No hay registros en start_of_trip para copiar');
        toast({
          title: "No hay registros para transferir",
          description: "No se encontraron registros en start_of_trip para completar el viaje.",
          variant: "destructive"
        });
        return;
      }

      // Transferir cada registro de start_of_trip a successful_trips
      const recordsToInsert = afterCleanRecords.map(record => ({
        trip_id: record.trip_id,
        correo: record.correo,
        direccion_de_viaje: record.direccion_de_viaje,
        destino: record.destino,
        tipo_de_usuario: record.tipo_de_usuario,
        created_at: record.created_at,
        updated_at: new Date().toISOString() // Actualizar timestamp
      }));

      console.log('📋 Registros preparados para insertar:', recordsToInsert.length);
      console.log('📋 Detalles de registros:', recordsToInsert);

      const { data: insertResult, error: insertError } = await supabase
        .from('successful_trips')
        .insert(recordsToInsert);

      if (insertError) {
        console.error('❌ Error insertando registros en successful_trips:', insertError);
        console.error('❌ Detalles del error:', JSON.stringify(insertError, null, 2));
        toast({
          title: "Error al completar viaje",
          description: "No se pudieron copiar los registros. Intenta de nuevo.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Registros insertados exitosamente en successful_trips:', insertResult);
      
      // Crear resultado simulado para compatibilidad con el código existente
      const copyResult = {
        copied_count: recordsToInsert.length,
        conductor_count: recordsToInsert.filter(r => r.tipo_de_usuario === 'conductor').length,
        passenger_count: recordsToInsert.filter(r => r.tipo_de_usuario === 'pasajero').length
      };
      
      // 4. Verificar resultado final
      console.log('🔍 Verificando resultado final...');
      const { data: finalStartRecords, error: finalStartError } = await supabase
        .from('start_of_trip')
        .select('*');
      
      const { data: finalSuccessRecords, error: finalSuccessError } = await supabase
        .from('successful_trips')
        .select('*');

      if (finalStartError) {
        console.error('❌ Error verificando start_of_trip final:', finalStartError);
      } else {
        console.log('📊 Registros finales en start_of_trip:', finalStartRecords?.length || 0);
      }

      if (finalSuccessError) {
        console.error('❌ Error verificando successful_trips final:', finalSuccessError);
      } else {
        console.log('📊 Registros finales en successful_trips:', finalSuccessRecords?.length || 0);
      }
      
      const copiedCount = copyResult?.copied_count || 0;
      const conductorCount = copyResult?.conductor_count || 0;
      const passengerCount = copyResult?.passenger_count || 0;

      toast({
        title: "¡Viaje Completado!",
        description: `${copiedCount} registros únicos copiados (${conductorCount} conductor, ${passengerCount} pasajeros).`,
        variant: "default"
      });

      // Limpiar estados locales
      setShowPickupOrder(false);
      setCurrentPickupStep(0);
      setPreservedPassengers([]);
      setCurrentTripId(null);

    } catch (error) {
      console.error('❌ Error en handleCompleteTrip:', error);
      console.error('❌ Stack trace:', error.stack);
      toast({
        title: "Error al completar viaje",
        description: "Ocurrió un error inesperado. Intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  // NUEVO: Funciones para manejar el orden de recogida
  const handleNextPickup = () => {
    // Usar los mismos pasajeros preservados para consistencia
    const assignedPassengers = showPickupOrder && preservedPassengers.length > 0
      ? preservedPassengers
      : !isPassenger && userMatches.length > 0 && userMatches[0].pasajeros_asignados
        ? userMatches[0].pasajeros_asignados
        : [];

    console.log('🔄 handleNextPickup llamado:', {
      currentPickupStep,
      assignedPassengersLength: assignedPassengers.length,
      isLastPassenger: currentPickupStep === assignedPassengers.length - 1
    });

    if (currentPickupStep < assignedPassengers.length - 1) {
      // Hay más pasajeros, mostrar el siguiente
      const nextStep = currentPickupStep + 1;
      console.log('➡️ Mostrando siguiente pasajero:', nextStep);
      setCurrentPickupStep(nextStep);
      
      toast({
        title: "Siguiente Pasajero",
        description: `Mostrando información del pasajero ${nextStep + 1}`,
        variant: "default"
      });
    } else {
      // Todos los pasajeros han sido recogidos
      console.log('✅ Todos los pasajeros recogidos - completando viaje');
      
      // NUEVO: Transferir registros de start_of_trip a completed_trips
      handleCompleteTrip();
      
      setShowPickupOrder(false);
      setCurrentPickupStep(0);
      setPreservedPassengers([]); // NUEVO: Limpiar datos preservados
      
      toast({
        title: "¡Viaje Completado!",
        description: "Todos los pasajeros han sido recogidos. Dirígete hacia la universidad.",
        variant: "default"
      });

      // Llamar a onTripConfirmed
      if (onTripConfirmed && currentTripId) {
        onTripConfirmed({
          trip_data_id: currentTripId,
          confirmed_trip_id: currentTripId
        });
      }
    }
  };

  // NUEVO: Efecto para prevenir que showPickupOrder se resetee
  useEffect(() => {
    if (showPickupOrder) {
      console.log('🔒 Bloqueando reset de showPickupOrder');
      // Prevenir que otros efectos reseteen showPickupOrder
      return () => {
        console.log('🔓 Desbloqueando showPickupOrder');
      };
    }
  }, [showPickupOrder]);

  // NUEVO: Efecto para debuggear cambios en showPickupOrder
  useEffect(() => {
    console.log('🔄 showPickupOrder cambió:', showPickupOrder);
    if (showPickupOrder) {
      console.log('✅ showPickupOrder activado - pantalla de orden de recogida debería mostrarse');
      // CRÍTICO: Asegurar que initialLoading esté desactivado cuando se muestra la pantalla de orden de recogida
      if (initialLoading) {
        console.log('🔧 Desactivando initialLoading para mostrar pantalla de orden de recogida');
        setInitialLoading(false);
      }
    } else {
      console.log('❌ showPickupOrder desactivado - pantalla de orden de recogida oculta');
    }
  }, [showPickupOrder, initialLoading]);

  // NUEVO: Efecto para debuggear cambios en driverInfo
  useEffect(() => {
    console.log('🔄 driverInfo cambió:', driverInfo);
    console.log('🔄 initialLoading cambió:', initialLoading);
    if (driverInfo) {
      console.log('✅ DriverInfo establecido - debería mostrar información del conductor');
    } else {
      console.log('❌ DriverInfo es null - mostrando pantalla de carga');
    }
  }, [driverInfo, initialLoading]);

  // Detectar si es un dispositivo móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // NUEVO: Mostrar pantalla de orden de recogida si está activa
  console.log('🔍 Debug orden de recogida:', {
    showPickupOrder,
    userMatchesLength: userMatches.length,
    currentPickupStep,
    userMatches: userMatches,
    initialLoading,
    isPassenger,
    isMobile
  });

  // NUEVO: Usar pasajeros preservados si estamos en la pantalla de orden de recogida
  const assignedPassengers = showPickupOrder && preservedPassengers.length > 0
    ? preservedPassengers // Usar datos preservados cuando estamos en la pantalla de recogida
    : !isPassenger && userMatches.length > 0 && userMatches[0].pasajeros_asignados
      ? userMatches[0].pasajeros_asignados
      : !isPassenger && userMatches.length > 0
      ? userMatches // Usar userMatches directamente si no hay pasajeros_asignados
      : [];

  console.log('🔍 Debug pasajeros asignados:', {
    isPassenger,
    userMatchesLength: userMatches.length,
    hasPasajerosAsignados: userMatches.length > 0 && userMatches[0]?.pasajeros_asignados,
    assignedPassengersLength: assignedPassengers.length,
    preservedPassengersLength: preservedPassengers.length,
    showPickupOrder,
    usingPreservedData: showPickupOrder && preservedPassengers.length > 0
  });

  if (showPickupOrder && assignedPassengers.length > 0) {
    const currentPassenger = assignedPassengers[currentPickupStep];
    const isLastPassenger = currentPickupStep === assignedPassengers.length - 1;
    
    // Mostrar mensaje informativo en móviles si se está usando fallback
    const isUsingFallback = userMatches.length > 0 && userMatches[0].pasajeros_asignados?.some(p => p.distance_source === 'spatial_fallback');

    console.log('✅ Mostrando pantalla de orden de recogida:', {
      currentPassenger,
      isLastPassenger,
      showPickupOrder,
      assignedPassengersLength: assignedPassengers.length
    });

    console.log('🔍 Información detallada del pasajero actual:', {
      nombre: currentPassenger.nombre || currentPassenger.pasajero_nombre,
      correo: currentPassenger.correo || currentPassenger.pasajero_correo,
      pickup: currentPassenger.pickup || currentPassenger.pickup_address,
      destino: currentPassenger.destino || currentPassenger.dropoff_address,
      step: currentPickupStep,
      total: assignedPassengers.length
    });

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6"
      >
        {/* Header */}
        <div className="bg-white shadow-sm border-b rounded-lg mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => {
                    console.log('🔙 Volviendo desde pantalla de orden de recogida');
                    setShowPickupOrder(false);
                    setCurrentPickupStep(0);
                    setCurrentTripId(null);
                    setPreservedPassengers([]); // NUEVO: Limpiar datos preservados
                  }} 
                  variant="ghost" 
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-800">
                    Orden de Recogida
                  </h1>
                  <p className="text-sm text-gray-500">
                    Paso {currentPickupStep + 1} de {assignedPassengers.length}
                  </p>
                </div>
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {Math.round(((currentPickupStep + 1) / assignedPassengers.length) * 100)}% Completado
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje informativo para móviles usando fallback */}
        {isMobile && isUsingFallback && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Modo Optimizado para Móvil
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Estás usando el modo de emparejamiento optimizado para dispositivos móviles. Las distancias son aproximadas.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información del pasajero actual */}
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <span>
                  {isLastPassenger ? 'Último Pasajero' : `Pasajero ${currentPickupStep + 1}`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800 text-lg">
                        {currentPassenger.nombre || currentPassenger.pasajero_nombre || `Pasajero ${currentPickupStep + 1}`}
                      </h3>
                      <p className="text-green-600 text-sm">
                        {currentPassenger.correo || currentPassenger.pasajero_correo || 'Sin email'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">📍 Dirección de Recogida</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {currentPassenger.pickup || currentPassenger.pickup_address || 'Dirección no disponible'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">🎯 Destino</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {currentPassenger.destino || currentPassenger.dropoff_address || 'Universidad'}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">📋 Instrucciones</h4>
                  <p className="text-blue-700">
                    {isLastPassenger 
                      ? 'Recoge a este pasajero y luego dirígete hacia la universidad'
                      : `Recoge a este pasajero y luego continúa con el siguiente`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={handleNextPickup}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              size="lg"
            >
              {isLastPassenger ? (
                <>
                  <Car className="w-4 h-4 mr-2" />
                  Completar Recogida
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Siguiente Pasajero
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // NUEVO: Mostrar pantalla de optimización si está activa (TEMPORALMENTE DESHABILITADO)
  // if (showPickupOptimization && currentTripId) {
  //   return (
  //     <DriverPickupFallback
  //       tripId={currentTripId}
  //       tripType="ida"
  //       onBack={() => {
  //         setShowPickupOptimization(false);
  //         setCurrentTripId(null);
  //       }}
  //       onTripComplete={() => {
  //         setShowPickupOptimization(false);
  //         setCurrentTripId(null);
  //         if (onTripConfirmed) {
  //           onTripConfirmed({
  //             trip_data_id: currentTripId,
  //             confirmed_trip_id: currentTripId
  //           });
  //         }
  //       }}
  //     />
  //   );
  // }

  return (
    <motion.div
      key="matchmaking"
      initial="initial"
      animate="in"
      exit="out"
      className="p-6 flex flex-col bg-background text-foreground flex-grow h-full"
    >
      <div className="flex items-center mb-8 pt-8">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} disabled={!!isSubmitting}>
            <ArrowLeft/>
          </Button>
        )}
        <h2 className="text-2xl font-bold text-primary ml-4">
          {isPassenger ? 'Conductores Disponibles' : 'Panel de Viaje'}
        </h2>
      </div>

      {initialLoading && !showPickupOrder ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <p className="text-muted-foreground">Buscando...</p>
          <div className="text-xs text-muted-foreground">
            Debug: initialLoading={initialLoading.toString()}, driverInfo={driverInfo ? 'exists' : 'null'}, showPickupOrder={showPickupOrder.toString()}
          </div>
        </div>
      ) : driverInfo ? (
        // Mostrar información del conductor cuando el pasajero fue aceptado
        <div className="flex-1 flex flex-col space-y-6">
          {tripStarted ? (
            // NUEVO: Pantalla cuando el viaje ha iniciado
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-green-800">El conductor ya inició el viaje</h3>
              </div>
              <p className="text-green-700 text-sm mb-4">
                El conductor ha iniciado el viaje y está en camino hacia tu ubicación.
              </p>
              
              {/* NUEVO: Botón de confirmación */}
              <div className="mt-4 space-y-3">
                <Button
                  onClick={async () => {
                    try {
                      const destination = driverInfo?.trip_info?.destino || '';
                      const direction = getTripDirection(destination);
                      
                      let confirmationMessage = '';
                      if (direction === 'to_university') {
                        confirmationMessage = "¡Gracias por confirmar! El conductor ya te recogió.";
                      } else if (direction === 'from_university') {
                        confirmationMessage = "¡Gracias por confirmar! El conductor ya te dejó en tu destino.";
                      } else {
                        confirmationMessage = "¡Gracias por confirmar! El conductor ya te recogió.";
                      }
                      
                      // NUEVO: Guardar confirmación en la base de datos
                      if (currentTripId && user?.email) {
                        const { error } = await supabase
                          .from('trip_confirmations')
                          .upsert({
                            trip_id: currentTripId,
                            passenger_email: user.email,
                            confirmed: true,
                            confirmed_at: new Date().toISOString(),
                            confirmation_type: direction === 'to_university' ? 'picked_up' : 'dropped_off'
                          }, { onConflict: ['trip_id', 'passenger_email'] });
                        
                        if (error) {
                          console.error("Error al guardar confirmación:", error);
                        } else {
                          console.log("✅ Confirmación guardada en la base de datos");
                        }
                      }
                      
                      setPassengerConfirmed(true);
                      
                      toast({
                        title: "¡Confirmado!",
                        description: confirmationMessage,
                        variant: "default"
                      });
                      
                    } catch (error) {
                      console.error("Error al confirmar:", error);
                      toast({
                        title: "Error",
                        description: "No se pudo procesar la confirmación. Intenta de nuevo.",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={passengerConfirmed}
                  className={`w-full text-white ${passengerConfirmed 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'}`}
                  size="sm"
                >
                  {(() => {
                    const destination = driverInfo?.trip_info?.destino || '';
                    const direction = getTripDirection(destination);
                    
                    if (passengerConfirmed) {
                      return "✓ Confirmado";
                    } else if (direction === 'to_university') {
                      return "El conductor ya me recogió";
                    } else if (direction === 'from_university') {
                      return "El conductor ya me dejó en mi destino";
                    } else {
                      return "El conductor ya me recogió";
                    }
                  })()}
                </Button>
                
                {/* NUEVO: Botón para ir al viaje en curso */}
                <Button
                  onClick={() => {
                    console.log("🚀 Usuario navegando manualmente al viaje:", tripId);
                    navigate(`/trip/${tripId}`);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Ir al Viaje en Curso
                </Button>
              </div>
            </div>
          ) : (
            // Pantalla original de "¡Conductor Encontrado!"
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-green-800">¡Conductor Encontrado!</h3>
              </div>
              <p className="text-green-700 text-sm">
                Un conductor ha aceptado tu solicitud de viaje.
              </p>
            </div>
          )}

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {driverInfo.conductor_full_name?.charAt(0) || 'C'}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold">{driverInfo.conductor_full_name}</h4>
                <p className="text-sm text-muted-foreground">{driverInfo.conductor_email}</p>
              </div>
            </div>

            {/* NUEVO: Mostrar información del viaje si está disponible */}
            {driverInfo.trip_info && (
              <div className="pt-4 border-t space-y-2">
                <h5 className="font-medium text-sm text-muted-foreground">Detalles del Viaje:</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span><strong>Desde:</strong> {driverInfo.trip_info.pickup}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-muted-foreground" />
                    <span><strong>Hasta:</strong> {driverInfo.trip_info.destino}</span>
                  </div>
                  {driverInfo.trip_info.distance_km && (
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span><strong>Distancia:</strong> {driverInfo.trip_info.distance_km}km</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Aceptado el: {driverInfo.accepted_at}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Sección para el CONDUCTOR: Pasajeros asignados */}
          {!isPassenger && userMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center text-muted-foreground">
                Pasajeros Asignados
              </h3>
              <div className="space-y-4">
                {userMatches.map(match => (
                  <div key={match.conductor_id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Tu Viaje</h4>
                        <p className="text-sm text-muted-foreground">
                          {match.pasajeros_asignados.length} pasajero{match.pasajeros_asignados.length > 1 ? 's' : ''} asignado{match.pasajeros_asignados.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Desde:</span> {match.pickup}
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Navigation className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Hasta:</span> {match.destino}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium text-sm text-muted-foreground">Pasajeros:</h5>
                      {match.pasajeros_asignados.map((passenger, index) => (
                        <div key={index} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{passenger.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {passenger.distance_km}km de distancia
                              </p>
                            </div>
                            <Button
                              onClick={() => handleDriverAcceptPassenger(passenger)}
                              disabled={isSubmitting === (passenger.pasajero_correo || passenger.correo) || acceptedPassengers.includes(passenger.pasajero_correo || passenger.correo)}
                              size="sm"
                              className={
                                acceptedPassengers.includes(passenger.pasajero_correo || passenger.correo)
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-primary hover:bg-primary/90"
                              }
                            >
                              {isSubmitting === (passenger.pasajero_correo || passenger.correo)
                                ? "Aceptando..."
                                : acceptedPassengers.includes(passenger.pasajero_correo || passenger.correo)
                                ? "Pasajero Aceptado"
                                : "Aceptar"
                              }
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">Pickup:</span> {passenger.pickup}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón para iniciar viaje */}
              {userMatches.length > 0 && (
                <div className="text-center mt-6">
                  <Button
                    onClick={handleStartTrip}
                    disabled={isSubmitting === 'start_trip'}
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
                    size="lg"
                  >
                    {isSubmitting === 'start_trip' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Iniciando Viaje...
                      </>
                    ) : (
                      <>
                        <Car className="w-4 h-4 mr-2" />
                        Iniciar Viaje
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Pantalla de espera local para pasajero */}
          {isPassenger && passengerWaitingForDriver && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative flex justify-center items-center">
                <Loader2 className="w-24 h-24 text-primary/20" />
                <Loader2 className="w-16 h-16 text-primary/40 animate-spin absolute" />
                <Clock className="w-6 h-6 text-primary absolute" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary">Esperando Confirmación del Conductor</h3>
                <p className="text-muted-foreground max-w-sm">
                  Tu solicitud de viaje ha sido enviada al conductor. El conductor revisará tu solicitud y decidirá si acepta el viaje.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>Esperando respuesta del conductor...</span>
                </div>
                <div className="text-xs text-muted-foreground max-w-xs">
                  ⏱️ Tiempo máximo de espera: 60 segundos
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPassengerWaitingForDriver(false);
                    if (waitingTimeoutRef.current) {
                      clearTimeout(waitingTimeoutRef.current);
                      waitingTimeoutRef.current = null;
                    }
                    toast({
                      title: "Espera cancelada",
                      description: "Puedes intentar con otro conductor.",
                      variant: "default"
                    });
                  }}
                  className="mt-4"
                >
                  Cancelar Espera
                </Button>
              </div>
            </div>
          )}

          {/* Sección para el PASAJERO: Conductores encontrados */}
          {isPolling && isPassenger && getUserMatches(false).filter(match => match.role === 'available_driver').length > 0 && !passengerWaitingForDriver && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2 text-center text-muted-foreground">
                Conductores Disponibles
              </h3>
              {getUserMatches(false).filter(match => match.role === 'available_driver').map(match => (
                <div key={match.driver_pool_id || match.conductor_id || match.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{match.nombre_conductor || match.profile?.full_name || 'Conductor'}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${match.price_per_seat ?? 0} • {match.available_seats ?? 1} cupos{typeof match.distance_km === 'number' ? ` • ${match.distance_km.toFixed(1)}km` : ''}
                      </p>
                    </div>
                    <Button
                      onClick={() => handlePassengerRequestTrip({
                        ...match,
                        id: match.driver_pool_id || match.conductor_id || match.id,
                        pickup_address: match.pickup_address || match.pickup,
                        dropoff_address: match.dropoff_address || match.destino,
                      })}
                      disabled={isSubmitting === (match.driver_pool_id || match.conductor_id || match.id)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting === (match.driver_pool_id || match.conductor_id || match.id) ? "Solicitando..." : "Solicitar"}
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Desde:</span> {match.pickup_address || match.pickup}
                    </div>
                    <div>
                      <span className="font-medium">Hasta:</span> {match.dropoff_address || match.destino}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mensaje cuando no se encuentran conductores - REMOVIDO */}

          {/* Mensajes de "esperando" */}
          {isPassenger && isPolling && matches.length === 0 && !passengerWaitingForDriver && (
            <p className="text-center text-muted-foreground pt-10">Buscando conductores disponibles...</p>
          )}

          {/* Mensaje cuando el conductor no tiene pasajeros asignados */}
          {!isPassenger && userMatches.length === 0 && !error && (
            <div className="text-center pt-10 space-y-4">
              <p className="text-muted-foreground">Buscando pasajeros compatibles...</p>
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
          )}


          {/* Mensaje de error */}
          {error && (
            <div className="text-center pt-10 space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-destructive mb-2">Error de Conexión</h3>
                <p className="text-muted-foreground mb-4">
                  No se pudo conectar con el servicio de emparejamiento. Esto puede ser porque:
                </p>
                <ul className="text-sm text-muted-foreground text-left space-y-1 mb-4">
                  <li>• La API de Python no está ejecutándose</li>
                  <li>• Hay problemas de conectividad</li>
                  <li>• El servidor está temporalmente no disponible</li>
                </ul>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setError(null);
                      runPythonMatchmaking();
                    }}
                    variant="outline"
                    className="mr-2"
                  >
                    Reintentar Conexión
                  </Button>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Modo Manual Activado",
                        description: "Puedes gestionar tu viaje manualmente desde el panel principal."
                      });
                      // Opcional: redirigir al panel principal
                      if (onBack) onBack();
                    }}
                    variant="secondary"
                  >
                    Continuar en Modo Manual
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de "pausado" */}
          {!isPolling && !error && (
            <p className="text-center text-muted-foreground pt-10">La búsqueda activa está pausada. No recibirás nuevas actualizaciones.</p>
          )}

          {/* Botón de Pausar/Reanudar */}
          {isPassenger && (
            <div className="text-center mt-8">
              <Button variant="outline" onClick={() => setIsPolling(!isPolling)}>
                <Clock className="w-4 h-4 mr-2" />
                {isPolling ? 'Pausar Búsqueda Activa' : 'Reanudar Búsqueda'}
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MatchmakingScreen;
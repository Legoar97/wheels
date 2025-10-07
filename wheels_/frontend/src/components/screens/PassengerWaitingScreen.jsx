import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, XCircle, Clock, User, MapPin, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TripStartedScreen from './TripStartedScreen';

const PassengerWaitingScreen = ({ 
  tripRequestId, 
  driverInfo, 
  onTripAccepted, 
  onCancel, 
  pageVariants, 
  pageTransition 
}) => {
  console.log("🎬 PassengerWaitingScreen rendered with:", { 
    tripRequestId, 
    driverInfo: driverInfo?.profile?.full_name || driverInfo?.nombre_conductor,
    hasOnTripAccepted: !!onTripAccepted,
    hasOnCancel: !!onCancel 
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isListening, setIsListening] = useState(true);
  const intervalRef = useRef(null);
  const channelRef = useRef(null);
  const navigate = useNavigate();
  const [tripId, setTripId] = useState(null); // Nuevo estado para el tripId
  const [showTripStarted, setShowTripStarted] = useState(false); // Nuevo estado para mostrar pantalla de viaje iniciado

  // Timer para mostrar tiempo transcurrido
  useEffect(() => {
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Escuchar cambios en trip_requests para saber cuando el conductor acepta
  useEffect(() => {
    if (!tripRequestId || !isListening) return;
    
    console.log("🎧 Pasajero escuchando cambios en trip_request:", tripRequestId);
    
    const channel = supabase
      .channel(`trip-request-${tripRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trip_requests',
          filter: `id=eq.${tripRequestId}`,
        },
        (payload) => {
          console.log("📨 Cambio detectado en trip_request:", payload);
          
          if (payload.new.status === 'accepted') {
            console.log("✅ Solicitud aceptada por el conductor!");
            
            toast({
              title: "¡Solicitud Aceptada!",
              description: "El conductor ha aceptado tu solicitud. Preparando tu viaje...",
              variant: "default"
            });
            
            setIsListening(false);
            
            // Dar un momento para que el usuario vea el mensaje
            setTimeout(() => {
              if (onTripAccepted) {
                onTripAccepted(payload.new);
              }
            }, 2000);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tripRequestId, isListening, onTripAccepted]);

  // También escuchar cambios en confirmed_trips por si se crea directamente
  useEffect(() => {
    if (!tripRequestId || !isListening) return;
    
    const confirmedChannel = supabase
      .channel(`confirmed-trips-${tripRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'confirmed_trips',
          filter: `trip_request_id=eq.${tripRequestId}`,
        },
        (payload) => {
          console.log("🎉 Viaje confirmado creado:", payload);
          
          toast({
            title: "¡Viaje Confirmado!",
            description: "Tu viaje ha sido confirmado. Esperando que el conductor inicie...",
            variant: "default"
          });
          // NO desactivar isListening aquí, solo guardar el tripId
          // Guardar el tripId para el listener de inicio de viaje
          setTripId(payload.new.trip_data_id || payload.new.trip_id || payload.new.id);
          console.log("📝 TripId establecido:", payload.new.trip_data_id || payload.new.trip_id || payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(confirmedChannel);
    };
  }, [tripRequestId, isListening]);

  // Listener para detectar cuando el viaje cambia a 'in_progress' y mostrar pantalla de viaje iniciado
  useEffect(() => {
    if (!tripId) return;
    const tripChannel = supabase
      .channel(`trip-status-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trip_data', // Cambiado a trip_data
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.new.status === 'in_progress') {
            console.log("🚀 Viaje iniciado, mostrando pantalla de confirmación");
            setShowTripStarted(true);
            setIsListening(false);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(tripChannel);
    };
  }, [tripId]);

  const handleCancel = async () => {
    try {
      // Cancelar la solicitud en la base de datos
      const { error } = await supabase
        .from('trip_requests')
        .update({ status: 'cancelled' })
        .eq('id', tripRequestId);

      if (error) throw error;

      toast({
        title: "Solicitud Cancelada",
        description: "Has cancelado tu solicitud de viaje.",
        variant: "default"
      });

      setIsListening(false);
      
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error("Error al cancelar solicitud:", error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la solicitud. Intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Función para manejar la continuación al viaje
  const handleContinueToTrip = () => {
    console.log("🚀 Continuando al viaje:", tripId);
    navigate(`/trip/${tripId}`);
  };

  // Si el viaje ha sido iniciado, mostrar la pantalla de viaje iniciado
  if (showTripStarted) {
    return (
      <TripStartedScreen
        tripId={tripId}
        driverInfo={driverInfo}
        onContinue={handleContinueToTrip}
        pageVariants={pageVariants}
        pageTransition={pageTransition}
      />
    );
  }

  return (
    <motion.div
      key="passenger-waiting"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="p-6 flex flex-col items-center justify-center text-center bg-background text-foreground flex-grow h-full"
    >
      <div className="space-y-6 max-w-md w-full">
        
        {/* Indicador de carga principal */}
        <div className="relative flex justify-center items-center">
          <div className="relative">
            <Loader2 className="w-32 h-32 text-primary/20" />
            <Loader2 className="w-24 h-24 text-primary/40 animate-spin absolute inset-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Clock className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-primary">{formatTime(elapsedTime)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Título principal */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-primary">Esperando Confirmación</h2>
          <p className="text-muted-foreground">
            Tu solicitud ha sido enviada al conductor. Te notificaremos cuando sea aceptada.
          </p>
        </div>

        {/* Información del conductor si está disponible */}
        {driverInfo && (
          <Card className="bg-card/80 border border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">
                    {driverInfo.profile?.full_name || driverInfo.nombre_conductor || 'Conductor'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Solicitud enviada
                  </p>
                </div>
              </div>

              {/* Información del viaje */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Desde:</span>
                  <span className="text-muted-foreground">
                    {driverInfo.pickup_address || driverInfo.pickup}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Hasta:</span>
                  <span className="text-muted-foreground">
                    {driverInfo.dropoff_address || driverInfo.destino}
                  </span>
                </div>
                {driverInfo.price_per_seat && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Precio:</span>
                    <span className="text-primary font-semibold">
                      {driverInfo.price_per_seat.toLocaleString('es-CO', { 
                        style: 'currency', 
                        currency: 'COP', 
                        minimumFractionDigits: 0 
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estados de la solicitud */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Esperando respuesta del conductor...</span>
          </div>
          
          {elapsedTime > 60 && (
            <div className="text-xs text-muted-foreground">
              Si no recibes respuesta en unos minutos, puedes cancelar y buscar otro conductor.
            </div>
          )}
        </div>

        {/* Botón de cancelar */}
        <div className="pt-4">
          <Button 
            variant="destructive" 
            onClick={handleCancel}
            className="w-full"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Cancelar Solicitud
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• El conductor puede tardar unos minutos en responder</p>
          <p>• Te notificaremos inmediatamente cuando acepte</p>
          <p>• Puedes cancelar en cualquier momento</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PassengerWaitingScreen;

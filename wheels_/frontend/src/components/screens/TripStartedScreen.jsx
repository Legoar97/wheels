import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Car, MapPin, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TripStartedScreen = ({ 
  tripId, 
  driverInfo, 
  onContinue, 
  pageVariants, 
  pageTransition 
}) => {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  console.log("🚀 TripStartedScreen rendered with:", { 
    tripId, 
    driverInfo: driverInfo?.conductor_full_name || driverInfo?.nombre_conductor,
    hasOnContinue: !!onContinue
  });

  // Countdown para redirigir automáticamente
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirigir automáticamente después del countdown
      if (onContinue) {
        onContinue();
      } else {
        navigate(`/trip/${tripId}`);
      }
    }
  }, [countdown, onContinue, navigate, tripId]);

  // Mostrar toast de confirmación
  useEffect(() => {
    toast({
      title: "¡El viaje ha comenzado!",
      description: "El conductor ha iniciado el viaje. Preparando tu experiencia...",
      variant: "default"
    });
  }, []);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      navigate(`/trip/${tripId}`);
    }
  };

  return (
    <motion.div
      key="trip-started"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="p-6 flex flex-col items-center justify-center text-center bg-background text-foreground flex-grow h-full"
    >
      <div className="space-y-6 max-w-md w-full">
        
        {/* Icono de confirmación */}
        <div className="relative flex justify-center items-center">
          <div className="relative">
            <CheckCircle className="w-32 h-32 text-green-500" />
            <Car className="w-16 h-16 text-green-600 absolute inset-8 animate-pulse" />
          </div>
        </div>

        {/* Título principal */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-green-600">¡Viaje Iniciado!</h2>
          <p className="text-lg text-muted-foreground">
            El conductor ha iniciado el viaje
          </p>
        </div>

        {/* Información del conductor */}
        {driverInfo && (
          <Card className="bg-card/80 border border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">
                    {driverInfo.conductor_full_name || driverInfo.nombre_conductor || 'Conductor'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Conductor confirmado
                  </p>
                </div>
              </div>

              {/* Información del viaje */}
              {driverInfo.trip_info && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Desde:</span>
                    <span className="text-muted-foreground">
                      {driverInfo.trip_info.pickup}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Hasta:</span>
                    <span className="text-muted-foreground">
                      {driverInfo.trip_info.destino}
                    </span>
                  </div>
                  {driverInfo.trip_info.distance_km && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Distancia:</span>
                      <span className="text-muted-foreground">
                        {driverInfo.trip_info.distance_km} km
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estado del viaje */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Viaje en progreso</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Serás dirigido a la pantalla de viaje en curso en {countdown} segundos...
          </div>
        </div>

        {/* Botón para continuar manualmente */}
        <div className="pt-4">
          <Button 
            onClick={handleContinue}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Car className="w-5 h-5 mr-2" />
            Continuar al Viaje
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• El conductor está en camino</p>
          <p>• Podrás seguir el progreso en tiempo real</p>
          <p>• Recibirás notificaciones de actualizaciones</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TripStartedScreen;



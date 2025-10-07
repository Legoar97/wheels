import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle } from 'lucide-react';

const WaitingScreen = ({ tripRequest, onMatchFound, onCancel, pageVariants, pageTransition }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!tripRequest) return;
    
    const channel = supabase
      .channel(`trip-wait-${tripRequest.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripRequest.id}`,
        },
        (payload) => {
          if (payload.new.status === 'matched') {
            toast({
              title: "¡Coincidencia encontrada!",
              description: "Hemos encontrado un viaje para ti. Confirmando...",
            });
            onMatchFound(payload.new);
            supabase.removeChannel(channel);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripRequest, onMatchFound]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      key="waiting"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="p-6 flex flex-col items-center justify-center text-center bg-background text-foreground flex-grow h-full"
    >
      <div className="space-y-6">
        <div className="relative flex justify-center items-center">
          <Loader2 className="w-32 h-32 text-primary/20" />
          <Loader2 className="w-24 h-24 text-primary/40 animate-spin-slow absolute" />
          <p className="absolute text-3xl font-bold text-primary">{formatTime(elapsedTime)}</p>
        </div>
        <h2 className="text-2xl font-bold text-primary">Buscando tu viaje...</h2>
        <p className="text-muted-foreground max-w-xs">
          Estamos buscando activamente una coincidencia para ti. Te notificaremos en cuanto la encontremos.
        </p>
        <Button variant="destructive" onClick={onCancel}>
          <XCircle className="w-5 h-5 mr-2" />
          Cancelar Búsqueda
        </Button>
      </div>
    </motion.div>
  );
};

export default WaitingScreen;
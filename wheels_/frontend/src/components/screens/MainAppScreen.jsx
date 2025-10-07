import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, BarChart2, User, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useUserTripState } from '@/hooks/useUserTripState';
// import axios from 'axios'; // Eliminado, usamos fetch

// ELIMINADO: ActiveTripBanner - Reemplazado por ActiveTripBar global

// ELIMINADO: UserActiveStateBar - Reemplazado por ActiveTripBar global

const MainAppScreen = ({ currentUser, setCurrentUser, handleLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTrip, setActiveTrip] = useState(null);
  
  // NUEVO: Hook para detectar estado del viaje automáticamente
  const { hasActiveTrip } = useUserTripState();

  useEffect(() => {
    const checkActiveTrip = async () => {
      if (!currentUser?.id) return;
      try {
        const { data, error } = await supabase
          .from('confirmed_trips')
          .select('*')
          .or(`passenger_id.eq.${currentUser.id},driver_id.eq.${currentUser.id}`)
          .in('status', ['confirmed', 'in_progress'])
          .limit(1)
          .maybeSingle();
        if (error) {
          console.error("Error checking active trip:", error);
          if (error.code !== 'PGRST116') {
            toast({ title: "Error", description: "No se pudo verificar tu estado de viaje actual.", variant: "destructive" });
          }
          setActiveTrip(null);
        } else {
          setActiveTrip(data);
        }
      } catch (err) {
        console.error("Exception in checkActiveTrip:", err);
        setActiveTrip(null);
      }
    };
    checkActiveTrip();

    if (!currentUser?.id) return;

    // COMENTADO: Listener que puede estar causando cambios de pantalla automáticos
    console.log("⚠️ ATENCIÓN: tripSubscription comentado para evitar cambios automáticos");
    // const tripSubscription = supabase.channel(`trips-user-${currentUser.id}`)
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmed_trips' },
    //     payload => {
    //       if (payload.new.passenger_id === currentUser.id || payload.new.driver_id === currentUser.id) {
    //         if(payload.new.status === 'confirmed' || payload.new.status === 'in_progress') {
    //           setActiveTrip(payload.new);
    //         } else if(payload.new.status === 'completed' || payload.new.status === 'cancelled') {
    //           setActiveTrip(null);
    //         }
    //       }
    //     }
    //   ).subscribe();
      
    return () => {
      // supabase.removeChannel(tripSubscription);
      console.log("⚠️ Cleanup de tripSubscription comentado");
    };
  }, [currentUser?.id]);

  const TABS = [
    { id: 'travel', path: '/app', icon: Car, label: 'Viajar' },
    { id: 'summary', path: '/app/summary', icon: BarChart2, label: 'Resumen' },
    { id: 'account', path: '/app/account', icon: User, label: 'Cuenta' },
  ];

  const currentTab = TABS.find(tab => location.pathname.startsWith(tab.path))?.id || 'travel';
  
  return (
    <motion.div 
      key="mainAppContainer"
      initial="initial"
      animate="in"
      exit="out"
      variants={{initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 }}}
      transition={{duration: 0.3}}
      className="flex flex-col min-h-screen bg-background text-foreground"
    >
      {/* ELIMINADO: UserActiveStateBar y ActiveTripBanner - Ahora se maneja globalmente con ActiveTripBar */}
      
      <main className={`flex-grow overflow-y-auto pb-20 pt-16`}>
        <Outlet />
      </main>

      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg flex justify-around items-center h-16 max-w-md mx-auto rounded-t-xl z-50"
      >
        {TABS.map((tab) => (
          <Link
            to={tab.path}
            key={tab.id}
            className={`flex flex-col items-center justify-center h-full transition-colors duration-200 rounded-none flex-1 cursor-pointer ${
              currentTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-primary/80'
            }`}
          >
            <tab.icon className={`w-5 h-5 mb-0.5 transition-all duration-200 ${currentTab === tab.id ? 'fill-primary/20 stroke-primary' : ''}`} />
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        ))}
      </motion.nav>
    </motion.div>
  );
};

export default MainAppScreen;
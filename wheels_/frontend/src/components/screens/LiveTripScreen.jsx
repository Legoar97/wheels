// src/components/screens/LiveTripScreen.jsx

/*
  ==================================================================
  VERSIÓN FINAL Y COMPLETA
  ==================================================================
  - Este código está diseñado para funcionar con la función SQL `get_trip_details` en tu base de datos de Supabase.
  - Extrae las coordenadas (lat/lng) directamente desde la base de datos, evitando errores de formato.
  - Contiene toda la lógica de los botones y efectos, sin partes faltantes.
*/

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { toast } from '@/components/ui/use-toast';
import { Car, User, Clock, Loader2, Flag, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const LiveTripScreen = ({ currentUser }) => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const { isReady, mapInstance, directionsService, directionsRenderer, markerInstance } = useGoogleMaps(mapRef, null);

  const [tripData, setTripData] = useState(null);
  const [isFetchingTrip, setIsFetchingTrip] = useState(true);
  const [driverProfile, setDriverProfile] = useState(null);
  const [passengerProfile, setPassengerProfile] = useState(null);
  const [etaToPickup, setEtaToPickup] = useState('Calculando...');
  const [etaToDestination, setEtaToDestination] = useState('Calculando...');
  const [driverLocation, setDriverLocation] = useState(null);
  
  const watchIdRef = useRef(null);
  const tripSubscriptionRef = useRef(null);

  const isDriver = driverProfile?.id === currentUser?.id;

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const updateDriverLocationInDB = async (position) => {
    const { latitude, longitude } = position.coords;
    const point = `POINT(${longitude} ${latitude})`;
    // Actualizamos en segundo plano, no es necesario esperar la respuesta.
    await supabase.from('trips').update({ driver_location: point }).eq('id', tripId);
  };

  // Efecto para cargar los datos iniciales del viaje usando la función RPC
  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) return;
      setIsFetchingTrip(true);
      try {
        const { data: tripDetails, error: rpcError } = await supabase
          .rpc('get_trip_details', { trip_uuid: tripId })
          .single();

        if (rpcError) throw rpcError;
        if (!tripDetails) throw new Error("No se pudieron obtener los detalles del viaje.");

        const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', [tripDetails.driver_id, tripDetails.passenger_id]);
        if (profilesError) throw profilesError;

        setTripData(tripDetails);
        setDriverProfile(profiles.find(p => p.id === tripDetails.driver_id));
        setPassengerProfile(profiles.find(p => p.id === tripDetails.passenger_id));
        
        if (tripDetails.driver_location_lat && tripDetails.driver_location_lng) {
            setDriverLocation({ lat: tripDetails.driver_location_lat, lng: tripDetails.driver_location_lng });
        }

      } catch (error) {
        toast({ title: "Error al Cargar el Viaje", description: `Detalle: ${error.message}`, variant: "destructive" });
        navigate('/app');
      } finally {
        setIsFetchingTrip(false);
      }
    };
    fetchTripData();
  }, [tripId, navigate]);

  // Efecto para la geolocalización del conductor
  useEffect(() => {
    if (!isDriver || !tripData) return;
    if (!navigator.geolocation) {
      toast({ title: "Geolocalización no disponible", variant: "destructive" });
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        setDriverLocation(newLocation);
        updateDriverLocationInDB(position);
      },
      (error) => toast({ title: "Error de Ubicación", description: error.message, variant: "destructive" }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [isDriver, tripData]);

  // Efecto para las actualizaciones en tiempo real del pasajero
  useEffect(() => {
    if (isDriver || !tripData) return;

    tripSubscriptionRef.current = supabase.channel(`trip-${tripId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
        async () => {
           const { data: updatedTrip } = await supabase.rpc('get_trip_details', { trip_uuid: tripId }).single();
           if(updatedTrip) {
               setTripData(prev => ({...prev, status: updatedTrip.status})); // Solo actualizamos el estado, no los datos completos
               if(updatedTrip.driver_location_lat && updatedTrip.driver_location_lng) {
                   setDriverLocation({ lat: updatedTrip.driver_location_lat, lng: updatedTrip.driver_location_lng });
               }
           }
        }
      ).subscribe();

    return () => { if (tripSubscriptionRef.current) supabase.removeChannel(tripSubscriptionRef.current); };
  }, [isDriver, tripData, tripId]);


  // Efecto principal para actualizar el mapa y calcular las ETAs
  useEffect(() => {
    if (!isReady || !mapInstance || !directionsService || !directionsRenderer || !tripData || !driverLocation) return;
    
    const pickup = { lat: tripData.pickup_lat, lng: tripData.pickup_lng };
    const dropoff = { lat: tripData.dropoff_lat, lng: tripData.dropoff_lng };
    
    if (!pickup.lat || !dropoff.lat) return;

    // Marcadores, ruta y límites
    const pickupMarker = new window.google.maps.Marker({ position: pickup, map: mapInstance });
    const dropoffMarker = new window.google.maps.Marker({ position: dropoff, map: mapInstance });
    if(markerInstance) markerInstance.setPosition(driverLocation);

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(pickup);
    bounds.extend(dropoff);
    bounds.extend(driverLocation);
    mapInstance.fitBounds(bounds, { top: 250, bottom: 150, left: 50, right: 50 });

    directionsService.route({ origin: driverLocation, destination: dropoff, travelMode: 'DRIVING' }, (result, status) => {
      if (status === 'OK') directionsRenderer.setDirections(result);
    });

    // Calcular ETAs
    if (tripData.status === 'scheduled') {
      directionsService.route({ origin: driverLocation, destination: pickup, travelMode: 'DRIVING' }, (result, status) => {
        if (status === 'OK') setEtaToPickup(result.routes[0].legs[0].duration.text); else setEtaToPickup('No disponible');
      });
    } else {
      setEtaToPickup('En el punto');
    }
    
    if (['scheduled', 'in_progress'].includes(tripData.status)) {
       directionsService.route({ origin: driverLocation, destination: dropoff, travelMode: 'DRIVING' }, (result, status) => {
        if (status === 'OK') setEtaToDestination(result.routes[0].legs[0].duration.text); else setEtaToDestination('No disponible');
      });
    } else {
      setEtaToDestination('Viaje finalizado');
    }

    return () => {
      pickupMarker.setMap(null);
      dropoffMarker.setMap(null);
    };
  }, [isReady, mapInstance, directionsService, directionsRenderer, tripData, driverLocation, markerInstance]);


  const handleStartTrip = async () => {
    try {
      const { error } = await supabase.from('trips').update({ status: 'in_progress', actual_start_time: new Date().toISOString() }).eq('id', tripId);
      if (error) throw error;
      toast({ title: "¡Viaje iniciado!" });
      setTripData(prev => ({ ...prev, status: 'in_progress' }));
    } catch (error) {
      toast({ title: "Error al iniciar el viaje", description: error.message, variant: "destructive" });
    }
  };

  const handleEndTrip = async () => {
    try {
      const { error } = await supabase.from('trips').update({ status: 'completed', actual_end_time: new Date().toISOString() }).eq('id', tripId);
      if (error) throw error;
      toast({ title: "¡Viaje completado!" });
      setTimeout(() => navigate('/app', { replace: true }), 1500);
    } catch (error) {
      toast({ title: "Error al finalizar el viaje", description: error.message, variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-screen w-full overflow-hidden">
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />
      
      {(isFetchingTrip || !isReady || !currentUser) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      )}

      {!isFetchingTrip && isReady && currentUser && driverProfile && passengerProfile && (
        <>
          <div className="absolute top-4 left-4 right-4 z-10 text-center">
            <h1 className="text-2xl font-bold text-primary bg-white/90 backdrop-blur-sm rounded-lg p-3 inline-block shadow-lg">
              Viaje en Curso
            </h1>
          </div>
          <div className="absolute top-24 left-4 right-4 z-10 space-y-4">
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg"><CardContent className="p-4"><div className="flex justify-around items-center"><div className="flex flex-col items-center text-center w-2/5"><Avatar className="w-16 h-16 mb-2"><AvatarImage src={driverProfile.avatar_url} /><AvatarFallback>{getInitials(driverProfile.full_name)}</AvatarFallback></Avatar><p className="text-sm font-bold">Conductor</p><p className="text-sm text-muted-foreground truncate w-full">{driverProfile.full_name}</p></div><div className="flex flex-col items-center flex-shrink-0 mx-2"><div className="w-4 h-4 rounded-full bg-green-500"></div><div className="w-px h-6 bg-border"></div><Car className="w-6 h-6 text-primary" /><div className="w-px h-6 bg-border"></div><div className="w-4 h-4 rounded-full bg-red-500"></div></div><div className="flex flex-col items-center text-center w-2/5"><Avatar className="w-16 h-16 mb-2"><AvatarImage src={passengerProfile.avatar_url} /><AvatarFallback>{getInitials(passengerProfile.full_name)}</AvatarFallback></Avatar><p className="text-sm font-bold">Pasajero</p><p className="text-sm text-muted-foreground truncate w-full">{passengerProfile.full_name}</p></div></div></CardContent></Card>
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg"><CardContent className="p-4 text-center space-y-2"><p className="flex items-center justify-center"><Clock className="inline w-4 h-4 mr-2 text-green-500"/>ETA a recogida: <span className="font-bold ml-2">{etaToPickup}</span></p><p className="flex items-center justify-center"><Flag className="inline w-4 h-4 mr-2 text-red-500"/>ETA a destino: <span className="font-bold ml-2">{etaToDestination}</span></p></CardContent></Card>
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10">
            {isDriver && ( tripData.status === 'scheduled' ? <Button size="lg" className="w-full shadow-lg" onClick={handleStartTrip}><Navigation className="w-5 h-5 mr-2" /> Iniciar Viaje</Button> : tripData.status === 'in_progress' ? <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 shadow-lg" onClick={handleEndTrip}><Flag className="w-5 h-5 mr-2" /> Finalizar Viaje</Button> : <div className="text-center text-white bg-green-600 p-3 rounded-lg shadow-lg">Viaje Completado ✓</div>)}
            {!isDriver && <Button size="lg" variant="outline" className="w-full bg-white shadow-lg" onClick={() => navigate('/app')}>Volver al inicio</Button>}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default LiveTripScreen;
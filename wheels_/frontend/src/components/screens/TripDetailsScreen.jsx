import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Clock, Users, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
// 1. --- IMPORTAMOS EL GANCHO DE AUTENTICACIÓN ---
import { useAuth } from '@/contexts/AuthContext';

// 2. --- ELIMINAMOS 'currentUser' DE LOS PROPS ---
// Este componente ya no necesita que le pasen el usuario, lo obtendrá por sí mismo.
const TripDetailsScreen = ({ userType, direction, formData, setFormData, onBack, onFindMatches, pageVariants, pageTransition }) => {
  
  // 3. --- OBTENEMOS EL USUARIO DIRECTAMENTE DEL CONTEXTO ---
  const { user } = useAuth(); // Aquí está la magia. 'user' es el objeto del usuario logueado.

  const [timeSelection, setTimeSelection] = React.useState({ hour: '08', minute: '00', ampm: 'AM' });
  const [isScheduled, setIsScheduled] = React.useState(false);

  React.useEffect(() => {
    const { hour, minute, ampm } = timeSelection;
    if (!isScheduled || !hour || !minute || !ampm) {
      setFormData(prev => ({ ...prev, time: '' }));
      return;
    };

    let h24 = parseInt(hour, 10);
    if (ampm === 'AM' && h24 === 12) h24 = 0;
    else if (ampm === 'PM' && h24 !== 12) h24 += 12;

    const timeString = `${String(h24).padStart(2, '0')}:${minute}`;
    setFormData(prev => ({ ...prev, time: timeString }));
  }, [timeSelection, setFormData, isScheduled]);

  React.useEffect(() => {
    if (!isScheduled) {
      setFormData(prev => ({ ...prev, date: '', time: '' }));
    }
  }, [isScheduled, setFormData]);

  const handleTripSubmit = async () => {
    // 4. --- USAMOS EL 'user' DEL CONTEXTO EN LUGAR DE 'currentUser' ---
    if (!user) {
      console.error("handleTripSubmit fue llamado sin un usuario.");
      toast({
        title: "Error de autenticación",
        description: "No se pudo identificar al usuario. Por favor, intenta iniciar sesión de nuevo.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date && isScheduled) {
      toast({ title: "Error", description: "Por favor selecciona la fecha del viaje", variant: "destructive" });
      return;
    }
    if (!formData.time && isScheduled) {
      toast({ title: "Error", description: "Por favor selecciona la hora del viaje", variant: "destructive" });
      return;
    }
    if (!formData.pickupAddress) {
      toast({ title: "Error", description: "Falta la dirección de recogida.", variant: "destructive" });
      return;
    }
    if (!formData.dropoffAddress) {
      toast({ title: "Error", description: "Falta la dirección de destino.", variant: "destructive" });
      return;
    }
    if (userType === 'conductor' && !formData.seats) {
      toast({ title: "Error", description: "Por favor indica cuántos cupos disponibles tienes", variant: "destructive" });
      return;
    }
    if (userType === 'conductor') {
      const price = parseInt(formData.price, 10);
      if (!price || price < 3000 || price > 10000) {
        toast({ title: "Precio inválido", description: "Por favor define un precio entre $3.000 y $10.000", variant: "destructive" });
        return;
      }
    }

    try {
      const tripDateTime = isScheduled ? new Date(`${formData.date}T${formData.time}`) : new Date();
      
      let poolId;
      let error;
      
      if (userType === 'conductor') {
        // Conductor: va al pool de búsqueda
        const result = await supabase.rpc('add_to_searching_pool', {
          user_uuid: user.id,
          user_type_param: userType,
          pickup_address_param: formData.pickupAddress,
          pickup_lat_param: formData.pickupLatitude || 4.6097,
          pickup_lng_param: formData.pickupLongitude || -74.0817,
          dropoff_address_param: formData.dropoffAddress,
          dropoff_lat_param: formData.dropoffLatitude || 4.6097,
          dropoff_lng_param: formData.dropoffLongitude || -74.0817,
          price_param: parseFloat(formData.price),
          seats_param: parseInt(formData.seats),
          scheduled_date_param: isScheduled ? formData.date : null,
          scheduled_time_param: isScheduled ? formData.time : null
        });
        poolId = result.data;
        error = result.error;
      } else {
        // Pasajero: inicia búsqueda
        const result = await supabase.rpc('start_passenger_search', {
          user_uuid: user.id,
          pickup_address_param: formData.pickupAddress,
          pickup_lat_param: formData.pickupLatitude || 4.6097,
          pickup_lng_param: formData.pickupLongitude || -74.0817,
          dropoff_address_param: formData.dropoffAddress,
          dropoff_lat_param: formData.dropoffLatitude || 4.6097,
          dropoff_lng_param: formData.dropoffLongitude || -74.0817,
          scheduled_date_param: isScheduled ? formData.date : null,
          scheduled_time_param: isScheduled ? formData.time : null
        });
        poolId = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error al iniciar búsqueda:', error);
        toast({ 
          title: "Error", 
          description: "No se pudo iniciar la búsqueda: " + error.message, 
          variant: "destructive" 
        });
        return;
      }

      if (onFindMatches && poolId) {
        onFindMatches({ searchRequestId: poolId });
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast({ 
        title: "Error", 
        description: "Error al procesar la solicitud", 
        variant: "destructive" 
      });
    }
  };
  
  // El resto del archivo no necesita cambios...
  const renderLocationCard = (label, address) => {
    if (!address) return null;
    return (
      <div className="space-y-2">
        <Label className="text-card-foreground flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-primary" />
          {label}
        </Label>
        <div className="p-3 rounded-md bg-input border border-border text-foreground">
          <p className="text-sm text-muted-foreground">{address}</p>
        </div>
      </div>
    );
  };

  const getTodayString = () => new Date().toISOString().split('T')[0];

  return (
    <motion.div
      key="tripDetails"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="p-6 flex flex-col bg-background text-foreground flex-grow h-full"
    >
      <div className="flex items-center mb-8 pt-8">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-primary hover:bg-primary/10">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-2xl font-bold text-primary ml-4">Detalles del viaje</h2>
      </div>

      <Card className="bg-card flex-1">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-around">
              <Button variant={!isScheduled ? "default" : "outline"} onClick={() => setIsScheduled(false)}>Viaje Inmediato</Button>
              <Button variant={isScheduled ? "default" : "outline"} onClick={() => setIsScheduled(true)}>Programar Viaje</Button>
          </div>
        
          {isScheduled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date"><Calendar className="w-4 h-4 mr-2 inline" />Fecha</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} min={getTodayString()} />
              </div>
              <div className="space-y-2">
                <Label><Clock className="w-4 h-4 mr-2 inline" />Hora</Label>
                <div className="grid grid-cols-3 gap-2">
                    <Select value={timeSelection.hour} onValueChange={(h) => setTimeSelection(p => ({ ...p, hour: h }))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map(h => <SelectItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</SelectItem>)}</SelectContent></Select>
                    <Select value={timeSelection.minute} onValueChange={(m) => setTimeSelection(p => ({ ...p, minute: m }))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['00', '15', '30', '45'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                    <Select value={timeSelection.ampm} onValueChange={(val) => setTimeSelection(p => ({ ...p, ampm: val }))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent></Select>
                </div>
              </div>
            </div>
          )}

          {renderLocationCard("Dirección de Recogida", formData.pickupAddress)}
          {renderLocationCard("Dirección de Destino", formData.dropoffAddress)}

          {userType === 'conductor' && (
            <>
              <div className="space-y-2">
                <Label><Users className="w-4 h-4 mr-2 inline"/>Cupos disponibles</Label>
                <Select value={formData.seats} onValueChange={(v) => setFormData({...formData, seats: v})}><SelectTrigger><SelectValue placeholder="Selecciona cupos..."/></SelectTrigger><SelectContent>{[1,2,3,4].map(s => <SelectItem key={s} value={`${s}`}>{s} cupo{s>1?'s':''}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label><DollarSign className="w-4 h-4 mr-2 inline"/>Precio por pasajero</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Ej: 5000" min="3000" max="10000" step="500"/>
              </div>
            </>
          )}

          <Button onClick={handleTripSubmit} className="w-full" size="lg">
            {isScheduled ? 'Programar Viaje' : 'Buscar Viaje Ahora'}
            <Search className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TripDetailsScreen;
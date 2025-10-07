// TripConfirmedScreen.js (un nuevo archivo)
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, User, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TripConfirmedScreen = ({ tripDetails }) => {
  // Suponemos que tripDetails tiene información útil que la función SQL podría devolver
  // o que ya tienes del contexto de la app.

  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-full p-8 bg-background text-foreground"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
      <h1 className="text-3xl font-bold text-primary mb-2">¡Viaje Confirmado!</h1>
      <p className="text-muted-foreground text-center mb-8">
        Tú y tu contraparte han sido conectados. ¡Buen viaje!
      </p>

      <div className="bg-card p-6 rounded-lg w-full max-w-sm text-center">
        <h2 className="text-lg font-semibold mb-4">Detalles del Viaje</h2>
        <div className="space-y-3 text-left">
          <p className="flex items-center"><User className="w-4 h-4 mr-3 text-primary" /> <strong>Pasajero:</strong> Nombre del Pasajero</p>
          <p className="flex items-center"><Car className="w-4 h-4 mr-3 text-primary" /> <strong>Conductor:</strong> Nombre del Conductor</p>
          {/* Aquí mostrarías más detalles del viaje */}
        </div>
      </div>
      
      <Button className="mt-8">Ir al Chat del Viaje</Button>
    </motion.div>
  );
};

export default TripConfirmedScreen;
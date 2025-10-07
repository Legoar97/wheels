import React from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, Navigation } from 'lucide-react';

export const DriverFoundView = ({ driverInfo }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-green-800">¡Conductor Encontrado!</h3>
        </div>
        <p className="text-green-700 text-sm">Un conductor ha aceptado tu solicitud de viaje.</p>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{driverInfo.conductor_full_name?.charAt(0) || 'C'}</span>
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-semibold">{driverInfo.conductor_full_name}</h4>
            <p className="text-sm text-muted-foreground">{driverInfo.conductor_email}</p>
          </div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">Aceptado el: {driverInfo.accepted_at}</p>
        </div>
      </div>
    </motion.div>
  );
};
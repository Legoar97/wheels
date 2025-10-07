import React from 'react';
import { motion } from 'framer-motion';
import { Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const TripInProgressViewPassenger = ({ tripId, driverInfo, onConfirm, confirmed, getTripDirection }) => {
  const navigate = useNavigate();
  const direction = getTripDirection(driverInfo?.trip_info?.destino);
  const buttonText = () => {
      if (confirmed) return "✓ Confirmado";
      return direction === 'to_university' ? "El conductor ya me recogió" : "El conductor ya me dejó";
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-green-800">El viaje ha comenzado</h3>
        </div>
        <p className="text-green-700 text-sm">El conductor está en camino. Puedes ver el progreso en tiempo real.</p>
        <div className="mt-4 space-y-3">
            <Button onClick={onConfirm} disabled={confirmed} className="w-full">
                {buttonText()}
            </Button>
            <Button onClick={() => navigate(`/trip/${tripId}`)} className="w-full" variant="outline">
                <Car className="w-4 h-4 mr-2" /> Ir al Viaje en Curso
            </Button>
        </div>
      </div>
    </motion.div>
  );
};
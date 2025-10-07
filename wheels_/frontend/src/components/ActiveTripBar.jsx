import React from 'react';
import { useTrip } from '@/hooks/useTrip';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ActiveTripBar = () => {
  const { activeTrip, currentScreen } = useTrip();
  const navigate = useNavigate();

  if (!activeTrip) return null;

  const getBarContent = () => {
    switch (activeTrip.state) {
      case 'in_trip':
        return {
          title: 'Viaje en Curso',
          subtitle: `Eres ${activeTrip.role === 'conductor' ? 'conductor' : 'pasajero'}`,
          icon: <MapPin className="w-5 h-5" />,
          color: 'bg-green-600',
          buttonColor: 'bg-green-500 hover:bg-green-400'
        };
      case 'acceptance_pending':
        return {
          title: 'Esperando Confirmación',
          subtitle: 'Tu solicitud está siendo procesada',
          icon: <Clock className="w-5 h-5" />,
          color: 'bg-yellow-600',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-400'
        };
      case 'matched':
        return {
          title: 'Viaje Emparejado',
          subtitle: 'Toca para continuar',
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'bg-blue-600',
          buttonColor: 'bg-blue-500 hover:bg-blue-400'
        };
      case 'searching':
        return {
          title: 'Buscando Viaje',
          subtitle: 'Encontraremos tu viaje pronto',
          icon: <Users className="w-5 h-5" />,
          color: 'bg-purple-600',
          buttonColor: 'bg-purple-500 hover:bg-purple-400'
        };
      default:
        return {
          title: 'Viaje Activo',
          subtitle: 'Toca para ver el viaje',
          icon: <MapPin className="w-5 h-5" />,
          color: 'bg-primary',
          buttonColor: 'bg-primary/80 hover:bg-primary/70'
        };
    }
  };

  const content = getBarContent();

  const handleViewTrip = () => {
    console.log('🚗 ActiveTripBar - Redirigiendo a viaje, estado:', activeTrip.state);
    
    // Lógica simplificada: siempre redirigir a /app (pantalla de matchmaking)
    navigate('/app');
  };

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      className={`${content.color} text-white p-3 rounded-b-lg shadow-lg flex items-center justify-between cursor-pointer fixed top-0 left-0 right-0 max-w-md mx-auto z-50`}
      onClick={handleViewTrip}
    >
      <div className='flex items-center'>
        <div className="mr-3">
          {content.icon}
        </div>
        <div>
          <p className="font-bold text-sm">{content.title}</p>
          <p className="text-xs opacity-90">{content.subtitle}</p>
        </div>
      </div>
      <Button 
        variant="secondary" 
        size="sm"
        className={`${content.buttonColor} text-white border-0`}
        onClick={(e) => {
          e.stopPropagation();
          handleViewTrip();
        }}
      >
        Ver Viaje
      </Button>
    </motion.div>
  );
};

export default ActiveTripBar;

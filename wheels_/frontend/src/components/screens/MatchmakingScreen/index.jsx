import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PassengerView } from './PassengerView';
import { DriverView } from './DriverView';

const MatchmakingScreen = ({
  searchRequestId,
  onTripConfirmed,
  onBack,
  currentUserType,
  onPassengerRequest,
}) => {
  const isPassenger = currentUserType === 'pasajero';

  return (
    <motion.div
      key="matchmaking"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 flex flex-col bg-background text-foreground flex-grow h-full"
    >
      <div className="flex items-center mb-8 pt-8">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft />
          </Button>
        )}
        <h2 className="text-2xl font-bold text-primary ml-4">
          {isPassenger ? 'Encontrar Viaje' : 'Panel de Conductor'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isPassenger ? (
          <PassengerView 
            searchRequestId={searchRequestId}
            onPassengerRequest={onPassengerRequest}
          />
        ) : (
          <DriverView
            searchRequestId={searchRequestId}
            onTripConfirmed={onTripConfirmed}
          />
        )}
      </div>
    </motion.div>
  );
};

export default MatchmakingScreen;
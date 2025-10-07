import React from 'react';
import { Loader2 } from 'lucide-react';
import { usePassengerState } from './hooks/usePassengerState';
import { DriverFoundView } from './components/DriverFoundView';
import { TripInProgressViewPassenger } from './components/TripInProgressViewPassenger';
import { PassengerMatchCard } from './components/PassengerMatchCard';

export const PassengerView = ({ searchRequestId, onPassengerRequest }) => {
  const {
    initialLoading,
    driverInfo,
    tripStarted,
    passengerConfirmed,
    availableDrivers,
    isSubmitting,
    tripId,
    handlePassengerRequestTrip,
    handleConfirmPickup,
    getTripDirection
  } = usePassengerState(searchRequestId, onPassengerRequest);

  if (initialLoading) {
    return <div className="flex-1 flex flex-col items-center justify-center space-y-4"><Loader2 className="w-16 h-16 text-primary animate-spin" /><p>Buscando...</p></div>;
  }

  if (tripStarted) {
    return <TripInProgressViewPassenger tripId={tripId} driverInfo={driverInfo} onConfirm={handleConfirmPickup} confirmed={passengerConfirmed} getTripDirection={getTripDirection} />;
  }
  
  if (driverInfo) {
    return <DriverFoundView driverInfo={driverInfo} />;
  }

  if (availableDrivers.length > 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-2 text-center text-muted-foreground">Conductores Disponibles</h3>
        {availableDrivers.map(match => (
          <PassengerMatchCard 
            key={match.driver_pool_id || match.id}
            match={match}
            onConfirm={handlePassengerRequestTrip}
            isRequesting={isSubmitting === (match.driver_pool_id || match.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center pt-10 space-y-4">
      <p className="text-muted-foreground">Buscando conductores disponibles...</p>
      <div className="flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
    </div>
  );
};
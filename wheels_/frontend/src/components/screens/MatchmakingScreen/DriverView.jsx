// Reemplaza el contenido completo de este archivo

import React from 'react';
import { Loader2, Car } from 'lucide-react';
import { useDriverState } from './hooks/useDriverState';
import { PickupOrderView } from './components/PickupOrderView';
import { Button } from '@/components/ui/button';

export const DriverView = ({ searchRequestId, onTripConfirmed }) => {
  const {
    initialLoading,
    userMatches,
    acceptedPassengers,
    isSubmitting,
    showPickupOrder,
    preservedPassengers,
    currentPickupStep,
    loading,
    handleDriverAcceptPassenger,
    handleStartTrip,
    handleNextPickup,
    handleBackFromPickup,
  } = useDriverState(searchRequestId, onTripConfirmed);

  // --- INICIO DE LA CORRECCIÓN CLAVE ---

  // Condición de carga: Muestra el spinner si es la carga inicial O si está buscando y aún no hay matches.
  if (initialLoading || (loading && userMatches.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <p>Esperando pasajeros compatibles...</p>
      </div>
    );
  }

  // Si está en la pantalla de orden de recogida
  if (showPickupOrder) {
    return (
      <PickupOrderView
        passengers={preservedPassengers}
        currentStep={currentPickupStep}
        onNext={handleNextPickup}
        onBack={handleBackFromPickup}
      />
    );
  }
  
  // Si hay matches para mostrar
  if (userMatches && userMatches.length > 0) {
    return (
      <div className="space-y-6">
        {/* Iteramos sobre la lista de matches del conductor */}
        {userMatches.map(match => (
          // Usamos `conductor_id` como key para el contenedor del viaje
          <div key={match.conductor_id} className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-semibold text-lg mb-4">Tu Viaje Propuesto</h4>
            <div className="space-y-3">
              <h5 className="font-medium text-sm text-muted-foreground">Pasajeros:</h5>
              {/* Iteramos sobre la lista de pasajeros asignados a este match */}
              {match.pasajeros_asignados.map((passenger) => (
                // Usamos `pasajero_correo` como key único para cada pasajero
                <div key={passenger.pasajero_correo} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{passenger.nombre}</p>
                      <p className="text-xs text-muted-foreground">{passenger.distance_km}km de distancia</p>
                    </div>
                    <Button
                      onClick={() => handleDriverAcceptPassenger(passenger)}
                      disabled={isSubmitting === passenger.pasajero_correo || acceptedPassengers.includes(passenger.pasajero_correo)}
                      size="sm"
                      className={acceptedPassengers.includes(passenger.pasajero_correo) ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"}
                    >
                      {isSubmitting === passenger.pasajero_correo 
                        ? "Aceptando..." 
                        : acceptedPassengers.includes(passenger.pasajero_correo) 
                        ? "Aceptado" 
                        : "Aceptar"
                      }
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* El botón de Iniciar Viaje solo aparece si hay matches */}
        <div className="text-center mt-6">
          <Button onClick={handleStartTrip} disabled={isSubmitting === 'start_trip'} size="lg">
            {isSubmitting === 'start_trip' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Car className="mr-2 h-4 w-4" />}
            Iniciar Viaje
          </Button>
        </div>
      </div>
    );
  }

  // --- FIN DE LA CORRECCIÓN CLAVE ---

  // Si no está cargando y no hay matches, muestra el estado de espera.
  return (
    <div className="text-center pt-10 space-y-4">
      <p className="text-muted-foreground">Esperando pasajeros compatibles...</p>
      <div className="flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    </div>
  );
};
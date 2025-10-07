import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

/**
 * Props:
 * - passenger: objeto con los datos del pasajero (incluye pickup_eta, nombre, correo, pickup, destino)
 * - tripId: id del viaje
 * - tripType: 'ida' o 'regreso'
 */
const PassengerPickupScreen = ({ passenger, tripId, tripType = 'ida' }) => {
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('trip_confirmations')
        .upsert({
          trip_id: tripId,
          passenger_email: passenger.correo || passenger.pasajero_correo,
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        }, { onConflict: ['trip_id', 'passenger_email'] });
      if (error) throw error;
      setHasConfirmed(true);
      toast({
        title: '¡Confirmado!',
        description: 'Tu estado ha sido registrado correctamente.',
        variant: 'default',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar la confirmación. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="max-w-lg w-full mb-6">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-primary mb-2">Recogida Programada</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span role="img" aria-label="Pasajero">🧑‍🎓</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 text-lg">
                  {passenger.nombre || passenger.pasajero_nombre || 'Pasajero'}
                </h3>
                <p className="text-green-600 text-sm">
                  {passenger.correo || passenger.pasajero_correo || 'Sin email'}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">📍 Dirección de Recogida</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {passenger.pickup || passenger.pickup_address || 'Dirección no disponible'}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">🎯 Destino</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {passenger.destino || passenger.dropoff_address || 'Universidad'}
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">⏱️ Tiempo estimado de recogida</h4>
            <p className="text-blue-700 text-lg font-bold">
              {passenger.pickup_eta ? `${passenger.pickup_eta} min` : 'Calculando...'}
            </p>
          </div>
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleConfirm}
              disabled={hasConfirmed || loading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              size="lg"
            >
              {tripType === 'ida' ? 'El conductor ya me recogió' : 'Ya llegué a mi destino'}
            </Button>
          </div>
          {hasConfirmed && (
            <div className="text-green-700 text-center mt-2 font-semibold">
              ¡Gracias por confirmar!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PassengerPickupScreen;

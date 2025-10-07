import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Car, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PickupOrderView = ({ passengers, currentStep, onNext, onBack }) => {
  const currentPassenger = passengers[currentStep];
  const isLastPassenger = currentStep === passengers.length - 1;

  if (!currentPassenger) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
      <div className="bg-white shadow-sm border-b rounded-lg mb-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Orden de Recogida</h1>
              <p className="text-sm text-gray-500">Paso {currentStep + 1} de {passengers.length}</p>
            </div>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {Math.round(((currentStep + 1) / passengers.length) * 100)}%
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>{currentPassenger.nombre || `Pasajero ${currentStep + 1}`}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">📍 Dirección de Recogida</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{currentPassenger.pickup || 'No disponible'}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">🎯 Destino</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{currentPassenger.destino || 'Universidad'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4 mt-6">
          <Button onClick={onNext} className="bg-green-600 hover:bg-green-700 text-white" size="lg">
            {isLastPassenger ? (
              <><Car className="w-4 h-4 mr-2" /> Completar Recogida</>
            ) : (
              <><ArrowRight className="w-4 h-4 mr-2" /> Siguiente Pasajero</>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
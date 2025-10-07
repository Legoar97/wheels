import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Navigation, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  Car,
  ArrowRight,
  University,
  User,
  Route
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { pickupOptimizationService } from '@/services/pickupOptimizationService';

const DriverPickupScreen = ({ 
  tripId, 
  tripType = 'ida', 
  onBack, 
  onTripComplete 
}) => {
  // ================================================
  // 🔹 Estados
  // ================================================
  const [currentStep, setCurrentStep] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [stepCompleted, setStepCompleted] = useState(false);

  // ================================================
  // 🔹 Efectos
  // ================================================
  useEffect(() => {
    initializeTrip();
  }, [tripId, tripType]);

  // ================================================
  // 🔹 Funciones principales
  // ================================================

  const initializeTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🚀 Inicializando viaje ${tripId} (${tripType})`);
      
      // Obtener optimización del viaje
      const optimizationData = await pickupOptimizationService.getTripOptimization(tripId, tripType);
      setTripData(optimizationData);
      
      // Obtener el primer paso
      const firstStep = await pickupOptimizationService.getTripStep(tripId, 0);
      setCurrentStep(firstStep);
      
      console.log('✅ Viaje inicializado correctamente');
      
    } catch (err) {
      console.error('❌ Error al inicializar viaje:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del viaje",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    try {
      setStepCompleted(false);
      
      // Marcar paso actual como completado
      if (currentStep) {
        await pickupOptimizationService.completeStep(tripId, currentStep.step);
        console.log(`✅ Paso ${currentStep.step} completado`);
      }
      
      // Obtener siguiente paso
      const nextStepData = await pickupOptimizationService.getNextStep(tripId);
      
      if (nextStepData.trip_completed) {
        setTripCompleted(true);
        toast({
          title: "¡Viaje Completado!",
          description: "Has completado todos los pasos del viaje",
          variant: "default"
        });
        
        if (onTripComplete) {
          onTripComplete();
        }
        return;
      }
      
      setCurrentStep(nextStepData);
      setStepCompleted(true);
      
      // Mostrar toast de confirmación
      toast({
        title: "Paso Completado",
        description: "Siguiente paso cargado correctamente",
        variant: "default"
      });
      
    } catch (err) {
      console.error('❌ Error al avanzar al siguiente paso:', err);
      toast({
        title: "Error",
        description: "No se pudo cargar el siguiente paso",
        variant: "destructive"
      });
    }
  };

  const handleCompleteTrip = () => {
    setTripCompleted(true);
    toast({
      title: "¡Viaje Finalizado!",
      description: "Has completado exitosamente el viaje",
      variant: "default"
    });
    
    if (onTripComplete) {
      onTripComplete();
    }
  };

  // ================================================
  // 🔹 Renderizado de componentes
  // ================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Cargando optimización de ruta...</h2>
          <p className="text-gray-500 mt-2">Calculando el mejor orden de recogida</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error al cargar viaje</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </motion.div>
      </div>
    );
  }

  if (tripCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">¡Viaje Completado!</h2>
          <p className="text-gray-500 mb-6">
            {tripType === 'ida' 
              ? 'Has recogido a todos los pasajeros y llegado a la universidad'
              : 'Has dejado a todos los pasajeros en sus destinos'
            }
          </p>
          <Button onClick={handleCompleteTrip} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Finalizar Viaje
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">No hay pasos disponibles</h2>
          <Button onClick={onBack} variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  // ================================================
  // 🔹 Renderizado principal
  // ================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={onBack} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  {tripType === 'ida' ? 'Recogida de Pasajeros' : 'Entrega de Pasajeros'}
                </h1>
                <p className="text-sm text-gray-500">
                  Viaje ID: {tripId} • Paso {currentStep.current_step + 1} de {currentStep.total_steps}
                </p>
              </div>
            </div>
            <Badge variant={tripType === 'ida' ? 'default' : 'secondary'}>
              {tripType === 'ida' ? 'Ida' : 'Regreso'}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso del viaje</span>
              <span>{pickupOptimizationService.getProgressPercentage()}%</span>
            </div>
            <Progress 
              value={pickupOptimizationService.getProgressPercentage()} 
              className="h-2"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {currentStep.type === 'conductor' && <Car className="w-5 h-5 text-blue-600" />}
                  {currentStep.type === 'pickup' && <User className="w-5 h-5 text-green-600" />}
                  {currentStep.type === 'dropoff' && <User className="w-5 h-5 text-orange-600" />}
                  {currentStep.type === 'destination' && <University className="w-5 h-5 text-purple-600" />}
                  {currentStep.type === 'university' && <University className="w-5 h-5 text-purple-600" />}
                  <span>{currentStep.instruction}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información principal */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Información</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            <strong>Dirección:</strong> {currentStep.direccion}
                          </span>
                        </div>
                        {currentStep.nombre && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              <strong>Nombre:</strong> {currentStep.nombre}
                            </span>
                          </div>
                        )}
                        {currentStep.correo && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              <strong>Email:</strong> {currentStep.correo}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información de tiempo y distancia */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Tiempo y Distancia</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          <strong>Tiempo estimado:</strong> {pickupOptimizationService.formatDuration(currentStep.eta_minutes)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Route className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          <strong>Distancia:</strong> {pickupOptimizationService.formatDistance(currentStep.leg_distance_m)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Navigation className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          <strong>Distancia total:</strong> {pickupOptimizationService.formatDistance(currentStep.cumulative_distance_m)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              {!currentStep.is_last_step ? (
                <Button 
                  onClick={handleNextStep}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Siguiente
                </Button>
              ) : (
                <Button 
                  onClick={handleCompleteTrip}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completar Viaje
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DriverPickupScreen;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  AlertTriangle, 
  RefreshCw, 
  Car,
  MapPin,
  Clock,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { pickupOptimizationService } from '@/services/pickupOptimizationService';

const DriverPickupFallback = ({ 
  tripId, 
  tripType = 'ida', 
  onBack, 
  onTripComplete 
}) => {
  const [serverAvailable, setServerAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verificar disponibilidad del servidor
  useEffect(() => {
    checkServerAvailability();
  }, []);

  const checkServerAvailability = async () => {
    setChecking(true);
    try {
      // Verificación simple del servidor
      const response = await fetch('http://localhost:5001/api/health');
      const available = response.ok;
      setServerAvailable(available);
      
      if (available) {
        // Simular datos del viaje para prueba
        setTripData({
          trip_id: tripId,
          trip_type: tripType,
          conductor: { nombre: 'Conductor', correo: 'conductor@test.com' },
          destination: 'Universidad Nacional'
        });
      }
    } catch (error) {
      console.error('Error al verificar servidor:', error);
      setServerAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const handleRetry = () => {
    checkServerAvailability();
  };

  const handleStartBasicTrip = () => {
    // Iniciar viaje básico sin optimización
    if (onTripComplete) {
      onTripComplete();
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Verificando servidor...</h2>
          <p className="text-gray-500 mt-2">Comprobando disponibilidad del servidor de optimización</p>
        </motion.div>
      </div>
    );
  }

  if (!serverAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Servidor de Optimización No Disponible
          </h2>
          
          <p className="text-gray-500 mb-6">
            El servidor Python de optimización de rutas no está corriendo. 
            Puedes iniciar el viaje sin optimización o configurar el servidor.
          </p>

          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Para usar la optimización de rutas, ejecuta:
              <br />
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                python pickup_optimization_api.py
              </code>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar Conexión
            </Button>
            
            <Button 
              onClick={handleStartBasicTrip}
              variant="outline"
              className="w-full"
            >
              <Car className="w-4 h-4 mr-2" />
              Iniciar Viaje Básico
            </Button>
            
            <Button 
              onClick={onBack}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Cargando optimización...</h2>
          <p className="text-gray-500 mt-2">Calculando la ruta óptima de recogida</p>
        </motion.div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error al cargar viaje</h2>
          <p className="text-gray-500 mb-6">No se pudieron cargar los datos del viaje</p>
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button onClick={onBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Si llegamos aquí, el servidor está disponible y tenemos datos
  // Redirigir a la pantalla de optimización normal
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto p-6"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          ¡Servidor Conectado!
        </h2>
        <p className="text-gray-500 mb-6">
          El servidor de optimización está funcionando correctamente.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Cargar Optimización
        </Button>
      </motion.div>
    </div>
  );
};

export default DriverPickupFallback;

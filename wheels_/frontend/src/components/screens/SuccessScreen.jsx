import React from 'react';
import { motion } from 'framer-motion';
import { Car, User, Users, MapPin, Clock, Palette, ShieldCheck, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SuccessScreen = ({ 
  resetApp, 
  pageVariants, 
  pageTransition, 
  message, 
  buttonText, 
  currentUser, 
  tripUserType, 
  tripDetails 
}) => {

  const renderDriverInfo = () => {
    if (!tripDetails) return null;
    return (
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm shadow-xl mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center"><Car className="w-6 h-6 mr-2"/>Tu Viaje como Conductor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-primary/80"/> 
            <p><span className="font-semibold">Hora:</span> {tripDetails.time}</p>
          </div>
          {tripDetails.direction === 'hacia' && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-primary/80"/>
              <p><span className="font-semibold">Recogida:</span> {tripDetails.pickupLocation}</p>
            </div>
          )}
          {tripDetails.direction === 'desde' && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-primary/80"/>
              <p><span className="font-semibold">Destino:</span> {tripDetails.destination}</p>
            </div>
          )}
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-primary/80"/>
            <p><span className="font-semibold">Cupos ofrecidos:</span> {tripDetails.seats}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50">
            <h4 className="font-semibold text-base text-primary mb-2 flex items-center"><Users className="w-5 h-5 mr-2"/>Pasajeros</h4>
            <p className="text-muted-foreground text-xs">
              ¡Genial! Tu viaje está registrado. En futuras versiones, aquí verás la lista de pasajeros confirmados que recogerás. 
              ¡Prepárate para compartir el viaje!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPassengerInfo = () => {
    if (!tripDetails) return null;
    // Simulamos información del conductor ya que no hay matching real
    const simulatedDriver = {
      name: "Carlos Conductor",
      vehicleModel: "Toyota Corolla",
      vehiclePlate: "XYZ 123",
      vehicleColor: "Gris Oxford",
      rating: 4.8
    };

    return (
      <>
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm shadow-xl mb-3">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center"><User className="w-6 h-6 mr-2"/>Información de tu Conductor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-primary/80"/>
              <p><span className="font-semibold">Nombre:</span> {simulatedDriver.name}</p>
            </div>
            <div className="flex items-center">
              <Car className="w-4 h-4 mr-2 text-primary/80"/>
              <p><span className="font-semibold">Vehículo:</span> {simulatedDriver.vehicleModel}</p>
            </div>
            <div className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-primary/80"/>
              <p><span className="font-semibold">Placa:</span> {simulatedDriver.vehiclePlate}</p>
            </div>
             <div className="flex items-center">
              <Palette className="w-4 h-4 mr-2 text-primary/80"/>
              <p><span className="font-semibold">Color:</span> {simulatedDriver.vehicleColor}</p>
            </div>
             <p className="text-xs text-muted-foreground pt-2">Recuerda verificar estos datos al abordar. ¡Buen viaje!</p>
          </CardContent>
        </Card>
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm shadow-xl mb-6">
          <CardHeader>
             <CardTitle className="text-xl text-primary flex items-center"><MapPin className="w-6 h-6 mr-2"/>Tu Viaje como Pasajero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-primary/80"/>
              <p><span className="font-semibold">Hora:</span> {tripDetails.time}</p>
            </div>
            {tripDetails.direction === 'hacia' && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-primary/80"/>
                <p><span className="font-semibold">Punto de encuentro:</span> {tripDetails.pickupLocation}</p>
              </div>
            )}
            {tripDetails.direction === 'desde' && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-primary/80"/>
                <p><span className="font-semibold">Destino solicitado:</span> {tripDetails.destination}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  };

  const hasTripInfo = !!tripDetails;

  return (
    <motion.div
      key="success"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 gradient-bg text-white overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="my-8"
      >
        <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-glow">
          <Car className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{message || "¡Viaje Creado!"}</h2>
        {!hasTripInfo && (
          <p className="text-white/90 text-base sm:text-lg">
            Tu operación ha sido registrada exitosamente.
          </p>
        )}
      </motion.div>

      {hasTripInfo && tripUserType === 'conductor' && renderDriverInfo()}
      {hasTripInfo && tripUserType === 'pasajero' && renderPassengerInfo()}

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: hasTripInfo ? 0.8 : 0.6 }}
        className="w-full max-w-sm mt-auto pb-8 sm:pb-4"
      >
        <Button
          onClick={resetApp}
          className="w-full bg-white text-primary hover:bg-white/90 shadow-lg btn-minimal text-base"
          size="lg"
        >
          {buttonText || "Volver al Inicio"}
          <ChevronsRight className="w-5 h-5 ml-2"/>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default SuccessScreen;
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import GooglePlacesAutocomplete from '@/components/app/GooglePlacesAutocomplete';
import { toast } from '@/components/ui/use-toast';
import { EXTERNADO_ADDRESS, EXTERNADO_COORDINATES } from '@/lib/googleMapsUtils';

const DirectionScreen = ({ setCurrentStep, direction, setDirection, pageVariants, pageTransition, onBack, setTripFormData }) => {
  const directionJustSet = useRef(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteLabel, setAutocompleteLabel] = useState('');

  useEffect(() => {
    if (direction && directionJustSet.current && !showAutocomplete) {
      if (direction === 'hacia') {
        setAutocompleteLabel('Ingresa tu punto de recogida');
      } else if (direction === 'desde') {
        setAutocompleteLabel('Ingresa tu destino final');
      }
      setShowAutocomplete(true);
      directionJustSet.current = false; 
    }
  }, [direction, showAutocomplete]);

  const handleSetDirection = (dir) => {
    if (direction !== dir) {
        directionJustSet.current = true;
    }
    setDirection(dir);
  };

  const handlePlaceSelected = (place) => {
    toast({
      title: "Dirección Confirmada",
      description: `Punto establecido: ${place.address}`,
    });
    
    const externadoCoords = {
      lat: EXTERNADO_COORDINATES.lat,
      lon: EXTERNADO_COORDINATES.lng,
    };
  
    const selectedCoords = {
      lat: place.coordinates.lat,
      lon: place.coordinates.lng,
    };
  
    if (direction === 'hacia') {
      setTripFormData(prev => ({
        ...prev,
        pickupAddress: place.address,
        pickupLatitude: selectedCoords.lat,
        pickupLongitude: selectedCoords.lon,
        dropoffAddress: EXTERNADO_ADDRESS,
        dropoffLatitude: externadoCoords.lat,
        dropoffLongitude: externadoCoords.lon,
      }));
    } else { // 'desde'
      setTripFormData(prev => ({
        ...prev,
        pickupAddress: EXTERNADO_ADDRESS,
        pickupLatitude: externadoCoords.lat,
        pickupLongitude: externadoCoords.lon,
        dropoffAddress: place.address,
        dropoffLatitude: selectedCoords.lat,
        dropoffLongitude: selectedCoords.lon,
      }));
    }
    setCurrentStep('tripDetails');
  };

  const handleActualBack = () => {
    if (showAutocomplete) {
      setShowAutocomplete(false);
      setDirection(null); 
    } else if (onBack) {
      onBack();
    }
  };

  if (showAutocomplete) {
    return (
      <motion.div
        key="autocomplete-direction"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="p-6 flex flex-col bg-background text-foreground flex-grow h-full"
      >
        <div className="flex items-center mb-6 pt-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleActualBack}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold text-primary ml-4">{autocompleteLabel}</h2>
        </div>
        <GooglePlacesAutocomplete 
          onPlaceSelected={handlePlaceSelected}
          ctaTitle="Mostrar Ruta"
          travelDirection={direction}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="direction-selection"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="p-6 flex flex-col bg-background text-foreground flex-grow h-full"
    >
      <div className="flex items-center mb-8 pt-8">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleActualBack} 
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}
        <h2 className="text-2xl font-bold text-primary ml-4">¿Hacia dónde vas?</h2>
      </div>

      <div className="flex-1 space-y-6 flex flex-col justify-center">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="smooth-transition"
        >
          <Card 
            className={`cursor-pointer smooth-transition ${
              direction === 'hacia' 
                ? 'ring-2 ring-primary shadow-glow bg-primary/10' 
                : 'bg-card hover:border-primary/40'
            }`}
            onClick={() => handleSetDirection('hacia')}
          >
            <CardContent className="p-8 text-center">
              <MapPin className={`w-16 h-16 mx-auto mb-4 smooth-transition ${
                direction === 'hacia' ? 'text-primary' : 'text-primary/70'
              }`} />
              <h3 className={`text-2xl font-bold mb-2 smooth-transition ${
                direction === 'hacia' ? 'text-primary' : 'text-card-foreground'
              }`}>
                Hacia la Universidad
              </h3>
              <p className={`smooth-transition ${
                direction === 'hacia' ? 'text-primary/80' : 'text-muted-foreground'
              }`}>
                Voy camino al Externado
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="smooth-transition"
        >
          <Card 
            className={`cursor-pointer smooth-transition ${
              direction === 'desde' 
                ? 'ring-2 ring-primary shadow-glow bg-primary/10' 
                : 'bg-card hover:border-primary/40'
            }`}
            onClick={() => handleSetDirection('desde')}
          >
            <CardContent className="p-8 text-center">
              <MapPin className={`w-16 h-16 mx-auto mb-4 smooth-transition ${
                direction === 'desde' ? 'text-primary' : 'text-primary/70'
              }`} />
              <h3 className={`text-2xl font-bold mb-2 smooth-transition ${
                direction === 'desde' ? 'text-primary' : 'text-card-foreground'
              }`}>
                Desde la Universidad
              </h3>
              <p className={`smooth-transition ${
                direction === 'desde' ? 'text-primary/80' : 'text-muted-foreground'
              }`}>
                Salgo del Externado
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DirectionScreen;
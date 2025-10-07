import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { MapPin, Search, AlertTriangle, Route, Info } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { EXTERNADO_COORDINATES } from '@/lib/googleMapsUtils';

const GooglePlacesAutocomplete = ({ onPlaceSelected, ctaTitle = "Confirmar Dirección", travelDirection }) => {
  const mapRef = useRef(null);
  const inputRef = useRef(null);

  const {
    isLoaded,
    error,
    mapInstance,
    markerInstance,
    autocompleteInstance,
    directionsService,
    directionsRenderer,
    infoWindow,
  } = useGoogleMaps(mapRef, inputRef);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [isRouteDisplayed, setIsRouteDisplayed] = useState(false);

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }
    if (infoWindow) {
      infoWindow.close();
    }
    setRouteInfo(null);
    setIsRouteDisplayed(false);
    if (markerInstance && selectedPlace) {
      markerInstance.position = selectedPlace.coordinates;
    }
  };

  useEffect(() => {
    if (!autocompleteInstance) return;

    const listener = autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();
      clearRoute();
      if (infoWindow) infoWindow.close();

      if (!place.geometry || !place.geometry.location) {
        toast({
          title: "Lugar no válido",
          description: `No se encontraron detalles para: '${place.name}'. Por favor, selecciona un lugar de las sugerencias.`,
          variant: "destructive",
        });
        setSelectedPlace(null);
        if (markerInstance) markerInstance.position = null;
        setInputValue(place.name || '');
        return;
      }

      if (mapInstance && markerInstance) {
        mapInstance.setCenter(place.geometry.location);
        mapInstance.setZoom(17);
        markerInstance.position = place.geometry.location;
        markerInstance.title = place.name;
      }

      setSelectedPlace({
        address: place.formatted_address,
        name: place.name,
        coordinates: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        },
      });
      setInputValue(place.name || place.formatted_address);
    });

    return () => {
      if (window.google) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [autocompleteInstance, mapInstance, markerInstance, infoWindow]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    if (selectedPlace && event.target.value !== selectedPlace.address && event.target.value !== selectedPlace.name) {
      setSelectedPlace(null);
      if (markerInstance) markerInstance.position = null;
      clearRoute();
    }
  };

  const calculateAndDisplayRoute = () => {
    if (!selectedPlace || !directionsService || !directionsRenderer || !infoWindow) {
      toast({ title: "Error", description: "No se puede calcular la ruta. Falta información o servicios de mapa.", variant: "destructive" });
      return;
    }

    if (markerInstance) markerInstance.position = null;

    const origin = travelDirection === 'hacia' ? selectedPlace.coordinates : EXTERNADO_COORDINATES;
    const destination = travelDirection === 'hacia' ? EXTERNADO_COORDINATES : selectedPlace.coordinates;

    directionsService.route(
      { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
      (response, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(response);
          const route = response.routes[0];
          if (route?.legs?.[0]) {
            const leg = route.legs[0];
            const currentRouteInfo = { distance: leg.distance.text, duration: leg.duration.text };
            setRouteInfo(currentRouteInfo);

            const infoWindowContent = `
              <div style="font-family: 'Inter', Arial, sans-serif; padding: 10px; background-color: rgba(33, 33, 33, 0.9); color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; border-bottom: 1px solid #444; padding-bottom: 5px; color: #E0E0E0;">Detalles del Viaje</h4>
                <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #69F0AE;">Distancia:</strong> ${currentRouteInfo.distance}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #69F0AE;">Duración:</strong> ${currentRouteInfo.duration}</p>
              </div>
            `;
            infoWindow.setContent(infoWindowContent);
            
            let infoWindowPosition = leg.end_location;
            if (route.overview_path?.length > 0) {
              infoWindowPosition = route.overview_path[Math.floor(route.overview_path.length / 2)];
            }
            infoWindow.setPosition(infoWindowPosition);
            infoWindow.open(mapInstance);
          }
          setIsRouteDisplayed(true);
          toast({ title: "Ruta Calculada", description: "Se muestra la ruta más rápida en el mapa." });
        } else {
          toast({ title: "Error de Ruta", description: `No se pudo calcular la ruta: ${status}`, variant: "destructive" });
          setIsRouteDisplayed(false);
        }
      }
    );
  };

  const handleConfirm = () => {
    if (!selectedPlace) {
      toast({ title: "Selecciona un lugar", description: "Por favor, elige un lugar válido de las sugerencias.", variant: "destructive" });
      return;
    }
    if (!isRouteDisplayed) calculateAndDisplayRoute();
    else onPlaceSelected(selectedPlace);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!selectedPlace && inputValue) {
        toast({ title: "Selección manual no permitida", description: "Por favor, selecciona un lugar de la lista de sugerencias.", variant: "destructive" });
      } else if (selectedPlace) {
        handleConfirm();
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-center bg-destructive/10 border border-destructive rounded-md">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-destructive">Error al Cargar Google Maps</h3>
        <p className="text-destructive/80">La búsqueda de direcciones no está disponible.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Cargando Google Maps...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={travelDirection === 'hacia' ? "Ej: Centro Comercial Andino, mi casa..." : "Ej: Restaurante, parque..."}
          className="w-full pl-10 pr-4 py-2 text-base bg-card text-card-foreground border-border"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          disabled={!isLoaded}
        />
      </div>
      
      {/* ✅ ARREGLADO: Removí backgroundColor y agregué border */}
      <div 
        ref={mapRef} 
        style={{ 
          height: '300px', 
          width: '100%', 
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}
        aria-label="Mapa para mostrar la dirección seleccionada y la ruta"
      />

      {selectedPlace && !isRouteDisplayed && (
        <div className="p-3 bg-primary/10 rounded-md border border-primary/30">
          <p className="text-sm font-semibold text-primary flex items-center"><MapPin className="w-4 h-4 mr-2" /> Lugar Seleccionado:</p>
          <p className="text-sm text-foreground font-medium">{selectedPlace.name}</p>
          <p className="text-xs text-muted-foreground">{selectedPlace.address}</p>
        </div>
      )}

      {isRouteDisplayed && routeInfo && (
        <div className="p-3 bg-green-700/30 rounded-md border border-green-500/50">
          <p className="text-sm font-semibold text-green-300 flex items-center"><Info className="w-4 h-4 mr-2" /> Detalles de la Ruta:</p>
          <p className="text-sm text-gray-100">
            {travelDirection === 'hacia' ? `${selectedPlace.name} → U. Externado` : `U. Externado → ${selectedPlace.name}`}
          </p>
          <p className="text-xs text-gray-300">Distancia: {routeInfo.distance}, Duración: {routeInfo.duration}</p>
        </div>
      )}

      <Button 
        onClick={handleConfirm} 
        className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white hover:opacity-90 transition-opacity"
        disabled={!isLoaded || !selectedPlace}
      >
        {isRouteDisplayed ? "Continuar al Siguiente Paso" : ctaTitle}
      </Button>
    </div>
  );
};

export default GooglePlacesAutocomplete;
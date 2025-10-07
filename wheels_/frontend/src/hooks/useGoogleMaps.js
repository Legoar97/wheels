// src/hooks/useGoogleMaps.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { loadGoogleMapsScript, UBER_LIKE_MAP_STYLE, EXTERNADO_COORDINATES } from '@/lib/googleMapsUtils';
import { toast } from '@/components/ui/use-toast';

export const useGoogleMaps = (mapRef, inputRef) => {
  const [state, setState] = useState({
    isLoaded: false,
    mapInstance: null,
    markerInstance: null,
    directionsService: null,
    directionsRenderer: null,
    autocompleteInstance: null,
    infoWindow: null,
    error: null,
    initializationStatus: 'pending' // pending, initializing, ready, error
  });
  
  // Refs para evitar recrear instancias
  const instancesRef = useRef({});
  const initializationAttempted = useRef(false);

  // Debug helper
  const logDebug = (message, data = {}) => {
    console.log(`[useGoogleMaps] ${message}`, data);
  };

  // Efecto para cargar el script de Google Maps
  useEffect(() => {
    logDebug('Iniciando carga del script de Google Maps');
    
    loadGoogleMapsScript(
      () => {
        logDebug('Script de Google Maps cargado exitosamente');
        setState(prev => ({ ...prev, isLoaded: true }));
      },
      () => {
        const error = new Error("Failed to load Google Maps script");
        logDebug('Error al cargar el script de Google Maps', error);
        setState(prev => ({ 
          ...prev, 
          error, 
          initializationStatus: 'error' 
        }));
        toast({
          title: "Error Crítico",
          description: "No se pudo cargar la API de Google Maps. Verifica tu conexión y la API key.",
          variant: "destructive",
        });
      }
    );
  }, []);

  // Efecto principal para inicializar mapa y servicios
  useEffect(() => {
    // Guards
    if (!state.isLoaded || !window.google || !mapRef?.current) {
      logDebug('Condiciones no cumplidas para inicializar', {
        isLoaded: state.isLoaded,
        hasGoogle: !!window.google,
        hasMapRef: !!mapRef?.current
      });
      return;
    }

    // Evitar reinicialización
    if (initializationAttempted.current || state.initializationStatus === 'ready') {
      logDebug('Inicialización ya intentada o completada');
      return;
    }

    initializationAttempted.current = true;
    setState(prev => ({ ...prev, initializationStatus: 'initializing' }));
    logDebug('Comenzando inicialización del mapa y servicios');

    try {
      // Verificar que las APIs necesarias estén disponibles
      if (!window.google.maps.DirectionsService) {
        throw new Error('DirectionsService no está disponible. Verifica los permisos de tu API key.');
      }

      // Crear instancia del mapa
      const map = new window.google.maps.Map(mapRef.current, {
        center: EXTERNADO_COORDINATES,
        zoom: 13,
        styles: UBER_LIKE_MAP_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        }
      });
      instancesRef.current.map = map;
      logDebug('Mapa creado exitosamente');

      // Crear servicio de direcciones
      const directionsService = new window.google.maps.DirectionsService();
      instancesRef.current.directionsService = directionsService;
      logDebug('DirectionsService creado exitosamente');

      // Crear renderer de direcciones
      const directionsRenderer = new window.google.maps.DirectionsRenderer({ 
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#1A73E8',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
      directionsRenderer.setMap(map);
      instancesRef.current.directionsRenderer = directionsRenderer;
      logDebug('DirectionsRenderer creado exitosamente');
      
      // Crear marcador del conductor
      const marker = new window.google.maps.Marker({ 
        map,
        visible: false,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#1A73E8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });
      instancesRef.current.marker = marker;
      logDebug('Marcador creado exitosamente');

      // Crear ventana de información
      const infoWindow = new window.google.maps.InfoWindow();
      instancesRef.current.infoWindow = infoWindow;
      
      // Actualizar estado con todas las instancias
      setState(prev => ({
        ...prev,
        mapInstance: map,
        directionsService,
        directionsRenderer,
        markerInstance: marker,
        infoWindow,
        initializationStatus: 'ready'
      }));

      logDebug('Inicialización completada exitosamente', {
        map: !!map,
        directionsService: !!directionsService,
        directionsRenderer: !!directionsRenderer,
        marker: !!marker
      });

      // Agregar marcador de debug al mapa para verificar que funciona
      new window.google.maps.Marker({
        position: EXTERNADO_COORDINATES,
        map: map,
        title: 'Centro del mapa (Debug)',
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: '#FF0000',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });

    } catch (error) {
      logDebug('Error durante la inicialización', error);
      setState(prev => ({ 
        ...prev, 
        error, 
        initializationStatus: 'error' 
      }));
      toast({
        title: "Error al inicializar el mapa",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [state.isLoaded, mapRef]);

  // Efecto para inicializar Autocomplete
  useEffect(() => {
    if (!state.isLoaded || !window.google?.maps?.places || !inputRef?.current || instancesRef.current.autocomplete) {
      return;
    }

    logDebug('Inicializando Autocomplete');

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'co' },
        fields: ['place_id', 'geometry', 'formatted_address', 'name', 'types'],
        types: ['geocode', 'establishment']
      });

      const bogotaBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(4.4, -74.3),
        new window.google.maps.LatLng(4.9, -73.9)
      );
      autocomplete.setBounds(bogotaBounds);
      autocomplete.setOptions({ strictBounds: false });

      instancesRef.current.autocomplete = autocomplete;
      setState(prev => ({ ...prev, autocompleteInstance: autocomplete }));
      
      logDebug('Autocomplete inicializado correctamente');

      return () => {
        if (window.google?.maps?.event && instancesRef.current.autocomplete) {
          window.google.maps.event.clearInstanceListeners(instancesRef.current.autocomplete);
        }
      };
    } catch (error) {
      logDebug('Error al inicializar Autocomplete', error);
    }
  }, [state.isLoaded, inputRef]);

  // Función helper para calcular rutas
  const calculateRoute = useCallback((origin, destination, callback) => {
    if (!state.directionsService) {
      logDebug('calculateRoute: DirectionsService no disponible');
      if (callback) callback(null, 'SERVICE_NOT_AVAILABLE');
      return;
    }

    logDebug('calculateRoute: Calculando ruta', { origin, destination });

    const request = {
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false,
    };

    state.directionsService.route(request, (result, status) => {
      logDebug('calculateRoute: Respuesta recibida', { status });
      if (callback) callback(result, status);
    });
  }, [state.directionsService]);

  // Debug info
  useEffect(() => {
    logDebug('Estado actual del hook', {
      isLoaded: state.isLoaded,
      hasMap: !!state.mapInstance,
      hasDirections: !!state.directionsService,
      hasRenderer: !!state.directionsRenderer,
      hasMarker: !!state.markerInstance,
      initStatus: state.initializationStatus,
      error: state.error
    });
  }, [state]);

  return {
    ...state,
    calculateRoute,
    isReady: state.initializationStatus === 'ready'
  };
};
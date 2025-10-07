// src/lib/googleMapsUtils.js
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const EXTERNADO_COORDINATES = { lat: 4.6032, lng: -74.0648 };
export const EXTERNADO_ADDRESS = "Universidad Externado de Colombia, Calle 12 #1-17 Este, Bogotá, Colombia";

export const UBER_LIKE_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

let isScriptLoading = false;
let isScriptLoaded = false;
let loadCallbacks = [];

export const loadGoogleMapsScript = (callback, errorCallback) => {
  // Si ya está completamente cargado
  if (isScriptLoaded && window.google?.maps?.places && window.google?.maps?.marker) {
    if (callback) callback();
    return;
  }

  // Si está en proceso de carga, agregar callback a la cola
  if (isScriptLoading) {
    loadCallbacks.push({ callback, errorCallback });
    return;
  }

  // Verificar si el script ya existe en el DOM
  const existingScript = document.getElementById('googleMapsScript');
  
  if (!existingScript) {
    isScriptLoading = true;
    loadCallbacks.push({ callback, errorCallback });

    // Crear función callback global
    window.initMapCallbackGlob = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      
      // Verificar que todas las APIs necesarias estén disponibles
      if (window.google?.maps?.places && window.google?.maps?.marker && window.google?.maps?.DirectionsService) {
        // Ejecutar todos los callbacks pendientes
        loadCallbacks.forEach(({ callback }) => callback && callback());
        loadCallbacks = [];
      } else {
        console.error('Google Maps API cargada pero faltan componentes necesarios');
        loadCallbacks.forEach(({ errorCallback }) => errorCallback && errorCallback());
        loadCallbacks = [];
      }
    };

    const script = document.createElement('script');
    // IMPORTANTE: Removí 'directions' de las bibliotecas y agregué 'loading=async'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker,geometry&v=beta&callback=initMapCallbackGlob&loading=async`;
    script.id = 'googleMapsScript';
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      isScriptLoading = false;
      console.error('Error al cargar el script de Google Maps');
      loadCallbacks.forEach(({ errorCallback }) => errorCallback && errorCallback());
      loadCallbacks = [];
    };

    document.head.appendChild(script);
  } else {
    // El script existe pero puede no estar completamente cargado
    if (window.google?.maps?.places && window.google?.maps?.marker) {
      isScriptLoaded = true;
      if (callback) callback();
    } else {
      isScriptLoading = true;
      loadCallbacks.push({ callback, errorCallback });
      
      // Esperar a que se complete la carga
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places && window.google?.maps?.marker) {
          clearInterval(checkInterval);
          isScriptLoaded = true;
          isScriptLoading = false;
          loadCallbacks.forEach(({ callback }) => callback && callback());
          loadCallbacks = [];
        }
      }, 100);
      
      // Timeout después de 10 segundos
      setTimeout(() => {
        if (!isScriptLoaded) {
          clearInterval(checkInterval);
          isScriptLoading = false;
          console.error('Timeout esperando Google Maps API');
          loadCallbacks.forEach(({ errorCallback }) => errorCallback && errorCallback());
          loadCallbacks = [];
        }
      }, 10000);
    }
  }
};
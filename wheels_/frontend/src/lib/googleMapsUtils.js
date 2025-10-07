// src/lib/googleMapsUtils.js
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const EXTERNADO_COORDINATES = { lat: 4.6032, lng: -74.0648 };
export const EXTERNADO_ADDRESS = "Universidad Externado de Colombia, Calle 12 #1-17 Este, Bogotá, Colombia";

export const UBER_LIKE_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ebe3cd"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#523735"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f1e6"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#c9b2a6"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#dcd2be"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ae9e90"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dfd2ae"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dfd2ae"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#93817c"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#a5b076"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#447530"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f1e6"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#fdfcf8"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f8c967"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#e9bc62"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e98d58"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#db8555"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#806b63"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dfd2ae"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8f7d77"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#ebe3cd"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dfd2ae"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#b9d3c2"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#92998d"
      }
    ]
  }
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
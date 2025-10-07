#!/usr/bin/env python3
"""
Configuración para Google Maps Python Analyzer
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env
load_dotenv()

# Configuración de Google Maps API
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

# Configuración de APIs habilitadas
ENABLED_APIS = {
    'geocoding': True,
    'distance_matrix': True,
    'places': True,
    'directions': True
}

# Configuración de límites y timeouts
API_CONFIG = {
    'request_timeout': 30,  # segundos
    'rate_limit_delay': 0.1,  # segundos entre requests
    'max_retries': 3,
    'cache_expiry': 3600,  # 1 hora en segundos
}

# Configuración de modos de transporte
TRANSPORT_MODES = {
    'driving': 'Conduciendo',
    'walking': 'Caminando',
    'bicycling': 'En bicicleta',
    'transit': 'Transporte público'
}

# Configuración de tipos de lugares
PLACE_TYPES = {
    'restaurant': 'Restaurante',
    'hospital': 'Hospital',
    'school': 'Escuela',
    'bank': 'Banco',
    'gas_station': 'Gasolinera',
    'shopping_mall': 'Centro comercial',
    'university': 'Universidad',
    'airport': 'Aeropuerto'
}

def validate_api_key():
    """Validar que la API key esté configurada"""
    if not GOOGLE_MAPS_API_KEY:
        raise ValueError("""
❌ API key de Google Maps no configurada.

Para configurar:
1. Crea un archivo .env en la raíz del proyecto
2. Agrega: GOOGLE_MAPS_API_KEY=tu_api_key_aqui
3. O configura la variable de entorno del sistema

Obtén tu API key en: https://console.cloud.google.com/apis/credentials
        """)
    return True

def get_api_status():
    """Obtener estado de configuración de APIs"""
    return {
        'api_key_configured': bool(GOOGLE_MAPS_API_KEY),
        'enabled_apis': ENABLED_APIS,
        'config': API_CONFIG
    }

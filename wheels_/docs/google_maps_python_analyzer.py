#!/usr/bin/env python3
"""
Google Maps API Python Analyzer
Análisis de direcciones usando Google Maps APIs
"""

import os
import json
import requests
import pandas as pd
from typing import Dict, List, Optional, Tuple
import time
from datetime import datetime

class GoogleMapsAnalyzer:
    def __init__(self, api_key: str = None):
        """
        Inicializar el analizador de Google Maps
        
        Args:
            api_key (str): Tu API key de Google Maps
        """
        self.api_key = api_key or os.getenv('GOOGLE_MAPS_API_KEY')
        if not self.api_key:
            raise ValueError("❌ API key de Google Maps no encontrada. Configura GOOGLE_MAPS_API_KEY en variables de entorno")
        
        # URLs de las APIs
        self.geocoding_url = "https://maps.googleapis.com/maps/api/geocode/json"
        self.distance_matrix_url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        self.places_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        self.directions_url = "https://maps.googleapis.com/maps/api/directions/json"
        
        # Cache para evitar llamadas repetidas
        self.cache = {}
        
    def geocode_address(self, address: str) -> Dict:
        """
        Convertir dirección a coordenadas (lat, lng)
        
        Args:
            address (str): Dirección a geocodificar
            
        Returns:
            Dict: Información de geocodificación
        """
        cache_key = f"geocode_{address}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        params = {
            'address': address,
            'key': self.api_key
        }
        
        try:
            response = requests.get(self.geocoding_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                result = data['results'][0]
                geocode_data = {
                    'address': result['formatted_address'],
                    'lat': result['geometry']['location']['lat'],
                    'lng': result['geometry']['location']['lng'],
                    'place_id': result['place_id'],
                    'types': result['types'],
                    'status': 'OK'
                }
                self.cache[cache_key] = geocode_data
                return geocode_data
            else:
                return {'status': data['status'], 'error': data.get('error_message', 'Error desconocido')}
                
        except Exception as e:
            return {'status': 'ERROR', 'error': str(e)}
    
    def reverse_geocode(self, lat: float, lng: float) -> Dict:
        """
        Convertir coordenadas a dirección
        
        Args:
            lat (float): Latitud
            lng (float): Longitud
            
        Returns:
            Dict: Información de geocodificación inversa
        """
        cache_key = f"reverse_{lat}_{lng}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        params = {
            'latlng': f"{lat},{lng}",
            'key': self.api_key
        }
        
        try:
            response = requests.get(self.geocoding_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                result = data['results'][0]
                reverse_data = {
                    'address': result['formatted_address'],
                    'lat': lat,
                    'lng': lng,
                    'place_id': result['place_id'],
                    'types': result['types'],
                    'status': 'OK'
                }
                self.cache[cache_key] = reverse_data
                return reverse_data
            else:
                return {'status': data['status'], 'error': data.get('error_message', 'Error desconocido')}
                
        except Exception as e:
            return {'status': 'ERROR', 'error': str(e)}
    
    def calculate_distance(self, origin: str, destination: str, mode: str = 'driving') -> Dict:
        """
        Calcular distancia y tiempo entre dos direcciones
        
        Args:
            origin (str): Dirección de origen
            destination (str): Dirección de destino
            mode (str): Modo de transporte (driving, walking, bicycling, transit)
            
        Returns:
            Dict: Información de distancia y tiempo
        """
        cache_key = f"distance_{origin}_{destination}_{mode}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        params = {
            'origins': origin,
            'destinations': destination,
            'key': self.api_key,
            'units': 'metric',
            'mode': mode,
            'traffic_model': 'best_guess',
            'departure_time': 'now'
        }
        
        try:
            response = requests.get(self.distance_matrix_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                element = data['rows'][0]['elements'][0]
                if element['status'] == 'OK':
                    distance_data = {
                        'origin': origin,
                        'destination': destination,
                        'distance_km': element['distance']['value'] / 1000,
                        'distance_text': element['distance']['text'],
                        'duration_minutes': element['duration']['value'] / 60,
                        'duration_text': element['duration']['text'],
                        'mode': mode,
                        'status': 'OK'
                    }
                    
                    # Agregar información de tráfico si está disponible
                    if 'duration_in_traffic' in element:
                        distance_data['duration_in_traffic_minutes'] = element['duration_in_traffic']['value'] / 60
                        distance_data['duration_in_traffic_text'] = element['duration_in_traffic']['text']
                    
                    self.cache[cache_key] = distance_data
                    return distance_data
                else:
                    return {'status': element['status'], 'error': 'No se pudo calcular la ruta'}
            else:
                return {'status': data['status'], 'error': data.get('error_message', 'Error desconocido')}
                
        except Exception as e:
            return {'status': 'ERROR', 'error': str(e)}
    
    def search_places(self, query: str, location: str = None, radius: int = 5000) -> List[Dict]:
        """
        Buscar lugares usando Google Places API
        
        Args:
            query (str): Término de búsqueda
            location (str): Ubicación de referencia (opcional)
            radius (int): Radio de búsqueda en metros
            
        Returns:
            List[Dict]: Lista de lugares encontrados
        """
        params = {
            'query': query,
            'key': self.api_key
        }
        
        if location:
            params['location'] = location
            params['radius'] = radius
        
        try:
            response = requests.get(self.places_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                places = []
                for place in data['results']:
                    place_data = {
                        'name': place['name'],
                        'address': place['formatted_address'],
                        'lat': place['geometry']['location']['lat'],
                        'lng': place['geometry']['location']['lng'],
                        'place_id': place['place_id'],
                        'rating': place.get('rating', 'N/A'),
                        'types': place['types'],
                        'price_level': place.get('price_level', 'N/A')
                    }
                    places.append(place_data)
                return places
            else:
                return [{'status': data['status'], 'error': data.get('error_message', 'Error desconocido')}]
                
        except Exception as e:
            return [{'status': 'ERROR', 'error': str(e)}]
    
    def get_directions(self, origin: str, destination: str, mode: str = 'driving') -> Dict:
        """
        Obtener direcciones detalladas entre dos puntos
        
        Args:
            origin (str): Dirección de origen
            destination (str): Dirección de destino
            mode (str): Modo de transporte
            
        Returns:
            Dict: Información detallada de direcciones
        """
        params = {
            'origin': origin,
            'destination': destination,
            'key': self.api_key,
            'mode': mode,
            'traffic_model': 'best_guess',
            'departure_time': 'now'
        }
        
        try:
            response = requests.get(self.directions_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                route = data['routes'][0]
                leg = route['legs'][0]
                
                directions_data = {
                    'origin': origin,
                    'destination': destination,
                    'distance_km': leg['distance']['value'] / 1000,
                    'distance_text': leg['distance']['text'],
                    'duration_minutes': leg['duration']['value'] / 60,
                    'duration_text': leg['duration']['text'],
                    'mode': mode,
                    'steps': [],
                    'status': 'OK'
                }
                
                # Agregar información de tráfico si está disponible
                if 'duration_in_traffic' in leg:
                    directions_data['duration_in_traffic_minutes'] = leg['duration_in_traffic']['value'] / 60
                    directions_data['duration_in_traffic_text'] = leg['duration_in_traffic']['text']
                
                # Extraer pasos de la ruta
                for step in leg['steps']:
                    step_data = {
                        'instruction': step['html_instructions'],
                        'distance': step['distance']['text'],
                        'duration': step['duration']['text'],
                        'start_location': step['start_location'],
                        'end_location': step['end_location']
                    }
                    directions_data['steps'].append(step_data)
                
                return directions_data
            else:
                return {'status': data['status'], 'error': data.get('error_message', 'Error desconocido')}
                
        except Exception as e:
            return {'status': 'ERROR', 'error': str(e)}
    
    def analyze_addresses_batch(self, addresses: List[str]) -> pd.DataFrame:
        """
        Analizar múltiples direcciones en lote
        
        Args:
            addresses (List[str]): Lista de direcciones a analizar
            
        Returns:
            pd.DataFrame: DataFrame con análisis de todas las direcciones
        """
        results = []
        
        for i, address in enumerate(addresses):
            print(f"📍 Analizando dirección {i+1}/{len(addresses)}: {address}")
            
            # Geocodificar dirección
            geocode_result = self.geocode_address(address)
            
            if geocode_result['status'] == 'OK':
                result = {
                    'address': address,
                    'formatted_address': geocode_result['address'],
                    'lat': geocode_result['lat'],
                    'lng': geocode_result['lng'],
                    'place_id': geocode_result['place_id'],
                    'types': ', '.join(geocode_result['types']),
                    'status': 'OK'
                }
            else:
                result = {
                    'address': address,
                    'formatted_address': 'N/A',
                    'lat': None,
                    'lng': None,
                    'place_id': 'N/A',
                    'types': 'N/A',
                    'status': geocode_result['status'],
                    'error': geocode_result.get('error', 'N/A')
                }
            
            results.append(result)
            
            # Pequeña pausa para evitar límites de rate
            time.sleep(0.1)
        
        return pd.DataFrame(results)
    
    def calculate_distances_matrix(self, origins: List[str], destinations: List[str], mode: str = 'driving') -> pd.DataFrame:
        """
        Calcular matriz de distancias entre múltiples orígenes y destinos
        
        Args:
            origins (List[str]): Lista de direcciones de origen
            destinations (List[str]): Lista de direcciones de destino
            mode (str): Modo de transporte
            
        Returns:
            pd.DataFrame: Matriz de distancias
        """
        results = []
        
        for origin in origins:
            for destination in destinations:
                if origin != destination:  # No calcular distancia a sí mismo
                    print(f"🚗 Calculando: {origin} → {destination}")
                    
                    distance_result = self.calculate_distance(origin, destination, mode)
                    
                    if distance_result['status'] == 'OK':
                        result = {
                            'origin': origin,
                            'destination': destination,
                            'distance_km': distance_result['distance_km'],
                            'distance_text': distance_result['distance_text'],
                            'duration_minutes': distance_result['duration_minutes'],
                            'duration_text': distance_result['duration_text'],
                            'mode': mode,
                            'status': 'OK'
                        }
                        
                        if 'duration_in_traffic_minutes' in distance_result:
                            result['duration_in_traffic_minutes'] = distance_result['duration_in_traffic_minutes']
                            result['duration_in_traffic_text'] = distance_result['duration_in_traffic_text']
                    else:
                        result = {
                            'origin': origin,
                            'destination': destination,
                            'distance_km': None,
                            'distance_text': 'N/A',
                            'duration_minutes': None,
                            'duration_text': 'N/A',
                            'mode': mode,
                            'status': distance_result['status'],
                            'error': distance_result.get('error', 'N/A')
                        }
                    
                    results.append(result)
                    
                    # Pequeña pausa para evitar límites de rate
                    time.sleep(0.1)
        
        return pd.DataFrame(results)
    
    def save_cache(self, filename: str = 'google_maps_cache.json'):
        """Guardar cache en archivo"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, ensure_ascii=False, indent=2)
        print(f"💾 Cache guardado en {filename}")
    
    def load_cache(self, filename: str = 'google_maps_cache.json'):
        """Cargar cache desde archivo"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                self.cache = json.load(f)
            print(f"📂 Cache cargado desde {filename}")
        except FileNotFoundError:
            print(f"⚠️ Archivo de cache {filename} no encontrado")
        except Exception as e:
            print(f"❌ Error al cargar cache: {e}")


def main():
    """Función principal de ejemplo"""
    
    # Configurar API key
    api_key = "TU_API_KEY_AQUI"  # Reemplaza con tu API key real
    
    # Crear analizador
    analyzer = GoogleMapsAnalyzer(api_key)
    
    # Ejemplo 1: Geocodificar una dirección
    print("=== EJEMPLO 1: Geocodificación ===")
    address = "Calle 26 # 68-35, Bogotá, Colombia"
    result = analyzer.geocode_address(address)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Ejemplo 2: Calcular distancia
    print("\n=== EJEMPLO 2: Cálculo de Distancia ===")
    origin = "Universidad Externado de Colombia, Bogotá"
    destination = "Centro Comercial Santafé, Bogotá"
    distance = analyzer.calculate_distance(origin, destination)
    print(json.dumps(distance, indent=2, ensure_ascii=False))
    
    # Ejemplo 3: Buscar lugares
    print("\n=== EJEMPLO 3: Búsqueda de Lugares ===")
    places = analyzer.search_places("restaurantes", "Bogotá, Colombia")
    for place in places[:3]:  # Mostrar solo los primeros 3
        print(f"📍 {place['name']} - {place['address']} (⭐ {place['rating']})")
    
    # Ejemplo 4: Analizar múltiples direcciones
    print("\n=== EJEMPLO 4: Análisis en Lote ===")
    addresses = [
        "Universidad Externado de Colombia, Bogotá",
        "Centro Comercial Santafé, Bogotá",
        "Aeropuerto El Dorado, Bogotá",
        "Plaza de Bolívar, Bogotá"
    ]
    
    df = analyzer.analyze_addresses_batch(addresses)
    print(df.to_string(index=False))
    
    # Ejemplo 5: Matriz de distancias
    print("\n=== EJEMPLO 5: Matriz de Distancias ===")
    origins = ["Universidad Externado de Colombia, Bogotá"]
    destinations = ["Centro Comercial Santafé, Bogotá", "Aeropuerto El Dorado, Bogotá"]
    
    distance_matrix = analyzer.calculate_distances_matrix(origins, destinations)
    print(distance_matrix.to_string(index=False))
    
    # Guardar cache
    analyzer.save_cache()


if __name__ == "__main__":
    main()

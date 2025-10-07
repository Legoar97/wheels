import pandas as pd
import json
from supabase import create_client, Client
from geopy.distance import geodesic
from datetime import datetime
import uuid
import requests
import os

def get_wheels_dataframes():
    """Trae todas las tablas principales de WHEELS como DataFrames"""
    try:
        # Configuración de Supabase
        url = "https://ozvjmkvmpxxviveniuwt.supabase.co"
        key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dmpta3ZtcHh4dml2ZW5pdXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzYzMjQsImV4cCI6MjA3MjAxMjMyNH0.1bk9TEf-K14xQ2i-Wq5xD8ejZeGZ7t5VhXzxFOuBhbA"
        
        print("🔌 Conectando a Supabase...")
        
        # Crear cliente
        supabase: Client = create_client(url, key)
        
        print("📊 Obteniendo datos de las tablas...")
        
        # Traer las tablas principales
        profiles_response = supabase.table('profiles').select("*").execute()
        print(f"✅ Profiles: {len(profiles_response.data)} registros")
        
        vehicles_response = supabase.table('vehicles').select("*").execute()
        print(f"✅ Vehicles: {len(vehicles_response.data)} registros")
        
        searching_pool_response = supabase.table('searching_pool').select("*").execute()
        print(f"✅ Searching Pool: {len(searching_pool_response.data)} registros")
        
        trip_requests_response = supabase.table('trip_requests').select("*").execute()
        print(f"✅ Trip Requests: {len(trip_requests_response.data)} registros")
        
        confirmed_trips_response = supabase.table('confirmed_trips').select("*").execute()
        print(f"✅ Confirmed Trips: {len(confirmed_trips_response.data)} registros")
        
        # Convertir a DataFrames
        profiles_df = pd.DataFrame(profiles_response.data)
        vehicles_df = pd.DataFrame(vehicles_response.data)
        searching_pool_df = pd.DataFrame(searching_pool_response.data)
        trip_requests_df = pd.DataFrame(trip_requests_response.data)
        confirmed_trips_df = pd.DataFrame(confirmed_trips_response.data)
        
        # Mostrar información de debugging
        if not searching_pool_df.empty:
            print("\n🔍 Información del Searching Pool:")
            print(f"Columnas disponibles: {list(searching_pool_df.columns)}")
            print(f"Primeras filas:")
            print(searching_pool_df.head())
        
        return profiles_df, vehicles_df, searching_pool_df, trip_requests_df, confirmed_trips_df
        
    except Exception as e:
        print(f"❌ Error al obtener datos: {str(e)}")
        return None, None, None, None, None

def calculate_google_maps_distance(origin, destination, api_key=None):
    """Calcula distancia real usando Google Maps Distance Matrix API"""
    try:
        if not api_key:
            api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        
        if not api_key:
            print("⚠️ Google Maps API key no configurada, usando distancia espacial")
            return calculate_haversine_distance(origin, destination)
        
        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            'origins': f"{origin[0]},{origin[1]}",
            'destinations': f"{destination[0]},{destination[1]}",
            'key': api_key,
            'units': 'metric',
            'mode': 'driving',
            'traffic_model': 'best_guess',
            'departure_time': 'now'
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data['status'] != 'OK':
            print(f"❌ Error en Google Maps API: {data['status']}")
            return calculate_haversine_distance(origin, destination)
        
        element = data['rows'][0]['elements'][0]
        if element['status'] != 'OK':
            print("⚠️ No se pudo calcular ruta, usando distancia espacial")
            return calculate_haversine_distance(origin, destination)
        
        distance_km = element['distance']['value'] / 1000
        duration = element['duration']['text']
        duration_in_traffic = element.get('duration_in_traffic', {}).get('text', duration)
        
        return {
            'distance': round(distance_km, 2),
            'duration': duration_in_traffic,
            'source': 'google_maps'
        }
        
    except Exception as e:
        print(f"❌ Error al calcular distancia con Google Maps: {str(e)}")
        return calculate_haversine_distance(origin, destination)

def calculate_haversine_distance(origin, destination):
    """Fallback: Calcula distancia espacial usando fórmula de Haversine"""
    try:
        distance_km = geodesic(origin, destination).km
        return {
            'distance': round(distance_km, 2),
            'duration': f"~{round(distance_km * 1.5)} min",
            'source': 'haversine'
        }
    except:
        return {
            'distance': 999,
            'duration': 'N/A',
            'source': 'error'
        }

def match_rides(searching_pool_df, profiles_df, max_distance_km=5):
    """Función de emparejamiento principal con Google Maps"""
    try:
        # Separar conductores y pasajeros
        drivers = searching_pool_df[searching_pool_df["vehicle_id"].notna()].copy()
        passengers = searching_pool_df[searching_pool_df["vehicle_id"].isna()].copy()
        
        print(f"🔍 Conductores encontrados: {len(drivers)}")
        print(f"🔍 Pasajeros encontrados: {len(passengers)}")
        
        matches = []
        
        for _, driver in drivers.iterrows():
            driver_location = (driver["pickup_lat"], driver["pickup_lng"])
            destino_driver = driver["dropoff_address"]
            available_seats = driver.get("available_seats", 1)
            
            print(f"🚗 Procesando conductor: {driver['driver_id']} - Destino: {destino_driver}")
            
            # Obtener información del conductor
            driver_profile = profiles_df[profiles_df["id"] == driver["driver_id"]]
            driver_name = driver_profile["full_name"].iloc[0] if not driver_profile.empty else "Conductor"
            
            matched_passengers = []
            
            # Filtrar pasajeros por destino primero (más eficiente)
            compatible_passengers = passengers[passengers["dropoff_address"] == destino_driver]
            
            print(f"📍 {len(compatible_passengers)} pasajeros compatibles por destino")
            
            for _, passenger in compatible_passengers.iterrows():
                passenger_location = (passenger["pickup_lat"], passenger["pickup_lng"])
                
                # Calcular distancia usando Google Maps
                distance_result = calculate_google_maps_distance(driver_location, passenger_location)
                
                if distance_result['distance'] > max_distance_km:
                    print(f"❌ Pasajero muy lejos: {distance_result['distance']}km")
                    continue
                
                # Verificar cupos disponibles
                if len(matched_passengers) < available_seats:
                    # Obtener información del pasajero
                    passenger_profile = profiles_df[profiles_df["id"] == passenger["driver_id"]]
                    passenger_name = passenger_profile["full_name"].iloc[0] if not passenger_profile.empty else "Pasajero"
                    
                    matched_passengers.append({
                        "pasajero_id": passenger["driver_id"],
                        "nombre": passenger_name,
                        "pickup": passenger["pickup_address"],
                        "destino": passenger["dropoff_address"],
                        "distance_km": distance_result['distance'],
                        "duration": distance_result['duration'],
                        "distance_source": distance_result['source']
                    })
                    
                    print(f"✅ Pasajero asignado: {passenger_name} - {distance_result['distance']}km ({distance_result['duration']}) - Fuente: {distance_result['source']}")
            
            if matched_passengers:
                matches.append({
                    "conductor_id": driver["driver_id"],
                    "nombre_conductor": driver_name,
                    "pickup": driver["pickup_address"],
                    "destino": destino_driver,
                    "vehicle_info": {
                        "available_seats": available_seats,
                        "price_per_seat": driver.get("price_per_seat", 0)
                    },
                    "pasajeros_asignados": matched_passengers
                })
                
                print(f"🎯 Match creado para conductor: {driver_name} con {len(matched_passengers)} pasajeros")
        
        return matches
        
    except Exception as e:
        print(f"❌ Error en emparejamiento: {str(e)}")
        return []

def create_trip_request(passenger_id, driver_pool_id, pickup_address, dropoff_address, 
                       pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
    """Crear una solicitud de viaje"""
    try:
        url = "https://ozvjmkvmpxxviveniuwt.supabase.co"
        key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dmpta3ZtcHh4dml2ZW5pdXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzYzMjQsImV4cCI6MjA3MjAxMjMyNH0.1bk9TEf-K14xQ2i-Wq5xD8ejZeGZ7t5VhXzxFOuBhbA"
        
        supabase: Client = create_client(url, key)
        
        # Crear la solicitud
        response = supabase.table('trip_requests').insert({
            'passenger_id': passenger_id,
            'driver_pool_id': driver_pool_id,
            'pickup_address': pickup_address,
            'dropoff_address': dropoff_address,
            'pickup_lat': pickup_lat,
            'pickup_lng': pickup_lng,
            'dropoff_lat': dropoff_lat,
            'dropoff_lng': dropoff_lng,
            'status': 'pending'
        }).execute()
        
        return response.data[0] if response.data else None
        
    except Exception as e:
        print(f"Error al crear solicitud: {str(e)}")
        return None

def confirm_trip(driver_id, passenger_id, pickup_address, dropoff_address, 
                pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
    """Confirmar un viaje"""
    try:
        url = "https://ozvjmkvmpxxviveniuwt.supabase.co"
        key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dmpta3ZtcHh4dml2ZW5pdXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzYzMjQsImV4cCI6MjA3MjAxMjMyNH0.1bk9TEf-K14xQ2i-Wq5xD8ejZeGZ7t5VhXzxFOuBhbA"
        
        supabase: Client = create_client(url, key)
        
        # Crear el viaje confirmado
        response = supabase.table('confirmed_trips').insert({
            'driver_id': driver_id,
            'passenger_id': passenger_id,
            'pickup_address': pickup_address,
            'dropoff_address': dropoff_address,
            'pickup_lat': pickup_lat,
            'pickup_lng': pickup_lng,
            'dropoff_lat': dropoff_lat,
            'dropoff_lng': dropoff_lng,
            'status': 'confirmed',
            'confirmed_at': datetime.now().isoformat()
        }).execute()
        
        return response.data[0] if response.data else None
        
    except Exception as e:
        print(f"Error al confirmar viaje: {str(e)}")
        return None

# Función principal para llamar desde fuera
def main_matchmaking():
    """Función principal que ejecuta el emparejamiento completo"""
    try:
        print("🚀 Iniciando emparejamiento...")
        
        # Obtener datos
        profiles_df, vehicles_df, searching_pool_df, trip_requests_df, confirmed_trips_df = get_wheels_dataframes()
        
        if searching_pool_df is None:
            return {"error": "No se pudieron obtener los datos"}
        
        print(f"\n📋 Resumen de datos:")
        print(f"   - Profiles: {len(profiles_df)} usuarios")
        print(f"   - Vehicles: {len(vehicles_df)} vehículos")
        print(f"   - Searching Pool: {len(searching_pool_df)} en búsqueda")
        print(f"   - Trip Requests: {len(trip_requests_df)} solicitudes")
        print(f"   - Confirmed Trips: {len(confirmed_trips_df)} viajes confirmados")
        
        # Ejecutar emparejamiento
        print(f"\n🔍 Ejecutando algoritmo de emparejamiento...")
        matches = match_rides(searching_pool_df, profiles_df)
        
        print(f"\n🎯 Resultados del emparejamiento:")
        print(f"   - Total de matches: {len(matches)}")
        
        return {
            "success": True,
            "matches": matches,
            "total_matches": len(matches),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error en main_matchmaking: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    result = main_matchmaking()
    print(json.dumps(result, indent=2, ensure_ascii=False))

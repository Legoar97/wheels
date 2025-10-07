import os
import json
import time
import requests
import pandas as pd
from datetime import datetime, timezone
from supabase import create_client, Client
from urllib.parse import quote_plus
from typing import Dict, List, Tuple, Optional

# ================================================
# 🔹 Conexión a Supabase
# ================================================
def get_wheels_dataframes():
    # Credenciales de tu proyecto
    url = os.getenv("SUPABASE_URL", "https://ozvjmkvmpxxviveniuwt.supabase.co")
    
    # 🚨 Usa tu service_role key en vez de anon key
    key = os.getenv("SUPABASE_KEY", "your-supabase-key")
    
    # Crear cliente
    supabase: Client = create_client(url, key)
    
    # Consultar tablas
    profiles_response = supabase.table('profiles').select("*").execute()
    vehicles_response = supabase.table('vehicles').select("*").execute()
    searching_pool_response = supabase.table('searching_pool').select("*").execute()
    trip_requests_response = supabase.table('trip_requests').select("*").execute()
    confirmed_trips_response = supabase.table('confirmed_trips').select("*").execute()
    start_of_trip_response = supabase.table('start_of_trip').select("*").execute()
    
    # Debug para start_of_trip
    print("=== Respuesta cruda start_of_trip ===")
    print(start_of_trip_response)
    print("=== Datos devueltos start_of_trip ===")
    print(start_of_trip_response.data)
    print("=====================================")

    # Convertir a DataFrames
    profiles_df = pd.DataFrame(profiles_response.data)
    vehicles_df = pd.DataFrame(vehicles_response.data)
    searching_pool_df = pd.DataFrame(searching_pool_response.data)
    trip_requests_df = pd.DataFrame(trip_requests_response.data)
    confirmed_trips_df = pd.DataFrame(confirmed_trips_response.data)
    start_of_trip_df = pd.DataFrame(start_of_trip_response.data)
    
    return (
        profiles_df,
        vehicles_df,
        searching_pool_df,
        trip_requests_df,
        confirmed_trips_df,
        start_of_trip_df,
        start_of_trip_response
    )

# ================================================
# 🔹 Configuración de Google Maps API
# ================================================
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "your-google-maps-api-key")

def get_distance_duration(origin, destination, api_key=GOOGLE_MAPS_API_KEY):
    """
    Llama a Google Distance Matrix API para calcular distancia y duración
    """
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": origin,
        "destinations": destination,
        "key": api_key
    }
    response = requests.get(url, params=params).json()
    
    if response["status"] == "OK":
        element = response["rows"][0]["elements"][0]
        if element["status"] == "OK":
            return (
                element["distance"]["value"],  # metros
                element["duration"]["value"]   # segundos
            )
    return (0, 0)

def get_route_optimization(origin, destinations, api_key=GOOGLE_MAPS_API_KEY):
    """
    Usa Google Maps Directions API para optimizar la ruta
    """
    # Convertir destinos a string separado por |
    destinations_str = "|".join(destinations)
    
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": origin,
        "destination": destinations_str,
        "waypoints": "optimize:true|" + destinations_str,
        "key": api_key
    }
    
    response = requests.get(url, params=params).json()
    
    if response["status"] == "OK":
        route = response["routes"][0]
        waypoint_order = route.get("waypoint_order", [])
        legs = route["legs"]
        
        return waypoint_order, legs
    
    return [], []

# ================================================
# 🔹 Algoritmo de Optimización de Recogida
# ================================================
class PickupOptimizer:
    def __init__(self, api_key=GOOGLE_MAPS_API_KEY):
        self.api_key = api_key
        
    def calculate_optimal_pickup_order(self, conductor_data: Dict, pasajeros_data: List[Dict], 
                                     destination: str, trip_type: str = "ida") -> Dict:
        """
        Calcula el orden óptimo de recogida usando Google Maps API
        
        Args:
            conductor_data: Datos del conductor
            pasajeros_data: Lista de datos de pasajeros
            destination: Destino final del viaje
            trip_type: "ida" o "regreso"
        """
        
        if trip_type == "ida":
            return self._optimize_pickup_trip(conductor_data, pasajeros_data, destination)
        else:
            return self._optimize_dropoff_trip(conductor_data, pasajeros_data, destination)
    
    def _optimize_pickup_trip(self, conductor_data: Dict, pasajeros_data: List[Dict], 
                            destination: str) -> Dict:
        """
        Optimiza el viaje de ida (recogida de pasajeros)
        """
        conductor_address = conductor_data["direccion_de_viaje"]
        passenger_addresses = [p["direccion_de_viaje"] for p in pasajeros_data]
        
        # Usar Google Maps para optimizar la ruta
        waypoint_order, legs = get_route_optimization(
            conductor_address, 
            passenger_addresses, 
            self.api_key
        )
        
        # Si la optimización falla, usar orden secuencial
        if not waypoint_order:
            waypoint_order = list(range(len(pasajeros_data)))
        
        # Construir el orden optimizado
        optimized_order = []
        current_address = conductor_address
        cumulative_distance = 0
        cumulative_duration = 0
        
        # Agregar conductor como punto de inicio
        optimized_order.append({
            "step": 0,
            "type": "conductor",
            "correo": conductor_data["correo"],
            "direccion": conductor_address,
            "nombre": conductor_data.get("nombre", "Conductor"),
            "leg_distance_m": 0,
            "leg_duration_s": 0,
            "cumulative_distance_m": 0,
            "eta_from_start_s": 0,
            "eta_minutes": 0.0,
            "instruction": "Punto de inicio del conductor"
        })
        
        # Procesar pasajeros en orden optimizado
        for i, passenger_index in enumerate(waypoint_order):
            if passenger_index < len(pasajeros_data):
                passenger = pasajeros_data[passenger_index]
                
                # Calcular distancia y duración desde la ubicación actual
                distance, duration = get_distance_duration(
                    current_address, 
                    passenger["direccion_de_viaje"]
                )
                
                cumulative_distance += distance
                cumulative_duration += duration
                
                optimized_order.append({
                    "step": i + 1,
                    "type": "pickup",
                    "correo": passenger["correo"],
                    "direccion": passenger["direccion_de_viaje"],
                    "nombre": passenger.get("nombre", f"Pasajero {i + 1}"),
                    "leg_distance_m": distance,
                    "leg_duration_s": duration,
                    "cumulative_distance_m": cumulative_distance,
                    "eta_from_start_s": cumulative_duration,
                    "eta_minutes": round(cumulative_duration / 60, 2),
                    "instruction": f"Recoge al pasajero {i + 1}"
                })
                
                current_address = passenger["direccion_de_viaje"]
        
        # Agregar destino final
        final_distance, final_duration = get_distance_duration(current_address, destination)
        cumulative_distance += final_distance
        cumulative_duration += final_duration
        
        optimized_order.append({
            "step": len(optimized_order),
            "type": "destination",
            "correo": None,
            "direccion": destination,
            "nombre": "Universidad",
            "leg_distance_m": final_distance,
            "leg_duration_s": final_duration,
            "cumulative_distance_m": cumulative_distance,
            "eta_from_start_s": cumulative_duration,
            "eta_minutes": round(cumulative_duration / 60, 2),
            "instruction": "Dirígete hacia la Universidad"
        })
        
        return {
            "trip_type": "ida",
            "total_steps": len(optimized_order),
            "total_distance_m": cumulative_distance,
            "total_duration_s": cumulative_duration,
            "total_duration_minutes": round(cumulative_duration / 60, 2),
            "steps": optimized_order
        }
    
    def _optimize_dropoff_trip(self, conductor_data: Dict, pasajeros_data: List[Dict], 
                             destination: str) -> Dict:
        """
        Optimiza el viaje de regreso (entrega de pasajeros)
        """
        # Para el regreso, empezamos desde la universidad
        university_address = destination
        passenger_addresses = [p["direccion_de_viaje"] for p in pasajeros_data]
        
        # Usar Google Maps para optimizar la ruta de entrega
        waypoint_order, legs = get_route_optimization(
            university_address, 
            passenger_addresses, 
            self.api_key
        )
        
        # Si la optimización falla, usar orden secuencial
        if not waypoint_order:
            waypoint_order = list(range(len(pasajeros_data)))
        
        # Construir el orden optimizado
        optimized_order = []
        current_address = university_address
        cumulative_distance = 0
        cumulative_duration = 0
        
        # Agregar universidad como punto de inicio
        optimized_order.append({
            "step": 0,
            "type": "university",
            "correo": None,
            "direccion": university_address,
            "nombre": "Universidad",
            "leg_distance_m": 0,
            "leg_duration_s": 0,
            "cumulative_distance_m": 0,
            "eta_from_start_s": 0,
            "eta_minutes": 0.0,
            "instruction": "Salida desde la Universidad"
        })
        
        # Procesar pasajeros en orden optimizado
        for i, passenger_index in enumerate(waypoint_order):
            if passenger_index < len(pasajeros_data):
                passenger = pasajeros_data[passenger_index]
                
                # Calcular distancia y duración desde la ubicación actual
                distance, duration = get_distance_duration(
                    current_address, 
                    passenger["direccion_de_viaje"]
                )
                
                cumulative_distance += distance
                cumulative_duration += duration
                
                optimized_order.append({
                    "step": i + 1,
                    "type": "dropoff",
                    "correo": passenger["correo"],
                    "direccion": passenger["direccion_de_viaje"],
                    "nombre": passenger.get("nombre", f"Pasajero {i + 1}"),
                    "leg_distance_m": distance,
                    "leg_duration_s": duration,
                    "cumulative_distance_m": cumulative_distance,
                    "eta_from_start_s": cumulative_duration,
                    "eta_minutes": round(cumulative_duration / 60, 2),
                    "instruction": f"Deja al pasajero {i + 1} en la dirección {passenger['direccion_de_viaje']}"
                })
                
                current_address = passenger["direccion_de_viaje"]
        
        return {
            "trip_type": "regreso",
            "total_steps": len(optimized_order),
            "total_distance_m": cumulative_distance,
            "total_duration_s": cumulative_duration,
            "total_duration_minutes": round(cumulative_duration / 60, 2),
            "steps": optimized_order
        }

# ================================================
# 🔹 Procesamiento de un viaje individual
# ================================================
def process_trip_with_optimization(df_trip, output_dir="./out", trip_type="ida"):
    """
    Procesa un solo viaje con optimización de ruta y genera un archivo JSON con:
    - Orden óptimo de recogida/entrega
    - ETA para cada pasajero
    - Instrucciones para el conductor
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    trip_id = str(df_trip["trip_id"].iloc[0])
    start_time = datetime.now(timezone.utc).isoformat()

    # 🚗 Identificar conductor y pasajeros
    conductor = df_trip[df_trip["tipo_de_usuario"] == "conductor"].iloc[0].to_dict()
    pasajeros = df_trip[df_trip["tipo_de_usuario"] == "pasajero"].to_dict(orient="records")

    # Obtener destino del viaje (asumiendo que está en el conductor)
    destination = conductor.get("destino", "Universidad")
    
    # Crear optimizador
    optimizer = PickupOptimizer()
    
    # Calcular orden óptimo
    optimized_route = optimizer.calculate_optimal_pickup_order(
        conductor, 
        pasajeros, 
        destination, 
        trip_type
    )

    result = {
        "trip_id": trip_id,
        "trip_type": trip_type,
        "start_time": start_time,
        "conductor": {
            "correo": conductor["correo"],
            "nombre": conductor.get("nombre", "Conductor"),
            "direccion": conductor["direccion_de_viaje"]
        },
        "destination": destination,
        "optimized_route": optimized_route
    }

    # Guardar JSON
    output_file = os.path.join(output_dir, f"optimized_route_{trip_id}_{trip_type}.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)

    print(f"✅ Archivo creado: {output_file}")
    return result

# ================================================
# 🔹 API Endpoint para obtener datos del viaje
# ================================================
def get_trip_data_for_driver(trip_id: str, trip_type: str = "ida") -> Optional[Dict]:
    """
    Obtiene los datos optimizados de un viaje específico para mostrar en la interfaz del conductor
    """
    try:
        # Obtener datos de la base de datos
        profiles_df, vehicles_df, searching_pool_df, trip_requests_df, confirmed_trips_df, start_of_trip_df, _ = get_wheels_dataframes()
        
        # Filtrar por trip_id
        trip_data = start_of_trip_df[start_of_trip_df["trip_id"] == int(trip_id)]
        
        if trip_data.empty:
            return None
        
        # Procesar el viaje
        result = process_trip_with_optimization(trip_data, trip_type=trip_type)
        
        return result
        
    except Exception as e:
        print(f"❌ Error al obtener datos del viaje {trip_id}: {e}")
        return None

# ================================================
# 🔹 Procesar todos los viajes
# ================================================
def process_all_trips(start_of_trip_df, output_dir="./out", trip_type="ida"):
    """
    Procesa todos los viajes en el DataFrame (agrupados por trip_id).
    Retorna un diccionario con los resultados de cada viaje.
    """
    resultados = {}
    for trip_id, df_trip in start_of_trip_df.groupby("trip_id"):
        print(f"\n🔹 Procesando viaje {trip_id} ({trip_type})...")
        resultados[trip_id] = process_trip_with_optimization(df_trip, output_dir, trip_type)
    return resultados

# ================================================
# 📌 EJEMPLO DE USO
# ================================================
if __name__ == "__main__":
    profiles_df, vehicles_df, searching_pool_df, trip_requests_df, confirmed_trips_df, start_of_trip_df, start_of_trip_response = get_wheels_dataframes()
    
    # Procesar TODOS los viajes en start_of_trip (ida)
    print("🚀 Procesando viajes de IDA...")
    resultados_ida = process_all_trips(start_of_trip_df, trip_type="ida")
    
    # Procesar TODOS los viajes en start_of_trip (regreso)
    print("\n🚀 Procesando viajes de REGRESO...")
    resultados_regreso = process_all_trips(start_of_trip_df, trip_type="regreso")
    
    # Mostrar resultados en pantalla
    print("\n📊 RESULTADOS VIAJES DE IDA:")
    print(json.dumps(resultados_ida, indent=4, ensure_ascii=False))
    
    print("\n📊 RESULTADOS VIAJES DE REGRESO:")
    print(json.dumps(resultados_regreso, indent=4, ensure_ascii=False))
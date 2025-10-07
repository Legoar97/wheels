import os
import json
import requests
import pandas as pd
from datetime import datetime, timezone
from supabase import create_client, Client
from typing import Dict, List, Tuple, Optional

# ================================================
# 🔹 Conexión a Supabase
# ================================================
def get_wheels_dataframes():
    url = os.getenv("SUPABASE_URL", "https://ozvjmkvmpxxviveniuwt.supabase.co")
    key = os.getenv("SUPABASE_KEY", "your-supabase-key")
    
    supabase: Client = create_client(url, key)
    
    profiles_response = supabase.table('profiles').select("*").execute()
    vehicles_response = supabase.table('vehicles').select("*").execute()
    searching_pool_response = supabase.table('searching_pool').select("*").execute()
    trip_requests_response = supabase.table('trip_requests').select("*").execute()
    confirmed_trips_response = supabase.table('confirmed_trips').select("*").execute()
    start_of_trip_response = supabase.table('start_of_trip').select("*").execute()
    
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
# 🔹 Google Maps API
# ================================================
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "your-google-maps-api-key")

def get_distance_duration(origin, destination, api_key=GOOGLE_MAPS_API_KEY):
    """Calcula distancia y duración entre dos puntos"""
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": origin,
        "destinations": destination,
        "key": api_key,
        "mode": "driving",
        "departure_time": "now"
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

def get_distance_matrix(origins: List[str], destinations: List[str], api_key=GOOGLE_MAPS_API_KEY):
    """Obtiene matriz de distancias entre múltiples puntos"""
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    
    origins_str = "|".join(origins)
    destinations_str = "|".join(destinations)
    
    params = {
        "origins": origins_str,
        "destinations": destinations_str,
        "key": api_key,
        "mode": "driving",
        "departure_time": "now"
    }
    
    response = requests.get(url, params=params).json()
    
    if response["status"] != "OK":
        print(f"❌ Error en Distance Matrix API: {response['status']}")
        return None
    
    matrix = {
        'distances': [],
        'durations': []
    }
    
    for row in response["rows"]:
        distance_row = []
        duration_row = []
        
        for element in row["elements"]:
            if element["status"] == "OK":
                distance_row.append(element["distance"]["value"])
                duration_row.append(element["duration"]["value"])
            else:
                distance_row.append(float('inf'))
                duration_row.append(float('inf'))
        
        matrix['distances'].append(distance_row)
        matrix['durations'].append(duration_row)
    
    return matrix

# ================================================
# 🔹 Algoritmo de Ruta Escolar
# ================================================
def school_route_algorithm(start_address: str, waypoint_addresses: List[str], 
                          destination_address: str, trip_type: str, api_key=GOOGLE_MAPS_API_KEY):
    """
    Algoritmo de ruta escolar optimizado:
    
    IDA (a la universidad):
    - Recoger primero a los MÁS LEJOS de la universidad
    - Así van llegando más pasajeros mientras nos acercamos
    
    REGRESO (desde la universidad):
    - Dejar primero a los MÁS CERCA de la universidad
    - El conductor termina más cerca de su casa
    """
    
    if not waypoint_addresses:
        return [], []
    
    print(f"🚌 Calculando ruta escolar ({trip_type})...")
    
    # Lista completa de direcciones
    all_addresses = [start_address] + waypoint_addresses + [destination_address]
    
    # Obtener matriz de distancias
    print("📊 Obteniendo matriz de distancias...")
    matrix = get_distance_matrix(all_addresses, all_addresses, api_key)
    
    if not matrix:
        print("❌ Error obteniendo matriz, usando orden secuencial")
        return list(range(len(waypoint_addresses))), []
    
    durations = matrix['durations']
    distances = matrix['distances']
    
    # Índice del destino (universidad)
    destination_idx = len(all_addresses) - 1
    
    # Calcular distancia de cada pasajero al destino
    passengers_with_distance = []
    
    print(f"\n📍 Distancias {'desde' if trip_type == 'regreso' else 'hacia'} el destino:")
    for i in range(len(waypoint_addresses)):
        waypoint_global_idx = i + 1
        
        if trip_type == "ida":
            # IDA: distancia desde pasajero a destino
            distance_to_dest = durations[waypoint_global_idx][destination_idx]
        else:
            # REGRESO: distancia desde destino (universidad) a pasajero
            distance_to_dest = durations[destination_idx][waypoint_global_idx]
        
        passengers_with_distance.append({
            'index': i,
            'distance_to_destination': distance_to_dest
        })
        
        print(f"   Pasajero {i+1}: {distance_to_dest/60:.1f} min")
    
    # ORDENAR según el tipo de viaje
    if trip_type == "ida":
        # IDA: MÁS LEJOS primero (descendente)
        passengers_with_distance.sort(key=lambda x: -x['distance_to_destination'])
        print("\n🔍 Orden IDA: Recogiendo del MÁS LEJOS al más cerca")
    else:
        # REGRESO: MÁS CERCA primero (ascendente)
        passengers_with_distance.sort(key=lambda x: x['distance_to_destination'])
        print("\n🔍 Orden REGRESO: Dejando del MÁS CERCA al más lejos")
    
    # Extraer el orden optimizado
    route_order = [p['index'] for p in passengers_with_distance]
    
    # Mostrar el orden
    for i, p in enumerate(passengers_with_distance):
        print(f"  {i+1}. Pasajero {p['index']+1} ({p['distance_to_destination']/60:.1f} min)")
    
    # Construir información de legs
    legs = []
    prev_idx = 0  # Empezamos desde el conductor
    
    for waypoint_idx in route_order:
        global_idx = waypoint_idx + 1
        legs.append({
            'distance_m': distances[prev_idx][global_idx],
            'duration_s': durations[prev_idx][global_idx],
            'from_address': all_addresses[prev_idx],
            'to_address': all_addresses[global_idx]
        })
        prev_idx = global_idx
    
    # Leg final al destino
    legs.append({
        'distance_m': distances[prev_idx][destination_idx],
        'duration_s': durations[prev_idx][destination_idx],
        'from_address': all_addresses[prev_idx],
        'to_address': all_addresses[destination_idx]
    })
    
    total_duration = sum(leg['duration_s'] for leg in legs)
    total_distance = sum(leg['distance_m'] for leg in legs)
    
    print(f"\n✅ Ruta optimizada: {[x+1 for x in route_order]}")
    print(f"   📏 Distancia total: {total_distance/1000:.2f} km")
    print(f"   ⏱️  Duración total: {total_duration / 60:.1f} min")
    
    return route_order, legs

# ================================================
# 🔹 Clase PickupOptimizer
# ================================================
class PickupOptimizer:
    def __init__(self, api_key=GOOGLE_MAPS_API_KEY):
        self.api_key = api_key
        
    def calculate_optimal_pickup_order(self, conductor_data: Dict, pasajeros_data: List[Dict], 
                                     destination: str, trip_type: str = "ida") -> Dict:
        """Calcula el orden óptimo de recogida"""
        if trip_type == "ida":
            return self._optimize_pickup_trip(conductor_data, pasajeros_data, destination)
        else:
            return self._optimize_dropoff_trip(conductor_data, pasajeros_data, destination)
    
    def _optimize_pickup_trip(self, conductor_data: Dict, pasajeros_data: List[Dict], 
                            destination: str) -> Dict:
        """Optimiza el viaje de IDA (recogida)"""
        conductor_address = conductor_data["direccion_de_viaje"]
        passenger_addresses = [p["direccion_de_viaje"] for p in pasajeros_data]
        
        print("\n" + "="*60)
        print("🚗 OPTIMIZANDO RUTA DE IDA (Recogida)")
        print("="*60)
        
        # Usar algoritmo de ruta escolar
        waypoint_order, legs = school_route_algorithm(
            conductor_address, 
            passenger_addresses, 
            destination,
            "ida",
            self.api_key
        )
        
        if not waypoint_order:
            print("⚠️ Usando orden secuencial como fallback")
            waypoint_order = list(range(len(pasajeros_data)))
            legs = []
        
        # Construir orden optimizado con detalles
        optimized_order = []
        cumulative_distance = 0
        cumulative_duration = 0
        
        # Paso 0: Conductor
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
        
        # Pasajeros en orden optimizado
        for i, passenger_index in enumerate(waypoint_order):
            if passenger_index < len(pasajeros_data):
                passenger = pasajeros_data[passenger_index]
                
                if i < len(legs):
                    leg = legs[i]
                    distance = leg['distance_m']
                    duration = leg['duration_s']
                else:
                    current_address = optimized_order[-1]["direccion"]
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
                    "instruction": f"Recoge al pasajero: {passenger.get('nombre', 'Pasajero')}",
                    "optimized_order": i + 1,
                    "original_index": passenger_index
                })
        
        # Destino final
        if len(legs) > len(waypoint_order):
            final_leg = legs[-1]
            final_distance = final_leg['distance_m']
            final_duration = final_leg['duration_s']
        else:
            current_address = optimized_order[-1]["direccion"]
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
            "instruction": "Llegar a la Universidad"
        })
        
        print(f"\n✅ Orden final: {[x+1 for x in waypoint_order]}")
        print("="*60 + "\n")
        
        return {
            "trip_type": "ida",
            "optimization_method": "school_route_farthest_first",
            "total_steps": len(optimized_order),
            "total_distance_m": cumulative_distance,
            "total_duration_s": cumulative_duration,
            "total_duration_minutes": round(cumulative_duration / 60, 2),
            "steps": optimized_order
        }
    
    def _optimize_dropoff_trip(self, conductor_data: Dict, pasajeros_data: List[Dict], 
                             destination: str) -> Dict:
        """Optimiza el viaje de REGRESO (entrega)"""
        university_address = destination
        passenger_addresses = [p["direccion_de_viaje"] for p in pasajeros_data]
        conductor_home = conductor_data["direccion_de_viaje"]
        
        print("\n" + "="*60)
        print("🏠 OPTIMIZANDO RUTA DE REGRESO (Entrega)")
        print("="*60)
        
        # Usar algoritmo de ruta escolar
        waypoint_order, legs = school_route_algorithm(
            university_address,
            passenger_addresses,
            conductor_home,
            "regreso",
            self.api_key
        )
        
        if not waypoint_order:
            print("⚠️ Usando orden secuencial como fallback")
            waypoint_order = list(range(len(pasajeros_data)))
            legs = []
        
        # Construir orden optimizado
        optimized_order = []
        cumulative_distance = 0
        cumulative_duration = 0
        
        # Paso 0: Universidad
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
        
        # Pasajeros en orden optimizado
        for i, passenger_index in enumerate(waypoint_order):
            if passenger_index < len(pasajeros_data):
                passenger = pasajeros_data[passenger_index]
                
                if i < len(legs):
                    leg = legs[i]
                    distance = leg['distance_m']
                    duration = leg['duration_s']
                else:
                    current_address = optimized_order[-1]["direccion"]
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
                    "instruction": f"Deja al pasajero: {passenger.get('nombre', 'Pasajero')}",
                    "optimized_order": i + 1,
                    "original_index": passenger_index
                })
        
        print(f"\n✅ Orden final: {[x+1 for x in waypoint_order]}")
        print("="*60 + "\n")
        
        return {
            "trip_type": "regreso",
            "optimization_method": "school_route_closest_first",
            "total_steps": len(optimized_order),
            "total_distance_m": cumulative_distance,
            "total_duration_s": cumulative_duration,
            "total_duration_minutes": round(cumulative_duration / 60, 2),
            "steps": optimized_order
        }

# ================================================
# 🔹 Procesamiento
# ================================================
def process_trip_with_optimization(df_trip, output_dir="./out", trip_type="ida"):
    """Procesa un viaje con optimización"""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    trip_id = str(df_trip["trip_id"].iloc[0])
    start_time = datetime.now(timezone.utc).isoformat()

    conductor = df_trip[df_trip["tipo_de_usuario"] == "conductor"].iloc[0].to_dict()
    pasajeros = df_trip[df_trip["tipo_de_usuario"] == "pasajero"].to_dict(orient="records")

    destination = conductor.get("destino", "Universidad")
    
    optimizer = PickupOptimizer()
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

    output_file = os.path.join(output_dir, f"optimized_route_{trip_id}_{trip_type}.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)

    print(f"✅ Archivo creado: {output_file}")
    return result

def get_trip_data_for_driver(trip_id: str, trip_type: str = "ida") -> Optional[Dict]:
    """API endpoint"""
    try:
        profiles_df, vehicles_df, searching_pool_df, trip_requests_df, confirmed_trips_df, start_of_trip_df, _ = get_wheels_dataframes()
        
        trip_data = start_of_trip_df[start_of_trip_df["trip_id"] == int(trip_id)]
        
        if trip_data.empty:
            return None
        
        result = process_trip_with_optimization(trip_data, trip_type=trip_type)
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def process_all_trips(start_of_trip_df, output_dir="./out", trip_type="ida"):
    """Procesa todos los viajes"""
    resultados = {}
    for trip_id, df_trip in start_of_trip_df.groupby("trip_id"):
        print(f"\n🔹 Procesando viaje {trip_id} ({trip_type})...")
        resultados[trip_id] = process_trip_with_optimization(df_trip, output_dir, trip_type)
    return resultados

# ================================================
# 📌 MAIN
# ================================================
if __name__ == "__main__":
    profiles_df, vehicles_df, searching_pool_df, trip_requests_df, confirmed_trips_df, start_of_trip_df, start_of_trip_response = get_wheels_dataframes()
    
    print("🚌 Algoritmo de Ruta Escolar")
    print("IDA: Recoger del MÁS LEJOS al más cerca")
    print("REGRESO: Dejar del MÁS CERCA al más lejos\n")
    
    resultados_ida = process_all_trips(start_of_trip_df, trip_type="ida")
    resultados_regreso = process_all_trips(start_of_trip_df, trip_type="regreso")
    
    print("\n📊 COMPLETADO")
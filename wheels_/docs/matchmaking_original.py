import pandas as pd 
from supabase import create_client, Client
from geopy.distance import geodesic
import json

# =====================
# Conexión a Supabase
# =====================
def get_wheels_dataframes():
    # Usar las mismas credenciales que tu proyecto
    url = "https://ozvjmkvmpxxviveniuwt.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dmpta3ZtcHh4dml2ZW5pdXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzYzMjQsImV4cCI6MjA3MjAxMjMyNH0.1bk9TEf-K14xQ2i-Wq5xD8ejZeGZ7t5VhXzxFOuBhbA"
    
    # Crear cliente
    supabase: Client = create_client(url, key)
    
    # Traer las tablas principales
    profiles_response = supabase.table('profiles').select("*").execute()
    vehicles_response = supabase.table('vehicles').select("*").execute()
    searching_pool_response = supabase.table('searching_pool').select("*").execute()
    trip_requests_response = supabase.table('trip_requests').select("*").execute()
    confirmed_trips_response = supabase.table('confirmed_trips').select("*").execute()
    
    # Convertir a DataFrames
    profiles_df = pd.DataFrame(profiles_response.data)
    vehicles_df = pd.DataFrame(vehicles_response.data)
    searching_pool_df = pd.DataFrame(searching_pool_response.data)
    trip_requests_df = pd.DataFrame(trip_requests_response.data)
    confirmed_trips_df = pd.DataFrame(confirmed_trips_response.data)
    
    return profiles_df, vehicles_df, searching_pool_df, trip_requests_df, confirmed_trips_df


# =====================
# Función de emparejamiento
# =====================
def match_rides(searching_pool_df, max_distance_km=5):
    # Separar conductores y pasajeros
    drivers = searching_pool_df[searching_pool_df["tipo_de_usuario"] == "conductor"].copy()
    passengers = searching_pool_df[searching_pool_df["tipo_de_usuario"] == "pasajero"].copy()

    matches = []

    for _, driver in drivers.iterrows():
        driver_location = (driver["pickup_lat"], driver["pickup_lng"])
        destino_driver = driver["destino"]
        available_seats = driver.get("available_seats", 1)

        matched_passengers = []

        for _, passenger in passengers.iterrows():
            passenger_location = (passenger["pickup_lat"], passenger["pickup_lng"])

            # 1. Verificar destino
            if passenger["destino"] != destino_driver:
                continue

            # 2. Calcular distancia entre pickups
            distance_km = geodesic(driver_location, passenger_location).km
            if distance_km > max_distance_km:
                continue

            # 3. Verificar cupos disponibles
            if len(matched_passengers) < available_seats:
                matched_passengers.append({
                    "pasajero_id": passenger["id"],
                    "nombre": passenger["nombre_usuario"],
                    "correo": passenger["correo_usuario"],   # 👈 Agregado
                    "pickup": passenger["pickup_address"],
                    "destino": passenger["destino"]
                })

        if matched_passengers:
            matches.append({
                "conductor_id": driver["id"],
                "nombre_conductor": driver["nombre_usuario"],
                "correo_conductor": driver["correo_usuario"],  # 👈 Agregado
                "pickup": driver["pickup_address"],
                "destino": destino_driver,
                "pasajeros_asignados": matched_passengers
            })

    return matches


# =====================
# Ejemplo de uso
# =====================
if __name__ == "__main__":
    profiles_df, vehicles_df, searching_pool_df, trip_requests_df, confirmed_trips_df = get_wheels_dataframes()
    result = match_rides(searching_pool_df)
    print(json.dumps(result, indent=2, ensure_ascii=False))







































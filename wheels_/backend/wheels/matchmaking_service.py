import pandas as pd
from supabase import create_client
import os
from geopy.distance import geodesic

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ozvjmkvmpxxviveniuwt.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-key")

def get_wheels_dataframes():
    """
    Obtiene los DataFrames principales del sistema
    
    Returns:
        tuple: DataFrames (profiles_df, searching_pool_df)
    """
    try:
        # Inicializar cliente Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Consultar tablas
        profiles_response = supabase.table('profiles').select("*").execute()
        searching_pool_response = supabase.table('searching_pool').select("*").execute()
        
        # Convertir a DataFrames
        profiles_df = pd.DataFrame(profiles_response.data)
        searching_pool_df = pd.DataFrame(searching_pool_response.data)
        
        return profiles_df, searching_pool_df
    
    except Exception as e:
        print(f"Error al obtener datos: {str(e)}")
        return pd.DataFrame(), pd.DataFrame()

def calculate_distance(origin, destination):
    """
    Calcula la distancia entre dos puntos usando geodesic
    
    Args:
        origin (tuple): (lat, lng) del origen
        destination (tuple): (lat, lng) del destino
        
    Returns:
        float: Distancia en kilómetros
    """
    try:
        return geodesic(origin, destination).kilometers
    except:
        return float('inf')

def get_passenger_name(passenger, profiles_df):
    """
    Obtiene el nombre de un pasajero desde el DataFrame de perfiles
    
    Args:
        passenger (dict): Datos del pasajero
        profiles_df (DataFrame): DataFrame con perfiles
        
    Returns:
        str: Nombre del pasajero o 'Pasajero desconocido'
    """
    if "correo_usuario" not in passenger:
        return "Pasajero desconocido"
        
    email = passenger["correo_usuario"]
    matching_profiles = profiles_df[profiles_df["email"] == email]
    
    if not matching_profiles.empty:
        return matching_profiles.iloc[0].get("full_name", "Pasajero desconocido")
    
    return "Pasajero desconocido"

def get_driver_name(driver, profiles_df):
    """
    Obtiene el nombre de un conductor desde el DataFrame de perfiles
    
    Args:
        driver (dict): Datos del conductor
        profiles_df (DataFrame): DataFrame con perfiles
        
    Returns:
        str: Nombre del conductor o 'Conductor desconocido'
    """
    if "correo_usuario" not in driver:
        return "Conductor desconocido"
        
    email = driver["correo_usuario"]
    matching_profiles = profiles_df[profiles_df["email"] == email]
    
    if not matching_profiles.empty:
        return matching_profiles.iloc[0].get("full_name", "Conductor desconocido")
    
    return "Conductor desconocido"

def match_rides_enhanced(searching_pool_df, profiles_df, max_distance_km=5):
    """
    Algoritmo de emparejamiento mejorado que utiliza email como identificador
    
    Args:
        searching_pool_df (DataFrame): DataFrame con datos del pool de búsqueda
        profiles_df (DataFrame): DataFrame con datos de perfiles
        max_distance_km (float): Distancia máxima para emparejar
        
    Returns:
        list: Lista de emparejamientos encontrados
    """
    # Filtrar registros activos
    active_pool = searching_pool_df[
        (searching_pool_df["status"] == "searching") |
        (searching_pool_df["status"].isna())
    ].copy()
    
    # Separar conductores y pasajeros
    drivers = active_pool[active_pool["tipo_de_usuario"] == "conductor"]
    passengers = active_pool[active_pool["tipo_de_usuario"] == "pasajero"]
    
    matches = []
    
    for _, driver in drivers.iterrows():
        driver_location = (driver["pickup_lat"], driver["pickup_lng"])
        driver_destination = driver["dropoff_address"]
        available_seats = int(driver.get("available_seats", 1))
        
        matched_passengers = []
        
        for _, passenger in passengers.iterrows():
            # Verificar compatibilidad de destino
            if passenger["dropoff_address"] != driver_destination:
                continue
                
            # Calcular distancia usando geodesic
            passenger_location = (passenger["pickup_lat"], passenger["pickup_lng"])
            distance_km = calculate_distance(driver_location, passenger_location)
            
            if distance_km > max_distance_km:
                continue
                
            # Verificar cupos disponibles
            if len(matched_passengers) < available_seats:
                matched_passengers.append({
                    "pasajero_correo": passenger.get("correo_usuario"),
                    "nombre": get_passenger_name(passenger, profiles_df),
                    "pickup": passenger["pickup_address"],
                    "destino": passenger["dropoff_address"],
                    "distance_km": round(distance_km, 2),
                    "duration": f"{round(distance_km * 2)} min"  # Estimación simple
                })
        
        if matched_passengers:
            matches.append({
                "conductor_correo": driver.get("correo_usuario"),
                "nombre_conductor": get_driver_name(driver, profiles_df),
                "pickup": driver["pickup_address"],
                "destino": driver_destination,
                "available_seats": available_seats,
                "price_per_seat": float(driver.get("price_per_seat", 0)),
                "pasajeros_asignados": matched_passengers
            })
    
    return matches















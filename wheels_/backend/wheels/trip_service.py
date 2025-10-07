from supabase import create_client
import os
from datetime import datetime

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ozvjmkvmpxxviveniuwt.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-key")

def create_trip(driver_email, trip_data):
    """
    Crea un nuevo viaje en la base de datos
    
    Args:
        driver_email (str): Email del conductor
        trip_data (dict): Datos del viaje
        
    Returns:
        dict: Resultado de la operación
    """
    try:
        # Inicializar cliente Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Obtener perfil del conductor
        driver_profile = supabase.table("profiles").select("*").eq("email", driver_email).execute()
        
        if not driver_profile.data:
            return {
                "success": False,
                "error": "Perfil de conductor no encontrado"
            }
        
        driver_id = driver_profile.data[0]["id"]
        
        # Datos para insertar en searching_pool
        trip_insert_data = {
            "driver_id": driver_id,
            "tipo_de_usuario": "conductor",
            "pickup_address": trip_data["origin_address"],
            "dropoff_address": trip_data["destination_address"],
            "pickup_lat": trip_data["origin_lat"],
            "pickup_lng": trip_data["origin_lng"],
            "dropoff_lat": trip_data["destination_lat"],
            "dropoff_lng": trip_data["destination_lng"],
            "available_seats": trip_data["available_seats"],
            "trip_datetime": trip_data["departure_time"],
            "status": "searching",
            "created_at": datetime.now().isoformat()
        }
        
        # Insertar viaje en la tabla searching_pool
        response = supabase.table("searching_pool").insert(trip_insert_data).execute()
        
        if response.data:
            return {
                "success": True,
                "trip_id": response.data[0]["id"],
                "message": "Viaje creado exitosamente"
            }
        else:
            return {
                "success": False,
                "error": "Error al crear viaje"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Error al crear viaje: {str(e)}"
        }

def book_trip(trip_id, passenger_email, seats_requested=1):
    """
    Realiza una reserva en un viaje existente
    
    Args:
        trip_id (str): ID del viaje a reservar
        passenger_email (str): Email del pasajero
        seats_requested (int): Número de asientos solicitados
        
    Returns:
        dict: Resultado de la operación
    """
    try:
        # Inicializar cliente Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Verificar disponibilidad del viaje
        trip_data = supabase.table("searching_pool").select("*").eq("id", trip_id).execute()
        
        if not trip_data.data:
            return {
                "success": False,
                "error": "Viaje no encontrado"
            }
        
        trip = trip_data.data[0]
        
        # Verificar disponibilidad de asientos
        if trip["available_seats"] < seats_requested:
            return {
                "success": False,
                "error": f"No hay suficientes asientos disponibles. Solicitados: {seats_requested}, Disponibles: {trip['available_seats']}"
            }
        
        # Obtener perfil del pasajero
        passenger_profile = supabase.table("profiles").select("*").eq("email", passenger_email).execute()
        
        if not passenger_profile.data:
            return {
                "success": False,
                "error": "Perfil de pasajero no encontrado"
            }
        
        passenger_id = passenger_profile.data[0]["id"]
        
        # Insertar solicitud en trip_requests
        request_data = {
            "passenger_id": passenger_id,
            "driver_pool_id": trip_id,
            "pickup_address": trip["pickup_address"],
            "pickup_lat": trip["pickup_lat"],
            "pickup_lng": trip["pickup_lng"],
            "dropoff_address": trip["dropoff_address"],
            "dropoff_lat": trip["dropoff_lat"],
            "dropoff_lng": trip["dropoff_lng"],
            "seats_requested": seats_requested,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        
        response = supabase.table("trip_requests").insert(request_data).execute()
        
        if response.data:
            return {
                "success": True,
                "request_id": response.data[0]["id"],
                "message": "Solicitud de viaje enviada exitosamente"
            }
        else:
            return {
                "success": False,
                "error": "Error al enviar solicitud de viaje"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Error al reservar viaje: {str(e)}"
        }

def update_available_seats(trip_id, seats_change):
    """
    Actualiza la cantidad de asientos disponibles en un viaje
    
    Args:
        trip_id (str): ID del viaje
        seats_change (int): Cantidad de asientos a restar (positivo) o añadir (negativo)
        
    Returns:
        dict: Resultado de la operación
    """
    try:
        # Inicializar cliente Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Obtener datos actuales del viaje
        trip_data = supabase.table("searching_pool").select("available_seats").eq("id", trip_id).execute()
        
        if not trip_data.data:
            return {
                "success": False,
                "error": "Viaje no encontrado"
            }
        
        current_seats = trip_data.data[0]["available_seats"]
        new_seats = current_seats - seats_change
        
        # Verificar que no queden asientos negativos
        if new_seats < 0:
            return {
                "success": False,
                "error": "No hay suficientes asientos disponibles"
            }
        
        # Actualizar asientos
        response = supabase.table("searching_pool").update(
            {"available_seats": new_seats}
        ).eq("id", trip_id).execute()
        
        if response.data:
            return {
                "success": True,
                "available_seats": new_seats,
                "message": "Asientos actualizados exitosamente"
            }
        else:
            return {
                "success": False,
                "error": "Error al actualizar asientos"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Error al actualizar asientos: {str(e)}"
        }















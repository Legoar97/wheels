#!/usr/bin/env python3
"""
WHEELS API UNIFICADA
Combina matchmaking y optimización de rutas en un solo servicio
Puerto: 5000
"""

# ⚠️ IMPORTANTE: Cargar variables de entorno PRIMERO
from dotenv import load_dotenv
import os

# Cargar archivo .env desde el directorio backend
load_dotenv()

# Verificar que las claves se cargaron
print("🔍 Verificando variables de entorno:")
print(f"   SUPABASE_URL: {os.getenv('SUPABASE_URL', 'NO CONFIGURADA')}")
print(f"   SUPABASE_KEY: {'✅ CONFIGURADA' if os.getenv('SUPABASE_KEY') else '❌ NO CONFIGURADA'}")
print(f"   GOOGLE_MAPS_API_KEY: {'✅ CONFIGURADA' if os.getenv('GOOGLE_MAPS_API_KEY') else '❌ NO CONFIGURADA'}")
print()

# Ahora continúa con los otros imports
import json
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from supabase import create_client, Client
from geopy.distance import geodesic
import requests

# Importar el optimizador
from pickup_optimization_service import PickupOptimizer, get_trip_data_for_driver

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app setup
app = Flask(__name__)
CORS(app)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ozvjmkvmpxxviveniuwt.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-key")

def get_supabase_client():
    """Create and return Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def calculate_google_maps_distance(origin, destination, api_key=None):
    """Calcula distancia real usando Google Maps Distance Matrix API"""
    try:
        if not api_key:
            api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        
        if not api_key:
            logger.warning("⚠️ Google Maps API key no configurada, usando distancia espacial")
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
            logger.error(f"❌ Error en Google Maps API: {data['status']}")
            return calculate_haversine_distance(origin, destination)
        
        element = data['rows'][0]['elements'][0]
        if element['status'] != 'OK':
            logger.warning("⚠️ No se pudo calcular ruta, usando distancia espacial")
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
        logger.error(f"❌ Error al calcular distancia con Google Maps: {str(e)}")
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

def get_wheels_dataframes():
    """Fetch all necessary data from Supabase"""
    try:
        logger.info("🔌 Connecting to Supabase...")
        supabase = get_supabase_client()
        
        profiles_response = supabase.table('profiles').select("*").execute()
        searching_pool_response = supabase.table('searching_pool').select("*").execute()
        
        profiles_df = pd.DataFrame(profiles_response.data)
        searching_pool_df = pd.DataFrame(searching_pool_response.data)
        
        logger.info(f"✅ Loaded {len(profiles_df)} profiles, {len(searching_pool_df)} searching pool records")
        return profiles_df, searching_pool_df
        
    except Exception as e:
        logger.error(f"❌ Error fetching data: {str(e)}")
        raise

# wheels_api.py - Actualizar la función match_rides_enhanced

def match_rides_enhanced(searching_pool_df, profiles_df, max_distance_km=5):
    """Algoritmo de matchmaking mejorado que previene duplicados y simplifica la lógica de distancia."""
    try:
        logger.info(f"📊 Total registros en searching_pool: {len(searching_pool_df)}")
        
        # Filtro inicial para registros activos
        active_pool = searching_pool_df[
            (searching_pool_df["status"].isna()) |
            (searching_pool_df["status"] == "searching") |
            (searching_pool_df["status"] == "")
        ].copy()
        
        logger.info(f"📊 Registros activos después del filtro: {len(active_pool)}")
        
        if active_pool.empty:
            logger.warning("⚠️ No hay registros activos en searching pool")
            return []
        
        # --- INICIO DE LA CORRECCIÓN CLAVE #1: ELIMINAR DUPLICADOS ---
        # Limpiamos los datos ANTES de procesarlos para evitar bucles innecesarios.
        # Nos quedamos con la entrada más reciente para cada usuario único.
        active_pool.sort_values('created_at', ascending=False, inplace=True)
        drivers = active_pool[active_pool["tipo_de_usuario"] == "conductor"].drop_duplicates(subset=['correo_usuario']).copy()
        passengers = active_pool[active_pool["tipo_de_usuario"] == "pasajero"].drop_duplicates(subset=['correo_usuario']).copy()
        # --- FIN DE LA CORRECCIÓN CLAVE #1 ---

        logger.info(f"🔍 Found {len(drivers)} unique drivers and {len(passengers)} unique passengers after deduplication.")
        
        if len(drivers) == 0 or len(passengers) == 0:
            return []
        
        matches = []
        
        # Itera sobre los conductores únicos
        for _, driver in drivers.iterrows():
            try:
                if pd.isna(driver.get("pickup_lat")) or pd.isna(driver.get("pickup_lng")):
                    continue
                
                driver_location = (driver["pickup_lat"], driver["pickup_lng"])
                driver_destination = driver["destino"]
                available_seats = int(driver.get("available_seats", 1))
                driver_email = driver.get("correo_usuario")
                
                if not driver_email:
                    continue
                
                logger.info(f"🚗 Processing driver: {driver_email}")
                
                matched_passengers = []
                
                # Itera sobre los pasajeros únicos
                for _, passenger in passengers.iterrows():
                    try:
                        if pd.isna(passenger.get("pickup_lat")) or pd.isna(passenger.get("pickup_lng")):
                            continue
                        
                        passenger_email = passenger.get("correo_usuario")
                        passenger_destination = passenger.get("destino")
                        
                        # Comprobación de destinos (sin cambios)
                        destinations_match = False
                        if str(driver_destination).lower().strip() == str(passenger_destination).lower().strip():
                            destinations_match = True
                        elif "universidad" in str(driver_destination).lower() and "universidad" in str(passenger_destination).lower():
                            destinations_match = True
                        
                        if not destinations_match:
                            continue
                        
                        passenger_location = (passenger["pickup_lat"], passenger["pickup_lng"])
                        
                        # --- INICIO DE LA CORRECCIÓN CLAVE #2: CÁLCULO DE DISTANCIA ---
                        # Siempre calculamos la distancia desde el PUNTO DE PARTIDA del conductor al pasajero.
                        # Esto evita el error de "0.0km" de comparar un pasajero consigo mismo.
                        distance_result = calculate_google_maps_distance(driver_location, passenger_location)
                        # --- FIN DE LA CORRECCIÓN CLAVE #2 ---
                        
                        logger.info(f"   👤 Checking passenger: {passenger_email} -> Distance: {distance_result['distance']}km")

                        if distance_result['distance'] > max_distance_km:
                            logger.info(f"      ❌ Too far.")
                            continue
                        
                        if len(matched_passengers) >= available_seats:
                            logger.info(f"      ❌ No more seats.")
                            break
                        
                        passenger_name = passenger.get("nombre_usuario", "Pasajero")
                        
                        matched_passengers.append({
                            "pasajero_correo": passenger_email,
                            "nombre": passenger_name,
                            "correo": passenger_email,
                            "pickup": passenger["pickup_address"],
                            "destino": passenger["destino"],
                            "distance_km": distance_result['distance'],
                            "duration": distance_result['duration'],
                            "distance_source": distance_result['source'],
                            "pickup_address": passenger["pickup_address"],
                            "dropoff_address": passenger["destino"],
                        })
                        
                        logger.info(f"      ✅ Matched passenger: {passenger_email}")
                        
                    except Exception as e:
                        logger.error(f"❌ Error processing inner passenger loop: {e}")
                        continue
                
                if matched_passengers:
                    driver_name = driver.get("nombre_usuario", "Conductor")
                    
                    matches.append({
                        "conductor_correo": driver_email,
                        "conductor_id": driver["id"],
                        "nombre_conductor": driver_name,
                        "correo_conductor": driver_email,
                        "pickup": driver["pickup_address"],
                        "destino": driver_destination,
                        "available_seats": available_seats,
                        "price_per_seat": float(driver.get("price_per_seat", 0)),
                        "driver_pool_id": driver["id"],
                        "pasajeros_asignados": matched_passengers
                    })
                    
                    logger.info(f"🎯 Match created for driver {driver_email} with {len(matched_passengers)} passengers")
                
            except Exception as e:
                logger.error(f"❌ Error processing outer driver loop: {e}")
                continue
        
        logger.info(f"🎉 Total unique matches created: {len(matches)}")
        return matches
        
    except Exception as e:
        logger.error(f"❌ FATAL Error in matching algorithm: {str(e)}")
        import traceback
        traceback.print_exc()
        return []
# ============================================================================
# 🔹 ENDPOINTS - MATCHMAKING
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        supabase = get_supabase_client()
        supabase.table('profiles').select("id").limit(1).execute()
        
        return jsonify({
            "success": True,
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "supabase": "connected",
                "google_maps": "available" if os.getenv('GOOGLE_MAPS_API_KEY') else "not_configured",
                "matchmaking": "enabled",
                "route_optimization": "enabled",
                "trip_management": "enabled"
            }
        })
    except Exception as e:
        logger.error(f"❌ Health check failed: {str(e)}")
        return jsonify({
            "success": False,
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/python-matchmaking', methods=['POST', 'GET'])
def run_matchmaking():
    """Main matchmaking endpoint"""
    try:
        logger.info("🚀 Starting matchmaking process...")
        
        profiles_df, searching_pool_df = get_wheels_dataframes()
        
        if searching_pool_df.empty:
            return jsonify({
                "success": True,
                "matches": [],
                "total_matches": 0,
                "message": "No records in searching pool",
                "timestamp": datetime.now().isoformat()
            })
        
        matches = match_rides_enhanced(searching_pool_df, profiles_df)
        
        response = {
            "success": True,
            "matches": matches,
            "total_matches": len(matches),
            "timestamp": datetime.now().isoformat(),
            "message": f"Matchmaking completed. Found {len(matches)} matches."
        }
        
        logger.info(f"✅ Matchmaking completed: {len(matches)} matches found")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"❌ Error in matchmaking API: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "matches": [],
            "total_matches": 0,
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/matches/<user_email>', methods=['GET'])
def get_user_matches(user_email):
    """Get matches for a specific user"""
    try:
        logger.info(f"🔍 Getting matches for user: {user_email}")
        
        profiles_df, searching_pool_df = get_wheels_dataframes()
        all_matches = match_rides_enhanced(searching_pool_df, profiles_df)
        
        user_matches = []
        
        for match in all_matches:
            if match["correo_conductor"] == user_email:
                user_matches.append({"role": "driver", "match": match})
            
            for passenger in match["pasajeros_asignados"]:
                if passenger["correo"] == user_email:
                    user_matches.append({
                        "role": "passenger",
                        "match": match,
                        "passenger_details": passenger
                    })
        
        return jsonify({
            "success": True,
            "user_email": user_email,
            "matches": user_matches,
            "total_matches": len(user_matches),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting user matches: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/passenger-trip/<user_email>', methods=['GET'])
def get_passenger_trip(user_email):
    """Get the active trip for a specific passenger (VERSIÓN CORREGIDA Y ROBUSTA)"""
    try:
        logger.info(f"🔍 Getting active trip for passenger: {user_email}")
        supabase = get_supabase_client()

        # 1. Encuentra el ID de perfil del pasajero
        profile_response = supabase.table('profiles').select("id").eq("email", user_email).execute()
        if not profile_response.data:
            logger.warning(f"⚠️ No se encontró el perfil para el pasajero: {user_email}")
            return jsonify({"success": False, "error": "Pasajero no encontrado"}), 404
        passenger_id = profile_response.data[0]['id']
        logger.info(f"📄 ID de perfil del pasajero: {passenger_id} para el email: {user_email}")

        # 2. Busca todos los viajes en estado 'in_progress'
        trip_data_response = supabase.table('trip_data').select("*").eq("status", "in_progress").execute()

        if not trip_data_response.data:
            logger.info("ℹ️ No hay viajes en curso en la tabla 'trip_data'.")
            return jsonify({"success": False, "message": "No hay viaje activo para el pasajero"}), 404

        passenger_trip = None
        passenger_details = None
        
        # 3. Itera sobre los viajes y busca al pasajero en la lista 'passengers_data'
        for trip in trip_data_response.data:
            passengers_data = trip.get('passengers_data', [])
            
            # --- INICIO DE LA CORRECCIÓN CLAVE ---
            for p in passengers_data:
                found_in_trip = False
                # Caso ideal: 'p' es un diccionario con los detalles del pasajero
                if isinstance(p, dict):
                    # Comprobamos por passenger_id (UUID) o por passenger_email
                    if p.get('passenger_id') == str(passenger_id) or p.get('passenger_email') == user_email:
                        passenger_trip = trip
                        passenger_details = p # Guardamos los detalles completos del pasajero
                        found_in_trip = True
                # Caso problemático: 'p' es un string (dato malformado)
                elif isinstance(p, str):
                    if p == user_email:
                        logger.warning(f"⚠️ Entrada de pasajero malformada (string) encontrada en trip_data para {user_email}. ID de Viaje: {trip.get('id')}. Solo se recuperó el email.")
                        passenger_trip = trip
                        # Creamos detalles mínimos para evitar errores en el frontend si solo hay un string
                        passenger_details = {"passenger_email": user_email, "passenger_id": str(passenger_id), "nombre": user_email.split('@')[0]}
                        found_in_trip = True
                
                if found_in_trip:
                    break # Pasajero encontrado en este viaje, pasamos al siguiente viaje si es necesario
            # --- FIN DE LA CORRECCIÓN CLAVE ---

            if passenger_trip:
                break # Viaje encontrado para este pasajero, no necesitamos revisar más viajes

        if not passenger_trip:
            logger.info(f"ℹ️ No se encontró ningún viaje activo en los resultados filtrados para el pasajero: {user_email}")
            return jsonify({"success": False, "message": "No hay viaje activo para el pasajero"}), 404

        logger.info(f"✅ Viaje activo encontrado para el pasajero {user_email}. ID de Viaje: {passenger_trip.get('id')}")

        # Retorna los datos del viaje formateados
        return jsonify({
            "success": True,
            "trip": {
                "trip_id": passenger_trip.get('id'), # Usamos .get() para seguridad
                "driver_id": passenger_trip.get('driver_id'),
                "pickup_address": passenger_trip.get('pickup_address'),
                "dropoff_address": passenger_trip.get('dropoff_address'),
                "passenger": passenger_details, # Esto ahora contendrá los detalles (dict o el mínimo si era string)
                "status": passenger_trip.get('status')
            }
        })

    except Exception as e:
        logger.error(f"❌ Error obteniendo viaje del pasajero {user_email}: {str(e)}")
        import traceback
        traceback.print_exc() # Imprime el traceback completo para depuración en el servidor
        return jsonify({"success": False, "error": "Error interno del servidor"}), 500

@app.route('/api/user-active-state/<user_email>', methods=['GET'])
def get_user_active_state(user_email):
    """Get user's active state"""
    try:
        logger.info(f"🔍 Checking active state for user: {user_email}")
        supabase = get_supabase_client()

        # Check for active trip
        start_trip_response = supabase.table('start_of_trip').select("*").eq("correo", user_email).order("created_at", desc=True).limit(1).execute()
        if start_trip_response.data:
            return jsonify({"state": "in_trip", "trip": start_trip_response.data[0]})

        # Check for pending acceptance
        acceptance_response = supabase.table('driver_acceptances').select("*").or_(
            f"passenger_email.eq.{user_email},driver_email.eq.{user_email}"
        ).order("created_at", desc=True).limit(1).execute()
        if acceptance_response.data:
            return jsonify({"state": "acceptance_pending", "acceptance": acceptance_response.data[0]})

        # Check for matched status
        pool_response = supabase.table('searching_pool').select("*").eq("correo_usuario", user_email).in_("status", ["matched", "in_progress"]).order("updated_at", desc=True).limit(1).execute()
        if pool_response.data:
            return jsonify({"state": "matched", "pool": pool_response.data[0]})

        return jsonify({"state": "idle"})

    except Exception as e:
        logger.error(f"❌ Error getting user active state: {str(e)}")
        return jsonify({"state": "error", "error": str(e)}), 500

# ============================================================================
# 🔹 ENDPOINTS - ROUTE OPTIMIZATION
# ============================================================================

@app.route('/api/trip-optimization/<trip_id>', methods=['GET'])
def get_trip_optimization(trip_id):
    """Obtiene la optimización de ruta para un viaje específico"""
    try:
        trip_type = request.args.get('trip_type', 'ida')
        
        trip_data = get_trip_data_for_driver(trip_id, trip_type)
        
        if not trip_data:
            return jsonify({
                'success': False,
                'error': 'Viaje no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': trip_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/trip-optimization/<trip_id>/step/<int:step_number>', methods=['GET'])
def get_trip_step(trip_id, step_number):
    """Obtiene un paso específico del viaje"""
    try:
        trip_type = request.args.get('trip_type', 'ida')
        trip_data = get_trip_data_for_driver(trip_id, trip_type)
        
        if not trip_data:
            return jsonify({'success': False, 'error': 'Viaje no encontrado'}), 404
        
        steps = trip_data.get('optimized_route', {}).get('steps', [])
        
        if step_number >= len(steps):
            return jsonify({'success': False, 'error': 'Paso no encontrado'}), 404
        
        step_data = steps[step_number]
        step_data['is_last_step'] = step_number == len(steps) - 1
        step_data['total_steps'] = len(steps)
        step_data['current_step'] = step_number
        
        return jsonify({'success': True, 'data': step_data})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# 🔹 ENDPOINTS - GESTIÓN DE CICLO DE VIDA DEL VIAJE
# ============================================================================

@app.route('/api/trip/<trip_id>/complete-passenger/<passenger_email>', methods=['POST'])
def complete_passenger_dropoff(trip_id, passenger_email):
    """
    Marca a un pasajero como completado (dejado en su destino)
    Similar a como Uber marca cada parada en viajes compartidos
    """
    try:
        logger.info(f"🎯 Completando dropoff para pasajero: {passenger_email} en viaje: {trip_id}")
        supabase = get_supabase_client()
        
        # 1. Obtener el viaje actual
        trip_response = supabase.table('trip_data').select("*").eq("id", trip_id).execute()
        
        if not trip_response.data:
            return jsonify({
                "success": False,
                "error": "Viaje no encontrado"
            }), 404
        
        trip = trip_response.data[0]
        passengers_data = trip.get('passengers_data', [])
        
        # 2. Buscar el pasajero y marcarlo como completado
        passenger_found = False
        for passenger in passengers_data:
            if passenger.get('correo') == passenger_email or passenger.get('passenger_email') == passenger_email:
                passenger['status'] = 'completed'
                passenger['dropoff_time'] = datetime.now().isoformat()
                passenger_found = True
                break
        
        if not passenger_found:
            return jsonify({
                "success": False,
                "error": "Pasajero no encontrado en este viaje"
            }), 404
        
        # 3. Actualizar el viaje con el nuevo estado del pasajero
        supabase.table('trip_data').update({
            "passengers_data": passengers_data,
            "updated_at": datetime.now().isoformat()
        }).eq("id", trip_id).execute()
        
        # 4. Verificar si todos los pasajeros han sido completados
        all_completed = all(p.get('status') == 'completed' for p in passengers_data)
        
        logger.info(f"✅ Pasajero marcado como completado. Todos completados: {all_completed}")
        
        return jsonify({
            "success": True,
            "message": f"Pasajero {passenger_email} completado exitosamente",
            "all_passengers_completed": all_completed,
            "remaining_passengers": len([p for p in passengers_data if p.get('status') != 'completed'])
        })
        
    except Exception as e:
        logger.error(f"❌ Error completando dropoff: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/trip/<trip_id>/complete', methods=['POST'])
def complete_trip(trip_id):
    """
    Finaliza completamente un viaje y limpia todos los registros asociados
    Se llama cuando:
    1. Todos los pasajeros han sido dejados en sus destinos, O
    2. El conductor manualmente finaliza el viaje
    """
    try:
        logger.info(f"🏁 Finalizando viaje completo: {trip_id}")
        supabase = get_supabase_client()
        data = request.get_json() or {}
        driver_email = data.get('driver_email')
        
        if not driver_email:
            return jsonify({
                "success": False,
                "error": "Se requiere el email del conductor"
            }), 400
        
        # 1. Marcar el viaje como completado en trip_data
        trip_response = supabase.table('trip_data').select("*").eq("id", trip_id).execute()
        
        if trip_response.data:
            supabase.table('trip_data').update({
                "status": "completed",
                "completed_at": datetime.now().isoformat()
            }).eq("id", trip_id).execute()
            logger.info("✅ trip_data actualizado a 'completed'")
        
        # 2. Limpiar searching_pool - eliminar registros del conductor y pasajeros
        pool_records = supabase.table('searching_pool').select("*").eq("trip_id", trip_id).execute()
        
        if pool_records.data:
            for record in pool_records.data:
                supabase.table('searching_pool').delete().eq("id", record['id']).execute()
            logger.info(f"✅ Eliminados {len(pool_records.data)} registros de searching_pool")
        
        # También buscar por correo del conductor
        driver_pool = supabase.table('searching_pool').select("*").eq("correo_usuario", driver_email).in_("status", ["matched", "in_progress"]).execute()
        
        if driver_pool.data:
            for record in driver_pool.data:
                supabase.table('searching_pool').delete().eq("id", record['id']).execute()
            logger.info(f"✅ Eliminados {len(driver_pool.data)} registros adicionales del conductor")
        
        # 3. Limpiar driver_acceptances
        acceptances = supabase.table('driver_acceptances').select("*").eq("driver_email", driver_email).execute()
        
        if acceptances.data:
            for record in acceptances.data:
                supabase.table('driver_acceptances').delete().eq("id", record['id']).execute()
            logger.info(f"✅ Eliminados {len(acceptances.data)} registros de driver_acceptances")
        
        # 4. Limpiar confirmed_trips
        confirmed = supabase.table('confirmed_trips').select("*").eq("conductor_correo", driver_email).execute()
        
        if confirmed.data:
            for record in confirmed.data:
                supabase.table('confirmed_trips').delete().eq("id", record['id']).execute()
            logger.info(f"✅ Eliminados {len(confirmed.data)} registros de confirmed_trips")
        
        # 5. Limpiar start_of_trip
        start_records = supabase.table('start_of_trip').select("*").eq("trip_id", int(trip_id)).execute()
        
        if start_records.data:
            for record in start_records.data:
                supabase.table('start_of_trip').delete().eq("id", record['id']).execute()
            logger.info(f"✅ Eliminados {len(start_records.data)} registros de start_of_trip")
        
        logger.info("🎉 Viaje completado y todos los registros limpiados exitosamente")
        
        return jsonify({
            "success": True,
            "message": "Viaje finalizado exitosamente",
            "trip_id": trip_id,
            "cleaned_tables": ["trip_data", "searching_pool", "driver_acceptances", "confirmed_trips", "start_of_trip"]
        })
        
    except Exception as e:
        logger.error(f"❌ Error finalizando viaje: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/trip/<trip_id>/status', methods=['GET'])
def get_trip_status(trip_id):
    """
    Obtiene el estado actual de un viaje con detalles de cada pasajero
    """
    try:
        logger.info(f"🔍 Obteniendo estado del viaje: {trip_id}")
        supabase = get_supabase_client()
        
        trip_response = supabase.table('trip_data').select("*").eq("id", trip_id).execute()
        
        if not trip_response.data:
            return jsonify({
                "success": False,
                "error": "Viaje no encontrado"
            }), 404
        
        trip = trip_response.data[0]
        passengers_data = trip.get('passengers_data', [])
        
        # Calcular estadísticas
        total_passengers = len(passengers_data)
        completed_passengers = len([p for p in passengers_data if p.get('status') == 'completed'])
        pending_passengers = total_passengers - completed_passengers
        
        return jsonify({
            "success": True,
            "trip": {
                "id": trip['id'],
                "status": trip.get('status'),
                "driver_id": trip.get('driver_id'),
                "total_passengers": total_passengers,
                "completed_passengers": completed_passengers,
                "pending_passengers": pending_passengers,
                "passengers": passengers_data,
                "created_at": trip.get('created_at'),
                "updated_at": trip.get('updated_at'),
                "completed_at": trip.get('completed_at')
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo estado del viaje: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/cleanup-orphaned-records', methods=['POST'])
def cleanup_orphaned_records():
    """
    Endpoint de emergencia para limpiar registros huérfanos
    Útil para desarrollo y mantenimiento
    """
    try:
        logger.info("🧹 Iniciando limpieza de registros huérfanos")
        supabase = get_supabase_client()
        data = request.get_json() or {}
        
        # Permitir limpieza solo con una clave de seguridad
        if data.get('secret_key') != 'cleanup_wheels_2024':
            return jsonify({
                "success": False,
                "error": "Clave de seguridad inválida"
            }), 403
        
        cleaned = {
            "searching_pool": 0,
            "driver_acceptances": 0,
            "confirmed_trips": 0,
            "start_of_trip": 0
        }
        
        # Limpiar registros antiguos (más de 24 horas)
        cutoff_time = (datetime.now() - timedelta(hours=24)).isoformat()
        
        # Searching pool
        old_pool = supabase.table('searching_pool').select("*").lt("created_at", cutoff_time).execute()
        if old_pool.data:
            for record in old_pool.data:
                supabase.table('searching_pool').delete().eq("id", record['id']).execute()
            cleaned['searching_pool'] = len(old_pool.data)
        
        # Driver acceptances
        old_acceptances = supabase.table('driver_acceptances').select("*").lt("created_at", cutoff_time).execute()
        if old_acceptances.data:
            for record in old_acceptances.data:
                supabase.table('driver_acceptances').delete().eq("id", record['id']).execute()
            cleaned['driver_acceptances'] = len(old_acceptances.data)
        
        # Confirmed trips
        old_confirmed = supabase.table('confirmed_trips').select("*").lt("created_at", cutoff_time).execute()
        if old_confirmed.data:
            for record in old_confirmed.data:
                supabase.table('confirmed_trips').delete().eq("id", record['id']).execute()
            cleaned['confirmed_trips'] = len(old_confirmed.data)
        
        # Start of trip
        old_start = supabase.table('start_of_trip').select("*").lt("created_at", cutoff_time).execute()
        if old_start.data:
            for record in old_start.data:
                supabase.table('start_of_trip').delete().eq("id", record['id']).execute()
            cleaned['start_of_trip'] = len(old_start.data)
        
        logger.info(f"✅ Limpieza completada: {cleaned}")
        
        return jsonify({
            "success": True,
            "message": "Limpieza completada exitosamente",
            "records_cleaned": cleaned,
            "total_cleaned": sum(cleaned.values())
        })
        
    except Exception as e:
        logger.error(f"❌ Error en limpieza: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/trip/<trip_id>/passengers', methods=['GET'])
def get_trip_passengers(trip_id):
    """
    Obtiene la lista de pasajeros de un viaje con su estado actual
    Útil para que el conductor vea qué pasajeros ya dejó y cuáles faltan
    """
    try:
        logger.info(f"🔍 Obteniendo pasajeros del viaje: {trip_id}")
        supabase = get_supabase_client()
        
        trip_response = supabase.table('trip_data').select("*").eq("id", trip_id).execute()
        
        if not trip_response.data:
            return jsonify({
                "success": False,
                "error": "Viaje no encontrado"
            }), 404
        
        trip = trip_response.data[0]
        passengers_data = trip.get('passengers_data', [])
        
        # Enriquecer información de pasajeros
        enriched_passengers = []
        for passenger in passengers_data:
            enriched_passengers.append({
                "email": passenger.get('correo') or passenger.get('passenger_email'),
                "name": passenger.get('nombre', 'Pasajero'),
                "pickup_address": passenger.get('pickup_address'),
                "dropoff_address": passenger.get('dropoff_address'),
                "status": passenger.get('status', 'pending'),
                "pickup_time": passenger.get('pickup_time'),
                "dropoff_time": passenger.get('dropoff_time'),
                "pickup_eta": passenger.get('pickup_eta', 0)
            })
        
        # Ordenar por ETA
        enriched_passengers.sort(key=lambda x: x.get('pickup_eta', 0))
        
        return jsonify({
            "success": True,
            "trip_id": trip_id,
            "passengers": enriched_passengers,
            "total_passengers": len(enriched_passengers),
            "completed": len([p for p in enriched_passengers if p['status'] == 'completed']),
            "pending": len([p for p in enriched_passengers if p['status'] != 'completed'])
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo pasajeros: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# Reemplaza la función get_driver_active_trip completa con esta versión corregida

@app.route('/api/driver/<driver_email>/active-trip', methods=['GET'])
def get_driver_active_trip(driver_email):
    """
    Obtiene el viaje activo de un conductor (VERSIÓN CORREGIDA Y ROBUSTA)
    """
    try:
        logger.info(f"🔍 Obteniendo viaje activo del conductor: {driver_email}")
        supabase = get_supabase_client()
        
        # --- INICIO DE LA CORRECCIÓN ---

        # 1. Obtener el ID de perfil (UUID) del conductor a partir de su email.
        profile_response = supabase.table('profiles').select("id").eq("email", driver_email).execute()
        
        if not profile_response.data:
            logger.warning(f"⚠️ No se encontró el perfil para el conductor: {driver_email}")
            return jsonify({"success": False, "message": "Conductor no encontrado"}), 404
        
        driver_id = profile_response.data[0]['id']
        logger.info(f"📄 ID de perfil del conductor: {driver_id}")

        # 2. Buscar directamente en 'trip_data' un viaje 'in_progress' para este driver_id.
        # Esta es la forma más directa y confiable de encontrar el viaje activo.
        trip_data_response = supabase.table('trip_data').select("*").eq("driver_id", driver_id).eq("status", "in_progress").order("created_at", desc=True).limit(1).execute()

        if not trip_data_response.data:
            logger.info(f"ℹ️ No se encontró un viaje activo en 'trip_data' para el conductor: {driver_email}")
            return jsonify({"success": False, "message": "No hay viaje activo"}), 404

        # 3. Formatear y devolver la respuesta con los datos completos del viaje.
        full_trip = trip_data_response.data[0]
        passengers_data = full_trip.get('passengers_data', [])
        
        logger.info(f"✅ Viaje activo encontrado: {full_trip.get('id')}")
        
        return jsonify({
            "success": True,
            "trip": {
                "id": full_trip.get('id'),
                "trip_id": full_trip.get('id'), # Añadido por consistencia
                "status": full_trip.get('status'),
                "passengers": passengers_data,
                "total_passengers": len(passengers_data),
                "completed_passengers": len([p for p in passengers_data if p.get('status') == 'completed']),
                "created_at": full_trip.get('created_at'),
                "updated_at": full_trip.get('updated_at')
            }
        })
        
        # --- FIN DE LA CORRECCIÓN ---
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo viaje del conductor: {str(e)}")
        import traceback
        logger.error(traceback.format_exc()) # Log completo para depuración
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500


# ============================================================================
# 🔹 MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    logger.info("="*60)
    logger.info("🚀 WHEELS API UNIFICADA")
    logger.info("="*60)
    logger.info(f"📡 Puerto: {port}")
    logger.info(f"🔧 Debug: {debug}")
    logger.info(f"🔌 Supabase: {SUPABASE_URL}")
    logger.info(f"🗺️  Google Maps: {'✅' if os.getenv('GOOGLE_MAPS_API_KEY') else '❌'}")
    logger.info("")
    logger.info("📋 Endpoints disponibles:")
    logger.info("")
    logger.info("   MATCHMAKING:")
    logger.info("   • GET  /api/health")
    logger.info("   • POST /api/python-matchmaking")
    logger.info("   • GET  /api/matches/<user_email>")
    logger.info("   • GET  /api/passenger-trip/<user_email>")
    logger.info("   • GET  /api/user-active-state/<user_email>")
    logger.info("")
    logger.info("   OPTIMIZACIÓN DE RUTAS:")
    logger.info("   • GET  /api/trip-optimization/<trip_id>")
    logger.info("   • GET  /api/trip-optimization/<trip_id>/step/<step_number>")
    logger.info("")
    logger.info("   GESTIÓN DE VIAJES:")
    logger.info("   • POST /api/trip/<trip_id>/complete-passenger/<passenger_email>")
    logger.info("   • POST /api/trip/<trip_id>/complete")
    logger.info("   • GET  /api/trip/<trip_id>/status")
    logger.info("   • GET  /api/trip/<trip_id>/passengers")
    logger.info("   • GET  /api/driver/<driver_email>/active-trip")
    logger.info("")
    logger.info("   MANTENIMIENTO:")
    logger.info("   • POST /api/cleanup-orphaned-records")
    logger.info("="*60)
    
    app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
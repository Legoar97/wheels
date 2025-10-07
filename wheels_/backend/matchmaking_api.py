#!/usr/bin/env python3
"""
WHEELS Matchmaking API Service
Exposes the Python matching algorithm as a REST API
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import pandas as pd
from supabase import create_client, Client
from geopy.distance import geodesic
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Flask app setup
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for API availability"""
    try:
        # Test Supabase connection
        supabase = get_supabase_client()
        supabase.table('profiles').select("id").limit(1).execute()
        
        return jsonify({
            "success": True,
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "supabase": "connected",
                "google_maps": "available" if os.getenv('GOOGLE_MAPS_API_KEY') else "not_configured"
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

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ozvjmkvmpxxviveniuwt.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-key")

def get_supabase_client():
    """Create and return Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_wheels_dataframes():
    """Fetch all necessary data from Supabase"""
    try:
        logger.info("🔌 Connecting to Supabase...")
        supabase = get_supabase_client()
        
        # Fetch all required tables
        profiles_response = supabase.table('profiles').select("*").execute()
        searching_pool_response = supabase.table('searching_pool').select("*").execute()
        
        # Convert to DataFrames
        profiles_df = pd.DataFrame(profiles_response.data)
        searching_pool_df = pd.DataFrame(searching_pool_response.data)
        
        logger.info(f"✅ Loaded {len(profiles_df)} profiles, {len(searching_pool_df)} searching pool records")
        return profiles_df, searching_pool_df
        
    except Exception as e:
        logger.error(f"❌ Error fetching data: {str(e)}")
        raise

def match_rides_enhanced(searching_pool_df, profiles_df, max_distance_km=5):
    """
    Enhanced matching algorithm that uses email as identifier
    Returns matches with proper email-based identification
    """
    try:
        # Debug: Mostrar todos los registros
        logger.info(f"📊 Total registros en searching_pool: {len(searching_pool_df)}")
        if not searching_pool_df.empty:
            logger.info(f"📋 Columnas disponibles: {list(searching_pool_df.columns)}")
            logger.info(f"📋 Estados únicos: {searching_pool_df['status'].unique() if 'status' in searching_pool_df.columns else 'No hay columna status'}")
            logger.info(f"📋 Tipos de usuario: {searching_pool_df['tipo_de_usuario'].unique() if 'tipo_de_usuario' in searching_pool_df.columns else 'No hay columna tipo_de_usuario'}")
        
        # Filter for active searching records only
        active_pool = searching_pool_df[
            (searching_pool_df["status"] == "searching") |
            (searching_pool_df["status"].isna())
        ].copy()
        
        logger.info(f"📊 Registros activos después del filtro: {len(active_pool)}")
        
        if active_pool.empty:
            logger.info("❌ No hay registros activos en searching pool")
            return []
        
        # Separate drivers and passengers based on tipo_de_usuario
        drivers = active_pool[active_pool["tipo_de_usuario"] == "conductor"].copy()
        passengers = active_pool[active_pool["tipo_de_usuario"] == "pasajero"].copy()
        
        logger.info(f"🔍 Found {len(drivers)} drivers, {len(passengers)} passengers")
        
        # Debug: Mostrar detalles de drivers
        if len(drivers) > 0:
            logger.info("🚗 Conductores encontrados:")
            for _, driver in drivers.iterrows():
                logger.info(f"  - ID: {driver.get('id', 'N/A')}, Email: {driver.get('correo_usuario', 'N/A')}, Destino: {driver.get('destino', 'N/A')}")
        
        # Debug: Mostrar detalles de passengers  
        if len(passengers) > 0:
            logger.info("🚶 Pasajeros encontrados:")
            for _, passenger in passengers.iterrows():
                logger.info(f"  - ID: {passenger.get('id', 'N/A')}, Email: {passenger.get('correo_usuario', 'N/A')}, Destino: {passenger.get('destino', 'N/A')}")
        
        if len(drivers) == 0:
            logger.info("❌ No hay conductores disponibles")
            return []
        
        if len(passengers) == 0:
            logger.info("❌ No hay pasajeros disponibles")
            return []
        
        matches = []
        
        for _, driver in drivers.iterrows():
            try:
                driver_location = (driver["pickup_lat"], driver["pickup_lng"])
                driver_destination = driver["destino"]
                available_seats = int(driver.get("available_seats", 1))
                driver_email = driver.get("correo_usuario")
                
                if not driver_email:
                    logger.warning(f"Driver {driver['id']} has no email, skipping")
                    continue
                
                logger.info(f"🚗 Processing driver: {driver_email} - Destination: {driver_destination}")
                
                matched_passengers = []
                pickup_order = []
                current_time = 0  # minutos acumulados
                last_location = driver_location
                
                for _, passenger in passengers.iterrows():
                    try:
                        # Check destination compatibility
                        if passenger["destino"] != driver_destination:
                            continue
                        
                        # Calculate distance between last point and this passenger
                        passenger_location = (passenger["pickup_lat"], passenger["pickup_lng"])
                        distance_result = calculate_google_maps_distance(last_location, passenger_location)
                        # duration_value en segundos, si está disponible
                        eta_minutes = 0
                        if 'duration' in distance_result and isinstance(distance_result['duration'], str):
                            # Extraer minutos de la cadena (ej: '8 min')
                            try:
                                eta_minutes = int(distance_result['duration'].split()[0])
                            except:
                                eta_minutes = 0
                        current_time += eta_minutes
                        last_location = passenger_location
                        
                        if distance_result['distance'] > max_distance_km:
                            continue
                        
                        # Check available seats
                        if len(matched_passengers) >= available_seats:
                            break
                        
                        passenger_email = passenger.get("correo_usuario")
                        if not passenger_email:
                            logger.warning(f"Passenger {passenger['id']} has no email, skipping")
                            continue
                        
                        # Get passenger profile details using email
                        if not profiles_df.empty and "email" in profiles_df.columns:
                            passenger_profile = profiles_df[profiles_df["email"] == passenger_email]
                            passenger_name = passenger_profile["full_name"].iloc[0] if not passenger_profile.empty else "Pasajero"
                        else:
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
                            "pickup_lat": passenger.get("pickup_lat", 0),
                            "pickup_lng": passenger.get("pickup_lng", 0),
                            "dropoff_lat": passenger.get("dropoff_lat", 0),
                            "dropoff_lng": passenger.get("dropoff_lng", 0),
                            "pickup_eta": current_time  # ETA acumulado en minutos
                        })
                        
                        logger.info(f"✅ Matched passenger: {passenger_email} - {distance_result['distance']}km ({distance_result['duration']}) - ETA acumulado: {current_time} min")
                        
                    except Exception as e:
                        logger.error(f"Error processing passenger {passenger.get('id', 'unknown')}: {e}")
                        continue
                
                if matched_passengers:
                    # Get driver profile details using email
                    if not profiles_df.empty and "email" in profiles_df.columns:
                        driver_profile = profiles_df[profiles_df["email"] == driver_email]
                        driver_name = driver_profile["full_name"].iloc[0] if not driver_profile.empty else "Conductor"
                    else:
                        # Si no hay perfiles o no existe la columna email, usar el nombre del searching_pool
                        driver_name = driver.get("nombre_usuario", "Conductor")
                    
                    matches.append({
                        "conductor_correo": driver_email,  # Usar correo como identificador principal
                        "conductor_id": driver["id"],  # Mantener para compatibilidad
                        "nombre_conductor": driver_name,
                        "correo_conductor": driver_email,
                        "pickup": driver["pickup_address"],
                        "destino": driver_destination,
                        "available_seats": available_seats,
                        "price_per_seat": float(driver.get("price_per_seat", 0)),
                        "pickup_address": driver["pickup_address"],
                        "dropoff_address": driver_destination,
                        "pickup_lat": driver.get("pickup_lat", 0),
                        "pickup_lng": driver.get("pickup_lng", 0),
                        "dropoff_lat": driver.get("dropoff_lat", 0),
                        "dropoff_lng": driver.get("dropoff_lng", 0),
                        "driver_pool_id": driver["id"],  # ID del registro en searching_pool
                        "pasajeros_asignados": matched_passengers
                    })
                    
                    logger.info(f"🎯 Created match for driver: {driver_email} with {len(matched_passengers)} passengers")
            
            except Exception as e:
                logger.error(f"Error processing driver {driver.get('id', 'unknown')}: {e}")
                continue
        
        logger.info(f"🎉 Total matches created: {len(matches)}")
        return matches
        
    except Exception as e:
        logger.error(f"❌ Error in matching algorithm: {str(e)}")
        return []

@app.route('/api/python-matchmaking', methods=['POST', 'GET'])
def run_matchmaking():
    """
    Main API endpoint for running the matchmaking algorithm
    """
    try:
        logger.info("🚀 Starting matchmaking process...")
        
        # Get data from Supabase
        profiles_df, searching_pool_df = get_wheels_dataframes()
        
        if searching_pool_df.empty:
            return jsonify({
                "success": True,
                "matches": [],
                "total_matches": 0,
                "message": "No records in searching pool",
                "timestamp": datetime.now().isoformat()
            })
        
        # Run matching algorithm
        matches = match_rides_enhanced(searching_pool_df, profiles_df)
        
        response = {
            "success": True,
            "matches": matches,
            "total_matches": len(matches),
            "timestamp": datetime.now().isoformat(),
            "message": f"Matchmaking completed successfully. Found {len(matches)} matches."
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


@app.route('/api/trigger-matchmaking', methods=['POST'])
def trigger_matchmaking():
    """
    Endpoint specifically for database triggers or webhooks
    Called automatically when new records are added to searching_pool
    """
    try:
        logger.info("🔔 Matchmaking triggered automatically")
        
        # Get request data (if any)
        data = request.get_json() or {}
        logger.info(f"Trigger data: {data}")
        
        # Run the matchmaking
        result = run_matchmaking()
        
        # If it's a JSON response, extract the data
        if hasattr(result, 'get_json'):
            return result
        else:
            return result
            
    except Exception as e:
        logger.error(f"❌ Error in trigger endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/matches/<user_email>', methods=['GET'])
def get_user_matches(user_email):
    """
    Get matches for a specific user by email
    """
    try:
        logger.info(f"🔍 Getting matches for user: {user_email}")
        
        # Run matchmaking first
        profiles_df, searching_pool_df = get_wheels_dataframes()
        all_matches = match_rides_enhanced(searching_pool_df, profiles_df)
        
        user_matches = []
        
        # Find matches where user is either driver or passenger
        for match in all_matches:
            # Check if user is the driver
            if match["correo_conductor"] == user_email:
                user_matches.append({
                    "role": "driver",
                    "match": match
                })
            
            # Check if user is a passenger
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
    """
    Get the active trip for a specific passenger by email, including pickup ETA.
    Only return if the trip status is 'in_progress'.
    """
    try:
        logger.info(f"🔍 Getting active trip for passenger: {user_email}")
        supabase = get_supabase_client()

        # 1. Find the passenger's profile ID
        profile_response = supabase.table('profiles').select("id").eq("email", user_email).single().execute()
        if not profile_response.data:
            return jsonify({"success": False, "error": "Passenger not found"}), 404
        passenger_id = profile_response.data['id']

        # 2. Find an active trip in trip_data where this passenger is assigned and status is 'in_progress'
        trip_data_response = supabase.table('trip_data').select("*").contains(
            "passengers_data", [{"passenger_id": str(passenger_id)}]
        ).eq("status", "in_progress").order("created_at", desc=True).limit(1).execute()

        if not trip_data_response.data:
            return jsonify({"success": False, "message": "No active trip found for passenger"}), 404

        trip = trip_data_response.data[0]
        passenger_details_in_trip = None
        for p in trip['passengers_data']:
            if p.get('passenger_id') == str(passenger_id):
                passenger_details_in_trip = p
                break

        if not passenger_details_in_trip:
            return jsonify({"success": False, "error": "Passenger details not found in trip data"}), 404

        return jsonify({
            "success": True,
            "trip": {
                "trip_id": trip['id'],
                "driver_id": trip['driver_id'],
                "pickup_address": trip['pickup_address'],
                "dropoff_address": trip['dropoff_address'],
                "passenger": passenger_details_in_trip, # Contains pickup_eta
                "status": trip['status']
            }
        })

    except Exception as e:
        logger.error(f"❌ Error getting passenger trip: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/user-active-state/<user_email>', methods=['GET'])
def get_user_active_state(user_email):
    """
    Devuelve el estado activo del usuario: viaje en curso, aceptación pendiente, emparejado o inactivo.
    """
    try:
        logger.info(f"🔍 Checking active state for user: {user_email}")
        supabase = get_supabase_client()

        # 1. ¿Viaje en curso? (start_of_trip)
        start_trip_response = supabase.table('start_of_trip').select("*").eq("correo", user_email).order("created_at", desc=True).limit(1).execute()
        if start_trip_response.data:
            trip = start_trip_response.data[0]
            return jsonify({
                "state": "in_trip",
                "trip": trip
            })

        # 2. ¿Aceptación pendiente? (driver_acceptances)
        acceptance_response = supabase.table('driver_acceptances').select("*").or_(
            f"passenger_email.eq.{user_email},driver_email.eq.{user_email}"
        ).order("created_at", desc=True).limit(1).execute()
        if acceptance_response.data:
            acceptance = acceptance_response.data[0]
            return jsonify({
                "state": "acceptance_pending",
                "acceptance": acceptance
            })

        # 3. ¿Emparejado pero no ha iniciado viaje? (searching_pool)
        pool_response = supabase.table('searching_pool').select("*").eq("correo_usuario", user_email).in_("status", ["matched", "in_progress"]).order("updated_at", desc=True).limit(1).execute()
        if pool_response.data:
            pool = pool_response.data[0]
            return jsonify({
                "state": "matched",
                "pool": pool
            })

        # 4. Inactivo
        return jsonify({
            "state": "idle"
        })

    except Exception as e:
        logger.error(f"❌ Error getting user active state: {str(e)}")
        return jsonify({
            "state": "error",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Configuration
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"🚀 Starting WHEELS Matchmaking API on port {port}")
    logger.info(f"🔧 Debug mode: {debug}")
    
    # Start the Flask application
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )
#!/usr/bin/env python3
"""
WHEELS API UNIFICADA
Combina matchmaking y optimización de rutas en un solo servicio
Puerto: 5000
"""

import os
import json
import logging
from datetime import datetime
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

def match_rides_enhanced(searching_pool_df, profiles_df, max_distance_km=5):
    """Algoritmo de matchmaking mejorado"""
    try:
        logger.info(f"📊 Total registros en searching_pool: {len(searching_pool_df)}")
        
        if not searching_pool_df.empty:
            logger.info(f"📋 Columnas disponibles: {list(searching_pool_df.columns)}")
            if 'status' in searching_pool_df.columns:
                logger.info(f"📋 Estados únicos: {searching_pool_df['status'].unique()}")
                logger.info(f"📋 Valores NULL en status: {searching_pool_df['status'].isna().sum()}")
            if 'tipo_de_usuario' in searching_pool_df.columns:
                logger.info(f"📋 Tipos de usuario: {searching_pool_df['tipo_de_usuario'].unique()}")
        
        # Filtros más flexibles
        active_pool = searching_pool_df[
            (searching_pool_df["status"].isna()) |
            (searching_pool_df["status"] == "searching") |
            (searching_pool_df["status"] == "")
        ].copy()
        
        logger.info(f"📊 Registros activos después del filtro: {len(active_pool)}")
        
        if active_pool.empty:
            logger.warning("⚠️ No hay registros activos en searching pool")
            return []
        
        drivers = active_pool[active_pool["tipo_de_usuario"] == "conductor"].copy()
        passengers = active_pool[active_pool["tipo_de_usuario"] == "pasajero"].copy()
        
        logger.info(f"🔍 Found {len(drivers)} drivers, {len(passengers)} passengers")
        
        if len(drivers) == 0 or len(passengers) == 0:
            return []
        
        matches = []
        
        for _, driver in drivers.iterrows():
            try:
                if pd.isna(driver.get("pickup_lat")) or pd.isna(driver.get("pickup_lng")):
                    logger.warning(f"⚠️ Conductor sin coordenadas, saltando")
                    continue
                
                driver_location = (driver["pickup_lat"], driver["pickup_lng"])
                driver_destination = driver["destino"]
                available_seats = int(driver.get("available_seats", 1))
                driver_email = driver.get("correo_usuario")
                
                if not driver_email:
                    logger.warning(f"⚠️ Driver sin email, saltando")
                    continue
                
                logger.info(f"🚗 Processing driver: {driver_email}")
                
                matched_passengers = []
                current_time = 0
                last_location = driver_location
                
                for _, passenger in passengers.iterrows():
                    try:
                        if pd.isna(passenger.get("pickup_lat")) or pd.isna(passenger.get("pickup_lng")):
                            continue
                        
                        if passenger["destino"] != driver_destination:
                            continue
                        
                        passenger_location = (passenger["pickup_lat"], passenger["pickup_lng"])
                        distance_result = calculate_google_maps_distance(last_location, passenger_location)
                        
                        eta_minutes = 0
                        if 'duration' in distance_result and isinstance(distance_result['duration'], str):
                            try:
                                eta_minutes = int(distance_result['duration'].split()[0])
                            except:
                                eta_minutes = 0
                        
                        current_time += eta_minutes
                        last_location = passenger_location
                        
                        if distance_result['distance'] > max_distance_km:
                            continue
                        
                        if len(matched_passengers) >= available_seats:
                            break
                        
                        passenger_email = passenger.get("correo_usuario")
                        if not passenger_email:
                            continue
                        
                        passenger_name = "Pasajero"
                        if not profiles_df.empty and "email" in profiles_df.columns:
                            passenger_profile = profiles_df[profiles_df["email"] == passenger_email]
                            if not passenger_profile.empty:
                                passenger_name = passenger_profile["full_name"].iloc[0]
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
                            "pickup_eta": current_time
                        })
                        
                        logger.info(f"✅ Matched passenger: {passenger_email}")
                        
                    except Exception as e:
                        logger.error(f"❌ Error processing passenger: {e}")
                        continue
                
                if matched_passengers:
                    driver_name = "Conductor"
                    if not profiles_df.empty and "email" in profiles_df.columns:
                        driver_profile = profiles_df[profiles_df["email"] == driver_email]
                        if not driver_profile.empty:
                            driver_name = driver_profile["full_name"].iloc[0]
                    else:
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
                        "pickup_address": driver["pickup_address"],
                        "dropoff_address": driver_destination,
                        "pickup_lat": driver.get("pickup_lat", 0),
                        "pickup_lng": driver.get("pickup_lng", 0),
                        "dropoff_lat": driver.get("dropoff_lat", 0),
                        "dropoff_lng": driver.get("dropoff_lng", 0),
                        "driver_pool_id": driver["id"],
                        "pasajeros_asignados": matched_passengers
                    })
                    
                    logger.info(f"🎯 Match created with {len(matched_passengers)} passengers")
            
            except Exception as e:
                logger.error(f"❌ Error processing driver: {e}")
                continue
        
        logger.info(f"🎉 Total matches created: {len(matches)}")
        return matches
        
    except Exception as e:
        logger.error(f"❌ Error in matching algorithm: {str(e)}")
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
                "route_optimization": "enabled"
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
    """Get the active trip for a specific passenger"""
    try:
        logger.info(f"🔍 Getting active trip for passenger: {user_email}")
        supabase = get_supabase_client()

        # 1. Find the passenger's profile ID
        profile_response = supabase.table('profiles').select("id").eq("email", user_email).execute()
        if not profile_response.data:
            return jsonify({"success": False, "error": "Passenger not found"}), 404
        passenger_id = profile_response.data[0]['id']

        # 2. Find an active trip in trip_data where this passenger is assigned and status is 'in_progress'
        trip_data_response = supabase.table('trip_data').select("*").eq("status", "in_progress").execute()

        if not trip_data_response.data:
            return jsonify({"success": False, "message": "No active trip found for passenger"}), 404

        # 3. Find trip where passenger is included
        passenger_trip = None
        passenger_details = None
        
        for trip in trip_data_response.data:
            passengers_data = trip.get('passengers_data', [])
            for p in passengers_data:
                if p.get('passenger_id') == str(passenger_id):
                    passenger_trip = trip
                    passenger_details = p
                    break
            if passenger_trip:
                break

        if not passenger_trip:
            return jsonify({"success": False, "message": "No active trip found for passenger"}), 404

        return jsonify({
            "success": True,
            "trip": {
                "trip_id": passenger_trip['id'],
                "driver_id": passenger_trip['driver_id'],
                "pickup_address": passenger_trip['pickup_address'],
                "dropoff_address": passenger_trip['dropoff_address'],
                "passenger": passenger_details,
                "status": passenger_trip['status']
            }
        })

    except Exception as e:
        logger.error(f"❌ Error getting passenger trip: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

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
    logger.info("   • GET  /api/health")
    logger.info("   • POST /api/python-matchmaking")
    logger.info("   • GET  /api/matches/<user_email>")
    logger.info("   • GET  /api/trip-optimization/<trip_id>")
    logger.info("   • GET  /api/trip-optimization/<trip_id>/step/<step_number>")
    logger.info("="*60)
    
    app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
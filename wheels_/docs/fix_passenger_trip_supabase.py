# =====================================================
# API CORREGIDA PARA PASSENGER-TRIP USANDO SUPABASE
# =====================================================

import os
import json
from flask import Flask, request, jsonify
from supabase import create_client, Client

app = Flask(__name__)

# Configuración de Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ozvjmkvmpxxviveniuwt.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', 'YOUR_SUPABASE_ANON_KEY')

# Crear cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/api/passenger-trip/<email>', methods=['GET'])
def get_passenger_trip(email):
    """Obtener información del viaje del pasajero"""
    try:
        print(f"🔍 Buscando viaje para pasajero: {email}")
        
        # Buscar en trip_data
        response = supabase.table('trip_data').select('*').in_('status', ['created', 'in_progress']).execute()
        
        if response.data:
            # Buscar manualmente por email del pasajero
            for trip in response.data:
                if trip.get('passengers_data') and isinstance(trip['passengers_data'], list):
                    for passenger in trip['passengers_data']:
                        if (passenger.get('passenger_email') == email or 
                            passenger.get('correo') == email):
                            
                            # Buscar información del conductor
                            conductor_response = supabase.table('profiles').select('full_name, email, avatar_url').eq('id', trip['driver_id']).execute()
                            
                            trip_data = trip.copy()
                            if conductor_response.data:
                                trip_data['conductor'] = conductor_response.data[0]
                            
                            print(f"✅ Viaje encontrado para {email}: {trip['id']}")
                            return jsonify({
                                "success": True,
                                "trip": trip_data
                            })
        
        print(f"⚠️ No se encontró viaje activo para {email}")
        return jsonify({
            "success": False,
            "message": "No active trip found for this passenger",
            "trip": None
        })
        
    except Exception as e:
        print(f"❌ Error en get_passenger_trip: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/debug-passenger-data/<email>', methods=['GET'])
def debug_passenger_data(email):
    """Debug: Ver todos los datos relacionados con un pasajero"""
    try:
        print(f"🔍 Debugging datos para: {email}")
        
        results = {}
        
        # Buscar en trip_data
        try:
            trip_data_response = supabase.table('trip_data').select('*').execute()
            results['trip_data'] = trip_data_response.data
        except Exception as e:
            results['trip_data'] = f"Error: {str(e)}"
        
        # Buscar en driver_acceptances
        try:
            acceptances_response = supabase.table('driver_acceptances').select('*').eq('passenger_email', email).execute()
            results['driver_acceptances'] = acceptances_response.data
        except Exception as e:
            results['driver_acceptances'] = f"Error: {str(e)}"
        
        # Buscar en confirmed_trips
        try:
            confirmed_response = supabase.table('confirmed_trips').select('*').execute()
            results['confirmed_trips'] = confirmed_response.data
        except Exception as e:
            results['confirmed_trips'] = f"Error: {str(e)}"
        
        return jsonify({
            "success": True,
            "email": email,
            "data": results
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    """Probar conexión a Supabase"""
    try:
        response = supabase.table('profiles').select('id').limit(1).execute()
        return jsonify({
            "success": True,
            "message": "Supabase connection successful",
            "test_result": len(response.data)
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

if __name__ == '__main__':
    print("🚀 Iniciando servidor de corrección de API con Supabase...")
    print("📋 Endpoints disponibles:")
    print("  - GET /api/passenger-trip/<email>")
    print("  - GET /api/debug-passenger-data/<email>")
    print("  - GET /api/test-connection")
    
    app.run(host='0.0.0.0', port=5001, debug=True)


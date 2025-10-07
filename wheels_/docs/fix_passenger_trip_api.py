# =====================================================
# SCRIPT PARA CORREGIR LA API DE PASSENGER-TRIP
# =====================================================

import os
import sys
import json
from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

# Configuración de la base de datos
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'postgres'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'port': os.getenv('DB_PORT', '5432')
}

def get_db_connection():
    """Obtener conexión a la base de datos"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error conectando a la base de datos: {e}")
        return None

@app.route('/api/passenger-trip/<email>', methods=['GET'])
def get_passenger_trip(email):
    """Obtener información del viaje del pasajero"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed", "success": False}), 500
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Buscar en trip_data usando el email del pasajero
        query = """
        SELECT 
            td.id,
            td.status,
            td.passengers_data,
            td.total_passengers,
            td.pickup_address,
            td.dropoff_address,
            td.created_at
        FROM trip_data td
        WHERE td.passengers_data::text LIKE %s
        AND td.status IN ('created', 'in_progress')
        ORDER BY td.created_at DESC
        LIMIT 1
        """
        
        cursor.execute(query, (f'%{email}%',))
        result = cursor.fetchone()
        
        if result:
            # Convertir a diccionario y limpiar datos
            trip_data = dict(result)
            
            # Buscar información del conductor
            conductor_query = """
            SELECT 
                p.full_name,
                p.email,
                p.avatar_url
            FROM profiles p
            WHERE p.id = (
                SELECT driver_id 
                FROM trip_data 
                WHERE id = %s
            )
            """
            
            cursor.execute(conductor_query, (trip_data['id'],))
            conductor = cursor.fetchone()
            
            if conductor:
                trip_data['conductor'] = dict(conductor)
            
            cursor.close()
            conn.close()
            
            return jsonify({
                "success": True,
                "trip": trip_data
            })
        else:
            cursor.close()
            conn.close()
            
            return jsonify({
                "success": False,
                "message": "No active trip found for this passenger",
                "trip": None
            })
            
    except Exception as e:
        print(f"Error en get_passenger_trip: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/test-db-connection', methods=['GET'])
def test_db_connection():
    """Probar conexión a la base de datos"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed", "success": False}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Database connection successful",
            "test_result": result[0]
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/debug-passenger-data/<email>', methods=['GET'])
def debug_passenger_data(email):
    """Debug: Ver todos los datos relacionados con un pasajero"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed", "success": False}), 500
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Buscar en todas las tablas relevantes
        tables_to_check = [
            'trip_data',
            'confirmed_trips', 
            'trip_requests',
            'driver_acceptances',
            'searching_pool'
        ]
        
        results = {}
        
        for table in tables_to_check:
            try:
                if table == 'trip_data':
                    query = f"SELECT * FROM {table} WHERE passengers_data::text LIKE %s"
                    cursor.execute(query, (f'%{email}%',))
                elif table == 'confirmed_trips':
                    query = f"SELECT * FROM {table} WHERE passenger_id = (SELECT id FROM profiles WHERE email = %s)"
                    cursor.execute(query, (email,))
                elif table == 'trip_requests':
                    query = f"SELECT * FROM {table} WHERE passenger_id = (SELECT id FROM profiles WHERE email = %s)"
                    cursor.execute(query, (email,))
                elif table == 'driver_acceptances':
                    query = f"SELECT * FROM {table} WHERE passenger_email = %s"
                    cursor.execute(query, (email,))
                elif table == 'searching_pool':
                    query = f"SELECT * FROM {table} WHERE driver_id = (SELECT id FROM profiles WHERE email = %s)"
                    cursor.execute(query, (email,))
                
                table_results = cursor.fetchall()
                results[table] = [dict(row) for row in table_results]
                
            except Exception as e:
                results[table] = f"Error: {str(e)}"
        
        cursor.close()
        conn.close()
        
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

if __name__ == '__main__':
    print("🚀 Iniciando servidor de corrección de API...")
    print("📋 Endpoints disponibles:")
    print("  - GET /api/passenger-trip/<email>")
    print("  - GET /api/test-db-connection")
    print("  - GET /api/debug-passenger-data/<email>")
    
    app.run(host='0.0.0.0', port=5001, debug=True)


from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from pickup_optimization_service import get_trip_data_for_driver, PickupOptimizer
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ================================================
# 🔹 Endpoints de la API
# ================================================

@app.route('/api/trip-optimization/<trip_id>', methods=['GET'])
def get_trip_optimization(trip_id):
    """
    Obtiene la optimización de ruta para un viaje específico
    """
    try:
        trip_type = request.args.get('trip_type', 'ida')  # 'ida' o 'regreso'
        
        # Obtener datos optimizados del viaje
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
    """
    Obtiene un paso específico del viaje optimizado
    """
    try:
        trip_type = request.args.get('trip_type', 'ida')
        
        # Obtener datos del viaje
        trip_data = get_trip_data_for_driver(trip_id, trip_type)
        
        if not trip_data:
            return jsonify({
                'success': False,
                'error': 'Viaje no encontrado'
            }), 404
        
        # Obtener el paso específico
        steps = trip_data.get('optimized_route', {}).get('steps', [])
        
        if step_number >= len(steps):
            return jsonify({
                'success': False,
                'error': 'Paso no encontrado'
            }), 404
        
        step_data = steps[step_number]
        
        # Agregar información adicional para la interfaz
        step_data['is_last_step'] = step_number == len(steps) - 1
        step_data['total_steps'] = len(steps)
        step_data['current_step'] = step_number
        
        return jsonify({
            'success': True,
            'data': step_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/trip-optimization/<trip_id>/next-step', methods=['POST'])
def get_next_step(trip_id):
    """
    Obtiene el siguiente paso del viaje
    """
    try:
        data = request.get_json()
        current_step = data.get('current_step', 0)
        trip_type = data.get('trip_type', 'ida')
        
        # Obtener datos del viaje
        trip_data = get_trip_data_for_driver(trip_id, trip_type)
        
        if not trip_data:
            return jsonify({
                'success': False,
                'error': 'Viaje no encontrado'
            }), 404
        
        steps = trip_data.get('optimized_route', {}).get('steps', [])
        next_step = current_step + 1
        
        if next_step >= len(steps):
            return jsonify({
                'success': False,
                'error': 'No hay más pasos disponibles',
                'trip_completed': True
            }), 404
        
        step_data = steps[next_step]
        step_data['is_last_step'] = next_step == len(steps) - 1
        step_data['total_steps'] = len(steps)
        step_data['current_step'] = next_step
        
        return jsonify({
            'success': True,
            'data': step_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/trip-optimization/<trip_id>/complete-step', methods=['POST'])
def complete_step(trip_id):
    """
    Marca un paso como completado
    """
    try:
        data = request.get_json()
        step_number = data.get('step_number', 0)
        trip_type = data.get('trip_type', 'ida')
        
        # Aquí podrías guardar en la base de datos que el paso fue completado
        # Por ahora solo retornamos éxito
        
        return jsonify({
            'success': True,
            'message': f'Paso {step_number} completado exitosamente'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/trip-optimization/<trip_id>/status', methods=['GET'])
def get_trip_status(trip_id):
    """
    Obtiene el estado actual del viaje
    """
    try:
        trip_type = request.args.get('trip_type', 'ida')
        
        # Obtener datos del viaje
        trip_data = get_trip_data_for_driver(trip_id, trip_type)
        
        if not trip_data:
            return jsonify({
                'success': False,
                'error': 'Viaje no encontrado'
            }), 404
        
        optimized_route = trip_data.get('optimized_route', {})
        
        return jsonify({
            'success': True,
            'data': {
                'trip_id': trip_id,
                'trip_type': trip_type,
                'total_steps': optimized_route.get('total_steps', 0),
                'total_distance_m': optimized_route.get('total_distance_m', 0),
                'total_duration_minutes': optimized_route.get('total_duration_minutes', 0),
                'conductor': trip_data.get('conductor', {}),
                'destination': trip_data.get('destination', '')
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================================
# 🔹 Endpoint de prueba
# ================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Endpoint de salud de la API
    """
    return jsonify({
        'success': True,
        'message': 'API de optimización de rutas funcionando correctamente',
        'timestamp': datetime.now().isoformat()
    })

# ================================================
# 🔹 Manejo de errores
# ================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint no encontrado'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Error interno del servidor'
    }), 500

# ================================================
# 🔹 Inicialización
# ================================================

if __name__ == '__main__':
    print("🚀 Iniciando API de optimización de rutas...")
    print("📡 Endpoints disponibles:")
    print("  - GET  /api/trip-optimization/<trip_id>")
    print("  - GET  /api/trip-optimization/<trip_id>/step/<step_number>")
    print("  - POST /api/trip-optimization/<trip_id>/next-step")
    print("  - POST /api/trip-optimization/<trip_id>/complete-step")
    print("  - GET  /api/trip-optimization/<trip_id>/status")
    print("  - GET  /api/health")
    
    app.run(debug=True, host='0.0.0.0', port=5001)

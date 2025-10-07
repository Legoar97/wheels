import unittest
import os
import sys
import json
from unittest.mock import patch, MagicMock

# Añadir el directorio raíz del proyecto al path para importar módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Importar componentes a probar
from pickup_optimization_service import PickupOptimizer
from auth_service import validate_email, register_user, login_user
from trip_service import create_trip, book_trip, update_available_seats
from matchmaking_service import match_rides_enhanced

class TestWheelsCore(unittest.TestCase):
    """Pruebas unitarias para los componentes principales de Wheels"""
    
    def setUp(self):
        """Configuración inicial para las pruebas"""
        # Configurar datos de prueba
        self.test_user_data = {
            "email": "test_student@universidad.edu.co",
            "password": "Test123!",
            "full_name": "Estudiante Prueba"
        }
        
        self.test_trip_data = {
            "origin_address": "Calle 53 #27-45",
            "origin_lat": 4.63649,
            "origin_lng": -74.08295,
            "destination_address": "Universidad Nacional",
            "destination_lat": 4.63826,
            "destination_lng": -74.08491,
            "available_seats": 3,
            "departure_time": "2025-10-01T07:30:00"
        }
        
        # Mock para respuestas de Supabase
        self.supabase_mock = MagicMock()
        
    @patch('wheels.auth_service.create_client')
    def test_authentication_valid_email(self, mock_create_client):
        """Prueba 1: Validación de correo institucional"""
        # Configurar el mock
        mock_supabase = MagicMock()
        mock_create_client.return_value = mock_supabase
        
        # Casos de prueba
        valid_email = "student@universidad.edu.co"
        invalid_email = "student@gmail.com"
        
        # Verificar validación de correo
        self.assertTrue(validate_email(valid_email))
        self.assertFalse(validate_email(invalid_email))
    
    @patch('wheels.auth_service.create_client')
    def test_user_registration(self, mock_create_client):
        """Prueba 2: Registro de usuario con Supabase"""
        # Configurar el mock
        mock_supabase = MagicMock()
        mock_create_client.return_value = mock_supabase
        mock_supabase.auth.sign_up.return_value = {"user": {"id": "test-uuid"}, "session": {}}
        
        # Ejecutar la función a probar
        result = register_user(
            self.test_user_data["email"], 
            self.test_user_data["password"],
            self.test_user_data["full_name"]
        )
        
        # Verificar resultados
        self.assertTrue(result["success"])
        self.assertEqual(result["user_id"], "test-uuid")
        # Verificar que se llamó a sign_up con los parámetros correctos
        mock_supabase.auth.sign_up.assert_called_once()
    
    @patch('wheels.auth_service.create_client')
    def test_user_registration_duplicate_email(self, mock_create_client):
        """Prueba 3: Manejo de error por correo duplicado"""
        # Configurar el mock para simular error de correo duplicado
        mock_supabase = MagicMock()
        mock_create_client.return_value = mock_supabase
        mock_supabase.auth.sign_up.side_effect = Exception("User already registered")
        
        # Ejecutar la función a probar
        result = register_user(
            self.test_user_data["email"], 
            self.test_user_data["password"],
            self.test_user_data["full_name"]
        )
        
        # Verificar resultados
        self.assertFalse(result["success"])
        self.assertIn("already registered", result["error"])
    
    @patch('wheels.trip_service.create_client')
    def test_trip_creation(self, mock_create_client):
        """Prueba 4: Creación de viaje"""
        # Configurar el mock
        mock_supabase = MagicMock()
        mock_create_client.return_value = mock_supabase
        mock_supabase.table().insert().execute.return_value = {
            "data": [{"id": "trip-123", **self.test_trip_data}]
        }
        
        # Ejecutar la función a probar
        result = create_trip(
            self.test_user_data["email"],
            self.test_trip_data
        )
        
        # Verificar resultados
        self.assertTrue(result["success"])
        self.assertEqual(result["trip_id"], "trip-123")
        # Verificar que se llamó a insert con los datos correctos
        mock_supabase.table.assert_called_once_with("searching_pool")
    
    @patch('wheels.trip_service.create_client')
    def test_trip_booking(self, mock_create_client):
        """Prueba 5: Reserva de viaje"""
        # Configurar el mock
        mock_supabase = MagicMock()
        mock_create_client.return_value = mock_supabase
        mock_supabase.table().insert().execute.return_value = {
            "data": [{"id": "request-123", "trip_id": "trip-123"}]
        }
        
        # Datos de prueba
        trip_id = "trip-123"
        passenger_email = "passenger@universidad.edu.co"
        
        # Ejecutar la función a probar
        result = book_trip(trip_id, passenger_email)
        
        # Verificar resultados
        self.assertTrue(result["success"])
        self.assertEqual(result["request_id"], "request-123")
    
    def test_pickup_optimizer(self):
        """Prueba 6: Algoritmo de optimización de rutas"""
        # Datos de prueba
        conductor_data = {
            "correo": "conductor@universidad.edu.co",
            "direccion_de_viaje": "Calle 53 #27-45"
        }
        pasajeros_data = [
            {
                "correo": "pasajero1@universidad.edu.co",
                "direccion_de_viaje": "Calle 26 #15-72"
            },
            {
                "correo": "pasajero2@universidad.edu.co",
                "direccion_de_viaje": "Carrera 7 #45-51"
            }
        ]
        destination = "Universidad Nacional"
        
        # Crear una instancia de PickupOptimizer con mocks para Google Maps API
        with patch('wheels.pickup_optimization_service.get_distance_duration', return_value=(5000, 600)):
            with patch('wheels.pickup_optimization_service.get_route_optimization', return_value=([0, 1], [])):
                optimizer = PickupOptimizer(api_key="test-key")
                result = optimizer.calculate_optimal_pickup_order(conductor_data, pasajeros_data, destination)
        
        # Verificar resultados
        self.assertEqual(result["trip_type"], "ida")
        self.assertEqual(result["total_steps"], len(pasajeros_data) + 2)  # conductor + pasajeros + destino
        self.assertTrue(isinstance(result["total_distance_m"], (int, float)))
        self.assertTrue(isinstance(result["total_duration_minutes"], (int, float)))
        self.assertEqual(len(result["steps"]), len(pasajeros_data) + 2)

if __name__ == '__main__':
    unittest.main()

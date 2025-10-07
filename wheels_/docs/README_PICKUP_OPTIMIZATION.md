# 🚗 Sistema de Optimización de Rutas para Wheels

## 📋 Descripción

Este sistema integra un algoritmo de optimización de rutas que calcula el orden óptimo de recogida y entrega de pasajeros usando Google Maps API. Proporciona una interfaz intuitiva para el conductor con instrucciones paso a paso.

## 🎯 Características Principales

### ✨ **Algoritmo de Optimización**
- **Google Maps Integration**: Usa Google Maps API para calcular distancias y tiempos reales
- **Optimización de Ruta**: Calcula el orden óptimo de recogida usando `waypoints` y `optimize:true`
- **Dos Modos**: Viaje de ida (recogida) y regreso (entrega)
- **Tiempo Real**: Cálculo de ETA y distancias en tiempo real

### 🖥️ **Interfaz del Conductor**
- **Pantalla Paso a Paso**: Muestra un pasajero a la vez con información completa
- **Botón "Siguiente"**: Navegación fluida entre pasajeros
- **Barra de Progreso**: Visualización del progreso del viaje
- **Información Detallada**: Nombre, dirección, tiempo estimado, distancia
- **Instrucciones Claras**: "Recoge al pasajero X" o "Deja al pasajero X"

### 🔄 **Flujo de Trabajo**

#### **Viaje de Ida (Recogida)**
1. Conductor inicia viaje
2. Sistema calcula orden óptimo de recogida
3. Muestra primer pasajero con instrucciones
4. Conductor presiona "Siguiente" para avanzar
5. Repite hasta recoger todos los pasajeros
6. Muestra "Dirígete hacia la Universidad"

#### **Viaje de Regreso (Entrega)**
1. Conductor inicia viaje de regreso
2. Sistema calcula orden óptimo de entrega
3. Muestra primer pasajero con instrucciones
4. Conductor presiona "Siguiente" para avanzar
5. Repite hasta entregar todos los pasajeros
6. Viaje completado

## 🛠️ **Instalación y Configuración**

### **1. Dependencias Python**
```bash
# Instalar dependencias
pip install -r requirements_pickup_optimization.txt

# O instalar manualmente
pip install flask flask-cors pandas requests supabase python-dotenv
```

### **2. Configuración de Google Maps API**
```python
# En pickup_optimization_service.py
GOOGLE_MAPS_API_KEY = "TU_API_KEY_AQUI"
```

### **3. Configuración de Supabase**
```python
# En pickup_optimization_service.py
url = "https://tu-proyecto.supabase.co"
key = "tu-service-role-key"
```

### **4. Iniciar Servidor Python**
```bash
# Opción 1: Script automático
python start_pickup_optimization_api.py

# Opción 2: Manual
python pickup_optimization_api.py
```

### **5. Instalar Dependencias Frontend**
```bash
# Instalar nueva dependencia
npm install @radix-ui/react-progress

# O instalar todas las dependencias
npm install
```

## 📁 **Estructura de Archivos**

```
wheels/
├── pickup_optimization_service.py      # Algoritmo de optimización
├── pickup_optimization_api.py          # API Flask
├── start_pickup_optimization_api.py    # Script de inicio
├── requirements_pickup_optimization.txt # Dependencias Python
├── src/
│   ├── services/
│   │   └── pickupOptimizationService.js # Servicio frontend
│   ├── hooks/
│   │   └── useDriverPickup.js          # Hook personalizado
│   ├── components/
│   │   ├── screens/
│   │   │   └── DriverPickupScreen.jsx  # Pantalla del conductor
│   │   └── ui/
│   │       ├── progress.jsx            # Componente Progress
│   │       └── badge.jsx               # Componente Badge
└── README_PICKUP_OPTIMIZATION.md       # Esta documentación
```

## 🔌 **API Endpoints**

### **Obtener Optimización de Viaje**
```http
GET /api/trip-optimization/{trip_id}?trip_type=ida
```

### **Obtener Paso Específico**
```http
GET /api/trip-optimization/{trip_id}/step/{step_number}?trip_type=ida
```

### **Obtener Siguiente Paso**
```http
POST /api/trip-optimization/{trip_id}/next-step
Content-Type: application/json

{
  "current_step": 0,
  "trip_type": "ida"
}
```

### **Completar Paso**
```http
POST /api/trip-optimization/{trip_id}/complete-step
Content-Type: application/json

{
  "step_number": 0,
  "trip_type": "ida"
}
```

### **Obtener Estado del Viaje**
```http
GET /api/trip-optimization/{trip_id}/status?trip_type=ida
```

## 💻 **Uso en el Frontend**

### **1. Importar el Servicio**
```javascript
import { pickupOptimizationService } from '@/services/pickupOptimizationService';
```

### **2. Usar el Hook**
```javascript
import { useDriverPickup } from '@/hooks/useDriverPickup';

const { 
  currentStep, 
  tripData, 
  loading, 
  goToNextStep, 
  completeTrip 
} = useDriverPickup(tripId, 'ida');
```

### **3. Usar el Componente**
```javascript
import DriverPickupScreen from '@/components/screens/DriverPickupScreen';

<DriverPickupScreen 
  tripId={tripId}
  tripType="ida"
  onBack={() => navigate('/app')}
  onTripComplete={() => navigate('/app')}
/>
```

## 🔧 **Configuración Avanzada**

### **Personalizar Algoritmo de Optimización**
```python
# En pickup_optimization_service.py
class PickupOptimizer:
    def __init__(self, api_key, max_distance_km=5):
        self.api_key = api_key
        self.max_distance_km = max_distance_km
```

### **Personalizar Interfaz**
```javascript
// En DriverPickupScreen.jsx
const customInstructions = {
  'pickup': 'Recoge al pasajero {nombre}',
  'dropoff': 'Deja al pasajero {nombre} en {direccion}',
  'destination': 'Dirígete hacia {destino}'
};
```

## 📊 **Estructura de Datos**

### **Respuesta de Optimización**
```json
{
  "trip_id": "12345",
  "trip_type": "ida",
  "conductor": {
    "correo": "conductor@email.com",
    "nombre": "Juan Pérez",
    "direccion": "Calle 123 #45-67"
  },
  "destination": "Universidad Nacional",
  "optimized_route": {
    "total_steps": 4,
    "total_distance_m": 15000,
    "total_duration_minutes": 25.5,
    "steps": [
      {
        "step": 0,
        "type": "conductor",
        "instruction": "Punto de inicio del conductor",
        "direccion": "Calle 123 #45-67",
        "eta_minutes": 0
      },
      {
        "step": 1,
        "type": "pickup",
        "instruction": "Recoge al pasajero 1",
        "nombre": "María García",
        "direccion": "Calle 456 #78-90",
        "eta_minutes": 8.5
      }
    ]
  }
}
```

## 🚨 **Solución de Problemas**

### **Error de Conexión a Google Maps**
```bash
# Verificar API key
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=test&destinations=test&key=TU_API_KEY"
```

### **Error de Conexión a Supabase**
```python
# Verificar credenciales
from supabase import create_client
supabase = create_client(url, key)
print(supabase.table('profiles').select('*').limit(1).execute())
```

### **Error de Dependencias Frontend**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 🔄 **Flujo de Integración con el Sistema Existente**

### **1. Modificar MatchmakingScreen.jsx**
```javascript
// Después de que el conductor presiona "Iniciar Viaje"
const handleStartTrip = async () => {
  // ... código existente ...
  
  // Redirigir a la pantalla de optimización
  navigate(`/driver-pickup/${tripDataId}?type=ida`);
};
```

### **2. Agregar Ruta en App.jsx**
```javascript
import DriverPickupScreen from '@/components/screens/DriverPickupScreen';

// En las rutas
<Route path="/driver-pickup/:tripId" element={<DriverPickupScreen />} />
```

### **3. Modificar LiveTripScreen.jsx**
```javascript
// Agregar botón para optimización de ruta
<Button onClick={() => navigate(`/driver-pickup/${tripId}?type=ida`)}>
  Optimizar Ruta
</Button>
```

## 📈 **Métricas y Monitoreo**

### **Logs del Sistema**
```python
# Los logs se muestran en la consola del servidor Python
print(f"✅ Archivo creado: {output_file}")
print(f"🔍 Procesando viaje {trip_id} ({trip_type})...")
```

### **Métricas de Rendimiento**
- Tiempo de cálculo de optimización
- Distancia total del viaje
- Tiempo total estimado
- Número de pasajeros procesados

## 🎉 **¡Sistema Listo!**

El sistema de optimización de rutas está completamente integrado y listo para usar. Proporciona:

- ✅ Algoritmo de optimización con Google Maps
- ✅ Interfaz intuitiva para el conductor
- ✅ Navegación paso a paso
- ✅ Soporte para viajes de ida y regreso
- ✅ API REST completa
- ✅ Integración con el sistema existente

**¡Disfruta de la nueva funcionalidad de optimización de rutas!** 🚗✨

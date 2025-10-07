# 🗺️ Google Maps Python Analyzer

## 📋 Descripción

Herramienta completa para analizar direcciones usando las APIs de Google Maps en Python. Incluye geocodificación, cálculo de distancias, búsqueda de lugares y análisis en lote.

## 🚀 Características

### ✅ **APIs Implementadas**
- **Geocoding API** - Convertir direcciones a coordenadas
- **Distance Matrix API** - Calcular distancias y tiempos
- **Places API** - Buscar lugares específicos
- **Directions API** - Obtener rutas detalladas

### ✅ **Funcionalidades**
- 🔍 **Geocodificación** - Direcciones → Coordenadas
- 🗺️ **Geocodificación inversa** - Coordenadas → Direcciones
- 📏 **Cálculo de distancias** - Con información de tráfico
- 🔍 **Búsqueda de lugares** - Restaurantes, hospitales, etc.
- 🧭 **Direcciones detalladas** - Rutas paso a paso
- 📊 **Análisis en lote** - Múltiples direcciones
- 🗺️ **Matriz de distancias** - Entre múltiples puntos
- 💾 **Cache inteligente** - Evita llamadas repetidas

## 🔧 Instalación

### 1. **Instalar Dependencias**
```bash
pip install -r requirements_google_maps.txt
```

### 2. **Configurar API Key**
```bash
# Copiar archivo de ejemplo
cp env_google_maps_example.txt .env

# Editar .env y agregar tu API key
GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 3. **Obtener API Key de Google Maps**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - ✅ **Geocoding API**
   - ✅ **Distance Matrix API**
   - ✅ **Places API**
   - ✅ **Directions API**
4. Ve a **Credenciales** → **Crear credenciales** → **Clave de API**
5. Copia tu API key

## 📖 Uso Básico

### **Ejemplo 1: Geocodificación**
```python
from google_maps_python_analyzer import GoogleMapsAnalyzer

# Crear analizador
analyzer = GoogleMapsAnalyzer()

# Geocodificar dirección
result = analyzer.geocode_address("Universidad Externado de Colombia, Bogotá")
print(f"Coordenadas: {result['lat']}, {result['lng']}")
```

### **Ejemplo 2: Cálculo de Distancia**
```python
# Calcular distancia entre dos puntos
distance = analyzer.calculate_distance(
    "Universidad Externado de Colombia, Bogotá",
    "Centro Comercial Santafé, Bogotá"
)
print(f"Distancia: {distance['distance_text']}")
print(f"Tiempo: {distance['duration_text']}")
```

### **Ejemplo 3: Búsqueda de Lugares**
```python
# Buscar restaurantes
places = analyzer.search_places("restaurantes", "Bogotá, Colombia")
for place in places:
    print(f"📍 {place['name']} - ⭐ {place['rating']}")
```

### **Ejemplo 4: Análisis en Lote**
```python
# Analizar múltiples direcciones
addresses = [
    "Universidad Externado de Colombia, Bogotá",
    "Centro Comercial Santafé, Bogotá",
    "Aeropuerto El Dorado, Bogotá"
]

df = analyzer.analyze_addresses_batch(addresses)
print(df.to_string())
```

### **Ejemplo 5: Matriz de Distancias**
```python
# Calcular distancias entre múltiples puntos
origins = ["Universidad Externado de Colombia, Bogotá"]
destinations = ["Centro Comercial Santafé, Bogotá", "Aeropuerto El Dorado, Bogotá"]

matrix = analyzer.calculate_distances_matrix(origins, destinations)
print(matrix.to_string())
```

## 🎯 Casos de Uso

### **1. Análisis de Ubicaciones**
- Geocodificar direcciones de clientes
- Analizar distribución geográfica
- Validar direcciones

### **2. Optimización de Rutas**
- Calcular distancias entre múltiples puntos
- Encontrar la ruta más corta
- Considerar tráfico en tiempo real

### **3. Búsqueda de Lugares**
- Encontrar restaurantes cerca
- Localizar servicios específicos
- Analizar competencia

### **4. Análisis de Datos**
- Procesar grandes volúmenes de direcciones
- Generar reportes geográficos
- Crear mapas de calor

## 📊 Ejemplos de Salida

### **Geocodificación**
```json
{
  "address": "Universidad Externado de Colombia, Bogotá",
  "formatted_address": "Universidad Externado de Colombia, Cl. 12 #1-17 Este, Bogotá, Colombia",
  "lat": 4.6097102,
  "lng": -74.0817534,
  "place_id": "ChIJ...",
  "types": ["university", "establishment"],
  "status": "OK"
}
```

### **Cálculo de Distancia**
```json
{
  "origin": "Universidad Externado de Colombia, Bogotá",
  "destination": "Centro Comercial Santafé, Bogotá",
  "distance_km": 8.5,
  "distance_text": "8.5 km",
  "duration_minutes": 25,
  "duration_text": "25 mins",
  "duration_in_traffic_minutes": 35,
  "duration_in_traffic_text": "35 mins",
  "mode": "driving",
  "status": "OK"
}
```

## ⚙️ Configuración Avanzada

### **Variables de Entorno**
```bash
# Tiempo de espera para requests
API_REQUEST_TIMEOUT=30

# Delay entre requests (para evitar límites)
RATE_LIMIT_DELAY=0.1

# Tiempo de expiración del cache
CACHE_EXPIRY_HOURS=1
```

### **Modos de Transporte**
- `driving` - Conduciendo (por defecto)
- `walking` - Caminando
- `bicycling` - En bicicleta
- `transit` - Transporte público

## 💰 Costos Estimados

### **APIs de Google Maps (2024)**
- **Geocoding**: $5 por 1,000 requests
- **Distance Matrix**: $5 por 1,000 requests
- **Places**: $17 por 1,000 requests
- **Directions**: $5 por 1,000 requests

### **Ejemplo de Uso**
```
1,000 direcciones analizadas = ~$32
10,000 direcciones analizadas = ~$320
```

## 🚨 Límites y Consideraciones

### **Límites de Rate**
- **Geocoding**: 50 requests/segundo
- **Distance Matrix**: 100 requests/segundo
- **Places**: 1,000 requests/día (gratuito)

### **Mejores Prácticas**
- ✅ Usar cache para evitar llamadas repetidas
- ✅ Implementar delays entre requests
- ✅ Manejar errores y reintentos
- ✅ Monitorear uso de cuota

## 🔧 Solución de Problemas

### **Error: "API key no configurada"**
```bash
# Verificar variable de entorno
echo $GOOGLE_MAPS_API_KEY

# O verificar archivo .env
cat .env | grep GOOGLE_MAPS
```

### **Error: "REQUEST_DENIED"**
- Verificar que la API key sea correcta
- Asegurarse de que las APIs estén habilitadas
- Verificar restricciones de la API key

### **Error: "OVER_QUERY_LIMIT"**
- Verificar límites en Google Cloud Console
- Implementar delays entre requests
- Considerar actualizar plan de facturación

## 📁 Archivos del Proyecto

```
google_maps_python_analyzer.py    # Clase principal
config_google_maps.py            # Configuración
ejemplo_uso_google_maps.py       # Ejemplos de uso
requirements_google_maps.txt     # Dependencias
env_google_maps_example.txt      # Variables de entorno
README_GOOGLE_MAPS_PYTHON.md     # Esta documentación
```

## 🎯 Ejecutar Ejemplos

```bash
# Ejecutar todos los ejemplos
python ejemplo_uso_google_maps.py

# Ejecutar analizador básico
python google_maps_python_analyzer.py
```

## 📞 Soporte

Si tienes problemas:
1. Verifica que tu API key esté configurada correctamente
2. Asegúrate de que las APIs estén habilitadas en Google Cloud Console
3. Revisa los logs de error para más detalles
4. Consulta la documentación oficial de Google Maps APIs

---

**¡Listo para analizar direcciones con Google Maps! 🗺️**

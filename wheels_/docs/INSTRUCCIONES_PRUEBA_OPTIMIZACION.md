# 🚀 Instrucciones para Probar el Sistema de Optimización

## 📋 Pasos para Configurar y Probar

### **1. Instalar Dependencias Python**

```bash
# Instalar las dependencias necesarias
pip install flask flask-cors pandas requests supabase python-dotenv

# O usar el archivo de requirements
pip install -r requirements_pickup_optimization.txt
```

### **2. Iniciar el Servidor Python**

**Opción A: Script automático (Windows)**
```bash
# Doble clic en el archivo
start_optimization_server.bat
```

**Opción B: Script automático (Linux/Mac)**
```bash
# Hacer ejecutable y ejecutar
chmod +x start_optimization_server.sh
./start_optimization_server.sh
```

**Opción C: Manual**
```bash
python pickup_optimization_api.py
```

### **3. Verificar que el Servidor Esté Funcionando**

Abre tu navegador y ve a: `http://localhost:5001/api/health`

Deberías ver una respuesta como:
```json
{
  "success": true,
  "message": "API de optimización de rutas funcionando correctamente",
  "timestamp": "2024-01-XX..."
}
```

### **4. Instalar Dependencias Frontend**

```bash
# Instalar la nueva dependencia
npm install @radix-ui/react-progress

# O reinstalar todas las dependencias
npm install
```

### **5. Iniciar la Aplicación Frontend**

```bash
npm run dev
```

## 🧪 **Proceso de Prueba**

### **Paso 1: Crear un Viaje como Conductor**

1. Inicia sesión como conductor
2. Ve a "Crear Viaje" o "Panel de Viaje"
3. Completa los datos del viaje:
   - Dirección de recogida
   - Destino (ej: "Universidad Nacional")
   - Fecha y hora
   - Precio por asiento
   - Número de asientos disponibles

### **Paso 2: Crear Solicitudes como Pasajeros**

1. En otra pestaña o dispositivo, inicia sesión como pasajero
2. Busca viajes disponibles
3. Solicita el viaje del conductor
4. El conductor debería ver la solicitud

### **Paso 3: Aceptar Solicitudes (Conductor)**

1. Como conductor, deberías ver:
   - Lista de pasajeros asignados
   - Botón "Iniciar Viaje Optimizado"
2. Haz clic en "Iniciar Viaje Optimizado"

### **Paso 4: Ver la Optimización de Rutas**

1. Deberías ver la pantalla de optimización con:
   - Información del primer pasajero a recoger
   - Dirección de recogida
   - Tiempo estimado de llegada
   - Botón "Siguiente"

2. Haz clic en "Siguiente" para ver el siguiente pasajero
3. Continúa hasta recoger todos los pasajeros
4. Al final verás "Dirígete hacia la Universidad"

## 🔧 **Solución de Problemas**

### **Error: "Servidor de optimización no disponible"**

**Causa:** El servidor Python no está corriendo

**Solución:**
1. Verifica que el servidor esté corriendo en `http://localhost:5001`
2. Revisa la consola del servidor Python para errores
3. Asegúrate de que las dependencias estén instaladas

### **Error: "No se pudieron obtener los participantes"**

**Causa:** No hay datos en la tabla `start_of_trip`

**Solución:**
1. Verifica que el viaje se haya creado correctamente
2. Revisa que haya pasajeros asignados
3. Verifica la conexión a Supabase

### **Error: "Google Maps API key not found"**

**Causa:** La API key de Google Maps no está configurada

**Solución:**
1. Edita `pickup_optimization_service.py`
2. Reemplaza `GOOGLE_MAPS_API_KEY` con tu clave real
3. Reinicia el servidor Python

### **Pantalla en blanco o error de carga**

**Causa:** Error en el frontend o servidor

**Solución:**
1. Abre las herramientas de desarrollador (F12)
2. Revisa la consola para errores
3. Verifica que el servidor esté respondiendo
4. Revisa la red para peticiones fallidas

## 📊 **Verificación del Funcionamiento**

### **1. Verificar Servidor Python**
```bash
curl http://localhost:5001/api/health
```

### **2. Verificar Base de Datos**
```sql
-- Verificar que hay datos en start_of_trip
SELECT * FROM start_of_trip ORDER BY created_at DESC LIMIT 5;

-- Verificar que hay viajes confirmados
SELECT * FROM confirmed_trips ORDER BY created_at DESC LIMIT 5;
```

### **3. Verificar Frontend**
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Network"
3. Busca peticiones a `localhost:5001`
4. Verifica que no haya errores 404 o 500

## 🎯 **Flujo Esperado**

### **Para el Conductor:**
1. ✅ Ve "Buscando pasajeros compatibles..." inicialmente
2. ✅ Ve "¡Pasajeros Asignados!" cuando hay pasajeros
3. ✅ Ve lista de pasajeros con sus direcciones
4. ✅ Ve botón "Iniciar Viaje Optimizado"
5. ✅ Ve pantalla de optimización con primer pasajero
6. ✅ Puede navegar con botón "Siguiente"
7. ✅ Ve "Dirígete hacia la Universidad" al final

### **Para el Pasajero:**
1. ✅ Ve "Buscando conductores disponibles..." inicialmente
2. ✅ Ve conductores disponibles cuando los hay
3. ✅ Puede solicitar viaje
4. ✅ Ve "Esperando confirmación del conductor..."
5. ✅ Ve información del conductor cuando es aceptado

## 🚨 **Si Algo No Funciona**

1. **Revisa la consola del navegador** para errores JavaScript
2. **Revisa la consola del servidor Python** para errores
3. **Verifica la conexión a Supabase** en la pestaña Network
4. **Asegúrate de que el servidor Python esté corriendo** en puerto 5001
5. **Verifica que las dependencias estén instaladas** correctamente

## 📞 **Soporte**

Si encuentras problemas:

1. **Revisa los logs** en la consola del navegador y del servidor
2. **Verifica la configuración** de Google Maps API
3. **Comprueba la conexión** a Supabase
4. **Asegúrate de que todos los servicios** estén corriendo

---

**¡El sistema de optimización de rutas está listo para usar!** 🎉

Sigue estos pasos y deberías ver la nueva funcionalidad funcionando correctamente en tu aplicación.

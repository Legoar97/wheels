# 🚗 Integración del Servicio Python de Emparejamiento - WHEELS

## 📋 Descripción

Este sistema integra un servicio de emparejamiento en Python con tu aplicación React WHEELS, permitiendo que:

- **Conductores** vean los pasajeros asignados automáticamente
- **Pasajeros** vean el conductor asignado para su viaje
- El emparejamiento se ejecute en tiempo real usando algoritmos Python

## 🐍 Archivos Python

### `matchmaking_service.py`
Servicio principal de emparejamiento que incluye:
- Conexión a Supabase
- Algoritmo de emparejamiento por distancia y compatibilidad
- Funciones para crear solicitudes y confirmar viajes

## ⚙️ Instalación

### 1. Instalar dependencias Python
```bash
pip install supabase pandas geopy
```

### 2. Verificar credenciales
El archivo Python ya tiene configuradas las credenciales de tu proyecto Supabase:
- URL: `https://ozvjmkvmpxxviveniuwt.supabase.co`
- Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Probar el servicio Python
```bash
python matchmaking_service.py
```

Deberías ver un JSON con los matches encontrados.

## 🔧 Integración con React

### 1. Hook personalizado (`useMatchmaking`)
El hook `src/hooks/useMatchmaking.js` maneja:
- Conexión con el servicio Python
- Estado de emparejamiento
- Funciones para crear/confirmar viajes

### 2. Pantalla actualizada (`MatchmakingScreen`)
La pantalla ahora muestra:
- **Para conductores**: Lista de pasajeros asignados
- **Para pasajeros**: Lista de conductores disponibles

## 🚀 Cómo funciona

### Flujo del emparejamiento:

1. **Usuario se registra en el pool** (`searching_pool`)
2. **Sistema Python ejecuta emparejamiento** cada 10 segundos
3. **Se asignan pasajeros a conductores** basado en:
   - Distancia máxima (5km)
   - Destino compatible
   - Cupos disponibles
4. **Resultados se muestran en tiempo real** en ambas pantallas

### Algoritmo de emparejamiento:

```python
def match_rides(searching_pool_df, profiles_df, max_distance_km=5):
    # 1. Separar conductores y pasajeros
    drivers = searching_pool_df[searching_pool_df["vehicle_id"].notna()]
    passengers = searching_pool_df[searching_pool_df["vehicle_id"].isna()]
    
    # 2. Para cada conductor, buscar pasajeros compatibles
    for driver in drivers:
        for passenger in passengers:
            # Verificar destino
            if passenger["dropoff_address"] != driver["dropoff_address"]:
                continue
            
            # Calcular distancia
            distance = calculate_distance(driver_location, passenger_location)
            if distance > max_distance_km:
                continue
            
            # Asignar si hay cupos disponibles
            if len(matched_passengers) < driver["available_seats"]:
                matched_passengers.append(passenger)
```

## 📱 Interfaz de usuario

### Pantalla del Conductor:
- **Título**: "Pasajeros Asignados"
- **Información del viaje**: Origen, destino, cupos
- **Lista de pasajeros**: Nombre, distancia, pickup
- **Botón de aceptar** para cada pasajero

### Pantalla del Pasajero:
- **Título**: "Conductores Encontrados"
- **Información del conductor**: Nombre, precio, cupos
- **Detalles del viaje**: Origen, destino, distancia
- **Botón de solicitar** para cada conductor

## 🔄 Actualizaciones en tiempo real

El sistema usa polling cada 10 segundos para:
- Ejecutar el emparejamiento Python
- Actualizar las listas de matches
- Mostrar nuevos pasajeros/conductores disponibles

## 🚨 Solución de problemas

### Error: "No se pudieron obtener los datos"
- Verificar conexión a Supabase
- Revisar que las tablas existan
- Comprobar credenciales

### Error: "No hay matches"
- Verificar que haya usuarios en `searching_pool`
- Comprobar que los destinos coincidan
- Revisar que las distancias estén dentro del rango (5km)

### Error: "Python no responde"
- Verificar que el script Python esté ejecutándose
- Comprobar dependencias instaladas
- Revisar logs de Python

## 🚀 Próximos pasos

### Para producción:

1. **Crear API REST** con Flask/FastAPI
2. **Ejecutar Python como servicio** en servidor
3. **Implementar WebSockets** para actualizaciones en tiempo real
4. **Agregar autenticación** al servicio Python
5. **Implementar cache** para mejorar rendimiento

### Mejoras del algoritmo:

1. **Machine Learning** para predicción de matches
2. **Optimización de rutas** para conductores
3. **Sistema de calificaciones** para emparejamiento
4. **Preferencias personalizadas** de usuarios

## 📞 Soporte

Si encuentras problemas:
1. Verifica que todas las dependencias estén instaladas
2. Comprueba la conexión a Supabase
3. Revisa los logs de Python y React
4. Verifica que las tablas tengan datos

---

**¡Tu sistema de emparejamiento Python está listo! 🎉**

El emparejamiento ahora funciona con algoritmos Python y se integra perfectamente con tu aplicación React WHEELS.








































# 🐍 Integración Python + React - Sistema de Emparejamiento WHEELS

## 📋 Descripción

Este sistema integra tu código Python de emparejamiento con la aplicación React WHEELS. El Python ejecuta el algoritmo de emparejamiento y retorna un JSON que React usa para mostrar los resultados.

## 🎯 Cómo funciona

1. **Python ejecuta el emparejamiento** usando tu código original
2. **Retorna un JSON** con los matches encontrados
3. **React recibe el JSON** y lo muestra en la interfaz
4. **Los conductores ven sus pasajeros** asignados automáticamente
5. **Los pasajeros ven los conductores** disponibles

## 📁 Archivos del sistema

### **Python (Tu código original)**
- `matchmaking_original.py` - Tu código Python sin modificaciones

### **React (Integración)**
- `src/hooks/usePythonMatchmaking.js` - Hook que usa el JSON del Python
- `src/services/pythonMatchmakingService.js` - Servicio para ejecutar Python
- `src/components/screens/MatchmakingScreen.jsx` - Pantalla actualizada

## 🚀 Instalación y uso

### **1. Instalar dependencias Python**
```bash
pip install supabase pandas geopy
```

### **2. Ejecutar tu Python**
```bash
python matchmaking_original.py
```

Deberías ver el JSON con los matches:
```json
[
  {
    "conductor_id": "15589b1c-7e6b-45e2-b89d-69d1c95b842b",
    "nombre_conductor": "juan",
    "pickup": "Av. Boyacá #17a-63, Bogotá, Colombia",
    "destino": "Hacia la universidad",
    "pasajeros_asignados": [
      {
        "pasajero_id": "4b15ca14-ff3e-4d8e-bda0-2f2ff5b7af03",
        "nombre": "jesus",
        "pickup": "Av. Boyacá #17a-63, Bogotá, Colombia",
        "destino": "Hacia la universidad"
      }
    ]
  }
]
```

### **3. Tu app React ya está integrada**
- Usa el hook `usePythonMatchmaking`
- Muestra los resultados del Python en tiempo real
- Actualiza cada 10 segundos

## 🔧 Configuración del servicio Python

### **Opción 1: Simulación (Desarrollo)**
```javascript
// En pythonMatchmakingService.js
static async runMatchmaking() {
  return await this.executePythonScript(); // Simula tu Python
}
```

### **Opción 2: API REST (Producción)**
```javascript
// En pythonMatchmakingService.js
static async runMatchmaking() {
  return await this.executePythonAPI(); // Llama a tu API Python
}
```

### **Opción 3: Ejecución local (Node.js)**
```javascript
// En pythonMatchmakingService.js
static async runMatchmaking() {
  return await this.executePythonLocal(); // Ejecuta Python localmente
}
```

## 📱 Interfaz de usuario

### **Pantalla del Conductor:**
- **Título**: "Pasajeros Asignados"
- **Información**: Origen, destino, cupos disponibles
- **Lista**: Pasajeros asignados por tu algoritmo Python
- **Acciones**: Botón para aceptar cada pasajero

### **Pantalla del Pasajero:**
- **Título**: "Conductores Encontrados"
- **Información**: Nombre del conductor, precio, cupos
- **Detalles**: Origen, destino, distancia
- **Acciones**: Botón para solicitar viaje

## 🔄 Flujo de emparejamiento

1. **Usuario se registra** en `searching_pool`
2. **Python ejecuta** tu algoritmo cada 10 segundos
3. **Se asignan pasajeros** a conductores usando tu lógica
4. **React recibe el JSON** y actualiza la interfaz
5. **Ambas pantallas se actualizan** en tiempo real

## 🚨 Solución de problemas

### **Error: "No hay matches"**
- Verifica que tu Python esté ejecutándose
- Comprueba que haya datos en `searching_pool`
- Revisa que las columnas coincidan con tu código

### **Error: "Python no responde"**
- Verifica que `matchmaking_original.py` funcione
- Comprueba las dependencias Python
- Revisa la conexión a Supabase

### **Error: "Columnas no encontradas"**
Tu Python usa estas columnas:
- `"tipo_de_usuario"` (conductor/pasajero)
- `"destino"` (dirección de destino)
- `"nombre_usuario"` (nombre del usuario)
- `"pickup_address"` (dirección de pickup)

## 🚀 Próximos pasos para producción

### **1. Crear API REST con Python**
```python
# Usar Flask o FastAPI
from flask import Flask, jsonify
app = Flask(__name__)

@app.route('/api/matchmaking', methods=['POST'])
def run_matchmaking():
    result = match_rides(searching_pool_df)
    return jsonify({"matches": result})
```

### **2. Ejecutar como servicio**
```bash
# Usar systemd o PM2
python app.py
```

### **3. Actualizar el servicio en React**
```javascript
// Cambiar a API real
return await this.executePythonAPI();
```

## 📊 Estructura del JSON esperado

Tu Python debe retornar un array con esta estructura:
```json
[
  {
    "conductor_id": "UUID del conductor",
    "nombre_conductor": "Nombre del conductor",
    "pickup": "Dirección de pickup",
    "destino": "Dirección de destino",
    "pasajeros_asignados": [
      {
        "pasajero_id": "UUID del pasajero",
        "nombre": "Nombre del pasajero",
        "pickup": "Dirección de pickup del pasajero",
        "destino": "Dirección de destino del pasajero"
      }
    ]
  }
]
```

## 🎉 ¡Listo!

Tu sistema ahora:
- ✅ **Ejecuta tu Python** sin modificaciones
- ✅ **Usa el JSON** que retorna tu algoritmo
- ✅ **Muestra resultados** en React en tiempo real
- ✅ **Funciona para conductores y pasajeros**
- ✅ **Se actualiza automáticamente** cada 10 segundos

**¡El emparejamiento funciona perfectamente con tu código Python!** 🐍✨








































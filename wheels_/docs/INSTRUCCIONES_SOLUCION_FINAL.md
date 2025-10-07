# 🚀 Solución Final - Incluye `price_per_seat` para Conductores

## 📋 Problema Resuelto

✅ **Problema**: Usuario creó viaje como conductor pero aparece como pasajero
✅ **Solución**: Nueva lógica que considera `price_per_seat` para determinar tipo de usuario

## 🎯 Nueva Lógica de Conductor

### **Se considera CONDUCTOR si:**
1. **Tiene `vehicle_id`** (vehículo seleccionado), O
2. **Tiene `price_per_seat > 0`** (precio por asiento mayor a 0)

### **Se considera PASAJERO si:**
- No tiene `vehicle_id` Y `price_per_seat` es 0 o NULL

## 🔧 Pasos para Aplicar la Solución

### **Paso 1: Aplicar el Trigger Mejorado**
```sql
-- En Supabase SQL Editor
solucion_completa_viajes_mejorada.sql
```

### **Paso 2: Corregir Datos Existentes**
```sql
-- En Supabase SQL Editor
corregir_datos_con_price_per_seat.sql
```

### **Paso 3: Verificar la Solución**
```sql
-- En Supabase SQL Editor
probar_nuevo_trigger.sql
```

## 📱 Cómo Usar el Frontend Mejorado

### **1. Función Simplificada**
```javascript
const crearViaje = async (userData, tripData) => {
  const viajeData = {
    driver_id: userData.id,
    pickup_address: tripData.pickupAddress,
    dropoff_address: tripData.dropoffAddress,
    trip_datetime: tripData.tripDateTime || null,
    status: 'searching'
  };

  // NUEVA LÓGICA: Si es conductor, agregar precio
  if (tripData.isDriver) {
    if (tripData.vehicleId) {
      viajeData.vehicle_id = tripData.vehicleId;
    }
    // IMPORTANTE: El precio determina que es conductor
    viajeData.price_per_seat = tripData.pricePerSeat || 0;
    viajeData.available_seats = tripData.availableSeats || 4;
  } else {
    // Si es pasajero
    viajeData.available_seats = 1;
    viajeData.price_per_seat = 0;
  }

  const { data, error } = await supabase
    .from('searching_pool')
    .insert([viajeData])
    .select();

  return data;
};
```

### **2. Componente React**
```jsx
const CrearViajeComponent = () => {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    dropoffAddress: '',
    tripDateTime: '',
    destino: '',
    isDriver: false,
    vehicleId: null,
    pricePerSeat: 0, // IMPORTANTE: Este campo determina si es conductor
    availableSeats: 4,
    maxDetourKm: 5.0
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos básicos */}
      <input 
        value={formData.pickupAddress}
        onChange={(e) => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
        placeholder="Dirección de origen"
        required
      />
      
      <input 
        value={formData.dropoffAddress}
        onChange={(e) => setFormData(prev => ({ ...prev, dropoffAddress: e.target.value }))}
        placeholder="Dirección de destino"
        required
      />

      {/* Tipo de usuario */}
      <div>
        <label>
          <input 
            type="radio" 
            checked={!formData.isDriver}
            onChange={() => setFormData(prev => ({ 
              ...prev, 
              isDriver: false,
              pricePerSeat: 0,
              availableSeats: 1
            }))}
          />
          Pasajero
        </label>
        <label>
          <input 
            type="radio" 
            checked={formData.isDriver}
            onChange={() => setFormData(prev => ({ 
              ...prev, 
              isDriver: true,
              availableSeats: 4
            }))}
          />
          Conductor
        </label>
      </div>

      {/* Campos específicos para conductores */}
      {formData.isDriver && (
        <div>
          {/* Vehículo (opcional) */}
          <select 
            value={formData.vehicleId || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
          >
            <option value="">Selecciona tu vehículo (opcional)</option>
            {/* Cargar vehículos del usuario */}
          </select>

          {/* Precio por asiento (OBLIGATORIO para conductores) */}
          <input 
            type="number"
            min="0"
            step="0.01"
            value={formData.pricePerSeat}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              pricePerSeat: parseFloat(e.target.value) || 0 
            }))}
            placeholder="Precio por asiento"
            required={formData.isDriver}
          />
          <small>Este campo determina que eres conductor</small>
        </div>
      )}

      <button type="submit">Crear Viaje</button>
    </form>
  );
};
```

## ✅ Resultado Esperado

### **Después de aplicar la solución:**

1. **Al crear un viaje como conductor:**
   - `tipo_de_usuario` = `'conductor'`
   - `price_per_seat` = valor proporcionado (mayor a 0)
   - `vehicle_id` = ID del vehículo (si se seleccionó)
   - `available_seats` = 4 (por defecto)

2. **Al crear un viaje como pasajero:**
   - `tipo_de_usuario` = `'pasajero'`
   - `price_per_seat` = 0
   - `vehicle_id` = NULL
   - `available_seats` = 1

3. **Datos automáticos:**
   - `nombre_usuario` = Nombre del perfil del usuario
   - `correo_usuario` = Email del perfil del usuario
   - `hora_viaje` = Fecha/hora del viaje o actual
   - `destino` = Se determina automáticamente o valor seleccionado

## 🔄 Flujo de Trabajo Mejorado

### **1. Usuario crea viaje desde frontend**
- Llena direcciones (obligatorio)
- Selecciona tipo de usuario (pasajero/conductor)
- Si es conductor:
  - Selecciona vehículo (opcional)
  - **Establece precio por asiento (obligatorio)**
- Selecciona destino (opcional)

### **2. Frontend envía INSERT**
- Incluye datos básicos
- Incluye `price_per_seat` si es conductor
- Incluye `vehicle_id` si se seleccionó vehículo

### **3. Trigger se ejecuta automáticamente**
- Determina `tipo_de_usuario` basándose en `vehicle_id` O `price_per_seat > 0`
- Llena `nombre_usuario` y `correo_usuario` desde `profiles`
- Determina `destino` si no se proporcionó
- Establece valores por defecto

### **4. Registro se guarda completo**
- Todas las columnas llenas
- Datos consistentes
- Listo para emparejamiento

## 🚨 Solución de Problemas

### **Error: "Usuario conductor aparece como pasajero"**
- Verifica que `price_per_seat > 0` en el INSERT
- Verifica que el trigger esté activo
- Ejecuta el script de corrección de datos

### **Error: "No se reconoce como conductor"**
- Asegúrate de que el frontend envíe `price_per_seat` para conductores
- Verifica que el valor sea mayor a 0
- Revisa los logs de Supabase

## 📞 Verificación Final

### **Consulta para verificar que funciona:**
```sql
-- Verificar viajes recién creados
SELECT 
    id,
    driver_id,
    vehicle_id,
    price_per_seat,
    tipo_de_usuario,
    nombre_usuario,
    correo_usuario,
    destino,
    pickup_address,
    status,
    created_at
FROM searching_pool
ORDER BY created_at DESC
LIMIT 5;
```

### **Resultado esperado:**
- `tipo_de_usuario` debe coincidir con la lógica nueva
- `price_per_seat > 0` para conductores
- `nombre_usuario` y `correo_usuario` deben estar llenos
- `destino` debe tener un valor válido

## 🎉 Beneficios de la Nueva Solución

1. **Más flexible**: No requiere vehículo para ser conductor
2. **Más intuitivo**: El precio indica claramente que es conductor
3. **Más robusto**: Múltiples indicadores para determinar tipo de usuario
4. **Mejor UX**: Los usuarios pueden ser conductores sin registrar vehículo

---

**¡Con esta solución, los conductores se identificarán correctamente usando `price_per_seat`! 🚗✨**




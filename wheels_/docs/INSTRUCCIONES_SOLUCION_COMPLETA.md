# 🚀 Solución Completa para Extracción de Datos en Viajes

## 📋 Problema Identificado

Los datos no se extraen automáticamente cuando se crea un viaje:
1. **`tipo_de_usuario` siempre aparece como "pasajero"**
2. **`destino` siempre está vacío**
3. **El trigger no funciona correctamente**

## 🔧 Solución Paso a Paso

### **Paso 1: Diagnosticar el Problema**
1. Ve a **Supabase** → **SQL Editor**
2. Ejecuta: `diagnostico_completo_viajes.sql`
3. Revisa los resultados para entender el estado actual

### **Paso 2: Aplicar la Solución Completa**
1. Ejecuta: `solucion_completa_viajes.sql`
2. Este script:
   - Elimina el trigger y función existentes
   - Crea una nueva función mejorada
   - Crea un nuevo trigger activo
   - Verifica que todo esté funcionando

### **Paso 3: Corregir Datos Existentes**
1. Ejecuta: `corregir_datos_existentes_completo.sql`
2. Este script:
   - Corrige `tipo_de_usuario` basándose en `vehicle_id`
   - Llena columnas faltantes
   - Establece valores por defecto
   - Corrige la columna `destino`

### **Paso 4: Verificar la Solución**
1. Ejecuta: `probar_nuevo_trigger.sql`
2. Verifica que:
   - El trigger esté activo
   - Los datos estén corregidos
   - La lógica funcione correctamente

## 🎯 Qué Hace el Nuevo Trigger

### **1. Extrae Datos Automáticamente**
```sql
-- Obtiene información del usuario desde profiles
SELECT p.full_name, p.email INTO NEW.nombre_usuario, NEW.correo_usuario
FROM profiles p WHERE p.id = NEW.driver_id;

-- Determina tipo_de_usuario basándose en vehicle_id
IF NEW.vehicle_id IS NOT NULL THEN
    NEW.tipo_de_usuario := 'conductor';
ELSE
    NEW.tipo_de_usuario := 'pasajero';
END IF;
```

### **2. Maneja la Columna Destino**
```sql
-- Si no se proporciona desde el frontend, intenta determinarlo automáticamente
IF NEW.destino IS NULL OR NEW.destino = '' THEN
    IF NEW.pickup_address ILIKE '%universidad%' THEN
        NEW.destino := 'Desde la universidad';
    ELSIF NEW.dropoff_address ILIKE '%universidad%' THEN
        NEW.destino := 'Hacia la universidad';
    ELSE
        NEW.destino := 'Por definir';
    END IF;
END IF;
```

### **3. Establece Valores por Defecto**
- `hora_viaje` ← `trip_datetime` o hora actual
- `status` ← `'searching'`
- `available_seats` ← 4 (conductor) o 1 (pasajero)
- `price_per_seat` ← 0
- `max_detour_km` ← 5.0

## 📱 Cómo Usar el Frontend

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

  // Si es conductor, agregar vehicle_id
  if (tripData.isDriver && tripData.vehicleId) {
    viajeData.vehicle_id = tripData.vehicleId;
  }

  // El destino es opcional - el trigger lo manejará
  if (tripData.destino) {
    viajeData.destino = tripData.destino;
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
    destino: '', // OPCIONAL
    isDriver: false,
    vehicleId: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    const result = await crearViaje(user, formData);
    
    console.log('Viaje creado:', result);
  };

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

      {/* Destino (opcional) */}
      <select 
        value={formData.destino}
        onChange={(e) => setFormData(prev => ({ ...prev, destino: e.target.value }))}
      >
        <option value="">Selecciona destino (opcional)</option>
        <option value="Hacia la universidad">Hacia la universidad</option>
        <option value="Desde la universidad">Desde la universidad</option>
      </select>

      {/* Tipo de usuario */}
      <div>
        <label>
          <input 
            type="radio" 
            checked={!formData.isDriver}
            onChange={() => setFormData(prev => ({ ...prev, isDriver: false }))}
          />
          Pasajero
        </label>
        <label>
          <input 
            type="radio" 
            checked={formData.isDriver}
            onChange={() => setFormData(prev => ({ ...prev, isDriver: true }))}
          />
          Conductor
        </label>
      </div>

      {/* Vehículo (solo para conductores) */}
      {formData.isDriver && (
        <select 
          value={formData.vehicleId || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
        >
          <option value="">Selecciona tu vehículo</option>
          {/* Cargar vehículos del usuario */}
        </select>
      )}

      <button type="submit">Crear Viaje</button>
    </form>
  );
};
```

## ✅ Resultado Esperado

### **Después de aplicar la solución:**

1. **Al crear un viaje como pasajero:**
   - `tipo_de_usuario` = `'pasajero'`
   - `vehicle_id` = `NULL`
   - `destino` = Se determina automáticamente o el valor seleccionado

2. **Al crear un viaje como conductor:**
   - `tipo_de_usuario` = `'conductor'`
   - `vehicle_id` = ID del vehículo seleccionado
   - `destino` = Se determina automáticamente o el valor seleccionado

3. **Datos automáticos:**
   - `nombre_usuario` = Nombre del perfil del usuario
   - `correo_usuario` = Email del perfil del usuario
   - `hora_viaje` = Fecha/hora del viaje o actual
   - `status` = `'searching'`
   - `available_seats` = 4 (conductor) o 1 (pasajero)

## 🔄 Flujo de Trabajo

### **1. Usuario crea viaje desde frontend**
- Llena direcciones (obligatorio)
- Selecciona tipo de usuario (pasajero/conductor)
- Selecciona destino (opcional)
- Si es conductor, selecciona vehículo

### **2. Frontend envía INSERT**
- Incluye datos básicos
- Incluye `vehicle_id` si es conductor
- Incluye `destino` si se seleccionó

### **3. Trigger se ejecuta automáticamente**
- Llena `tipo_de_usuario` basándose en `vehicle_id`
- Llena `nombre_usuario` y `correo_usuario` desde `profiles`
- Determina `destino` si no se proporcionó
- Establece valores por defecto

### **4. Registro se guarda completo**
- Todas las columnas llenas
- Datos consistentes
- Listo para emparejamiento

## 🚨 Solución de Problemas

### **Error: "Trigger no se ejecuta"**
```sql
-- Verificar que el trigger esté activo
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_searching_pool_user_info';
```

### **Error: "tipo_de_usuario sigue siendo 'pasajero'"**
- Verifica que `vehicle_id` no sea NULL
- Asegúrate de que el usuario tenga un vehículo registrado
- Verifica que el `vehicle_id` pertenezca al usuario

### **Error: "destino sigue vacío"**
- El trigger intenta determinarlo automáticamente
- Si no puede, establece "Por definir"
- Puedes proporcionarlo desde el frontend

## 📞 Verificación Final

### **Consulta para verificar que funciona:**
```sql
-- Verificar viajes recién creados
SELECT 
    id,
    driver_id,
    vehicle_id,
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
- `tipo_de_usuario` debe coincidir con `vehicle_id`
- `nombre_usuario` y `correo_usuario` deben estar llenos
- `destino` debe tener un valor válido
- Todos los campos deben estar completos

---

**¡Con esta solución, los datos se extraerán automáticamente cada vez que se cree un viaje! 🎉**




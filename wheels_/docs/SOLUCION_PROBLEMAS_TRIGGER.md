# 🔧 Solución para Problemas del Trigger en `searching_pool`

## 📋 Problemas Identificados

1. **Columna `destino` siempre vacía** - El trigger no la llena automáticamente
2. **Siempre aparece "pasajero"** - La lógica del trigger no funciona correctamente
3. **Trigger no se ejecuta** - Posible problema en la configuración

## 🔍 Diagnóstico del Problema

### Paso 1: Ejecutar Diagnóstico
1. Ve a **Supabase** → **SQL Editor**
2. Ejecuta el archivo `diagnosticar_problemas_trigger.sql`
3. Revisa los resultados para identificar el problema

### Paso 2: Verificar Estado del Trigger
El script te mostrará:
- Si el trigger existe y está activo
- Si la función del trigger existe
- El estado actual de los datos
- Registros con problemas

## 🔧 Solución Paso a Paso

### Paso 1: Corregir el Trigger
1. En el SQL Editor, ejecuta `corregir_trigger_searching_pool.sql`
2. Este script:
   - Elimina el trigger y función existentes
   - Crea una nueva función corregida
   - Crea un nuevo trigger activo

### Paso 2: Corregir Datos Existentes
1. Ejecuta `corregir_datos_existentes.sql`
2. Este script:
   - Corrige `tipo_de_usuario` basándose en `vehicle_id`
   - Actualiza columnas faltantes
   - Establece valor por defecto para `destino`

### Paso 3: Verificar la Solución
1. Ejecuta `probar_nuevo_trigger.sql`
2. Verifica que:
   - El trigger esté activo
   - Los datos estén corregidos
   - La lógica funcione correctamente

## 🎯 Qué Hace el Nuevo Trigger

### 1. **Determina `tipo_de_usuario` Correctamente**
```sql
IF NEW.vehicle_id IS NOT NULL THEN
    NEW.tipo_de_usuario := 'conductor';
ELSE
    NEW.tipo_de_usuario := 'pasajero';
END IF;
```

### 2. **Llena Columnas Automáticamente**
- `nombre_usuario` ← `profiles.full_name`
- `correo_usuario` ← `profiles.email`
- `hora_viaje` ← `trip_datetime` o hora actual
- `tipo_de_usuario` ← Calculado desde `vehicle_id`

### 3. **Maneja la Columna `destino`**
- **NO se llena automáticamente** (debe venir del frontend)
- Se establece valor por defecto si está vacía
- Valida que sea uno de los valores permitidos

## 📱 Cambios Necesarios en el Frontend

### 1. **Columna `destino` es Obligatoria**
```javascript
// Validar que se proporcione el destino
if (!tripData.destino || tripData.destino === '') {
  throw new Error('El destino es obligatorio');
}

// Validar valores permitidos
const destinosPermitidos = ['Hacia la universidad', 'Desde la universidad'];
if (!destinosPermitidos.includes(tripData.destino)) {
  throw new Error('Destino debe ser "Hacia la universidad" o "Desde la universidad"');
}
```

### 2. **Enviar `destino` en el INSERT**
```javascript
const { data, error } = await supabase
  .from('searching_pool')
  .insert([
    {
      // ... otros campos
      destino: tripData.destino // OBLIGATORIO
    }
  ])
  .select();
```

### 3. **Componente Selector de Destino**
```jsx
<DestinoSelector
  onDestinoChange={handleDestinoChange}
  selectedDestino={formData.destino}
  required={true}
/>
```

## ✅ Verificación de Éxito

### Después de aplicar la solución:

1. **Trigger activo**: Debe aparecer en `information_schema.triggers`
2. **Función creada**: Debe aparecer en `information_schema.routines`
3. **Datos corregidos**: 
   - `tipo_de_usuario` debe coincidir con `vehicle_id`
   - `destino` no debe estar vacío
4. **Nuevos registros**: Deben llenarse automáticamente

### Consultas de verificación:
```sql
-- Verificar trigger activo
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_searching_pool_user_info';

-- Verificar datos corregidos
SELECT 
    tipo_de_usuario,
    CASE WHEN vehicle_id IS NOT NULL THEN 'conductor' ELSE 'pasajero' END as tipo_calculado,
    COUNT(*) as cantidad
FROM searching_pool
GROUP BY tipo_de_usuario, vehicle_id IS NOT NULL;
```

## 🚨 Solución de Problemas

### Error: "Trigger no se ejecuta"
- Verifica que el trigger esté activo
- Asegúrate de que la función no tenga errores
- Revisa los logs de Supabase

### Error: "tipo_de_usuario sigue siendo 'pasajero'"
- Verifica que `vehicle_id` no sea NULL
- Asegúrate de que el usuario tenga un vehículo registrado
- Revisa la lógica del trigger

### Error: "destino sigue vacío"
- **La columna `destino` debe ser proporcionada desde el frontend**
- El trigger no la llena automáticamente
- Verifica que se envíe en el INSERT

## 🔄 Flujo Correcto

### 1. **Usuario crea viaje desde frontend**
- Selecciona destino obligatoriamente
- Marca si es conductor o pasajero
- Proporciona información del viaje

### 2. **Frontend envía INSERT a Supabase**
- Incluye `destino` en los datos
- Incluye `vehicle_id` si es conductor
- Incluye otros campos del viaje

### 3. **Trigger se ejecuta automáticamente**
- Llena `tipo_de_usuario` basándose en `vehicle_id`
- Llena `nombre_usuario` y `correo_usuario` desde `profiles`
- Establece `hora_viaje`

### 4. **Registro se guarda con todas las columnas llenas**

## 📞 Si Algo Sale Mal

1. **Revisa los logs** en Supabase → Logs
2. **Ejecuta el diagnóstico** con `diagnosticar_problemas_trigger.sql`
3. **Verifica la estructura** de la tabla
4. **Prueba el trigger** con un INSERT manual

---

**¡Con esta solución, el trigger debería funcionar correctamente y llenar automáticamente `tipo_de_usuario` basándose en si el usuario tiene vehículo o no! 🎉**




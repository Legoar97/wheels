# 🚗 Modificación de la Tabla `searching_pool` en WHEELS

## 📋 Resumen de Cambios

Se van a agregar las siguientes columnas a la tabla `searching_pool`:

1. **`tipo_de_usuario`** (TEXT) - Indica si es 'conductor' o 'pasajero'
2. **`nombre_usuario`** (TEXT) - Nombre completo del usuario
3. **`correo_usuario`** (TEXT) - Correo electrónico del usuario
4. **`hora_viaje`** (TIMESTAMP WITH TIME ZONE) - Hora específica del viaje
5. **`destino`** (TEXT) - Indica si es 'Hacia la universidad' o 'Desde la universidad'

## 🔧 Pasos para Aplicar los Cambios

### Paso 1: Acceder a Supabase
1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Selecciona tu proyecto WHEELS
3. Ve a la sección **SQL Editor** en el menú lateral

### Paso 2: Verificar y Agregar Columna Email a Profiles
1. En el SQL Editor, crea una nueva consulta
2. Copia y pega todo el contenido del archivo `fix_profiles_email_column.sql`
3. Haz clic en **Run** para ejecutar el script

### Paso 3: Ejecutar la Modificación de la Tabla
1. En el SQL Editor, crea una nueva consulta
2. Copia y pega todo el contenido del archivo `modify_searching_pool_table_safe.sql`
3. Haz clic en **Run** para ejecutar el script

### Paso 4: Actualizar las Funciones SQL
1. Crea otra nueva consulta en el SQL Editor
2. Copia y pega todo el contenido del archivo `update_functions_with_new_columns_safe.sql`
3. Haz clic en **Run** para ejecutar el script

### Paso 5: Corregir Tipo de Usuario en Registros Existentes
1. Crea una nueva consulta en el SQL Editor
2. Copia y pega todo el contenido del archivo `fix_existing_tipo_usuario.sql`
3. Haz clic en **Run** para ejecutar el script

### Paso 6: Verificar los Cambios
1. Crea una nueva consulta en el SQL Editor
2. Copia y pega todo el contenido del archivo `test_new_columns.sql`
3. Haz clic en **Run** para verificar que todo funciona correctamente

## 📊 Estructura Final de la Tabla

Después de los cambios, la tabla `searching_pool` tendrá esta estructura:

```sql
CREATE TABLE searching_pool (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES auth.users(id),
    vehicle_id UUID REFERENCES vehicles(id),
    pickup_address TEXT,
    dropoff_address TEXT,
    pickup_lat DECIMAL,
    pickup_lng DECIMAL,
    dropoff_lat DECIMAL,
    dropoff_lng DECIMAL,
    trip_datetime TIMESTAMP WITH TIME ZONE,
    available_seats INTEGER,
    price_per_seat DECIMAL,
    status TEXT DEFAULT 'searching',
    max_detour_km DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- NUEVAS COLUMNAS
    tipo_de_usuario TEXT,
    nombre_usuario TEXT,
    correo_usuario TEXT,
    hora_viaje TIMESTAMP WITH TIME ZONE,
    destino TEXT
);
```

## 🔄 Funcionamiento del Trigger

Se ha creado un trigger automático que:

- **Se ejecuta**: Antes de cada INSERT en la tabla `searching_pool`
- **Función**: `update_searching_pool_user_info()`
- **Acciones**:
  - Determina `tipo_de_usuario` basándose en `vehicle_id` (conductor si tiene vehículo, pasajero si no)
  - Obtiene `nombre_usuario` desde `profiles.full_name`
  - Obtiene `correo_usuario` desde `profiles.email`
  - Establece `hora_viaje` como `trip_datetime` o la hora actual si es inmediato
  - La columna `destino` debe ser proporcionada desde el frontend

## 📈 Funciones Actualizadas

Las siguientes funciones han sido actualizadas para incluir las nuevas columnas:

1. **`diagnose_searching_pool()`** - Diagnóstico del pool de búsqueda
2. **`find_matches_in_pool_with_distance()`** - Búsqueda de conductores para pasajeros
3. **`find_nearby_passengers()`** - Búsqueda de pasajeros para conductores
4. **`find_matches_in_pool()`** - Búsqueda general de matches

## 🧪 Cómo Probar los Cambios

### Opción 1: Usar el Script de Prueba
Ejecuta el archivo `test_new_columns.sql` para verificar que todo funciona.

### Opción 2: Probar Manualmente
1. Ve a tu aplicación WHEELS
2. Registra un nuevo usuario o usa uno existente
3. Crea un viaje como conductor o pasajero
4. Verifica en la tabla `searching_pool` que las nuevas columnas se llenan automáticamente

### Opción 3: Consulta Directa
```sql
-- Verificar la estructura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'searching_pool' 
ORDER BY ordinal_position;

-- Ver datos con nuevas columnas
SELECT 
    tipo_de_usuario,
    nombre_usuario,
    correo_usuario,
    hora_viaje,
    destino,
    pickup_address,
    status
FROM searching_pool
ORDER BY created_at DESC
LIMIT 5;
```

## ⚠️ Consideraciones Importantes

### 1. Datos Existentes
- Si ya tienes datos en la tabla `searching_pool`, el script los actualizará automáticamente
- Los registros existentes tendrán las nuevas columnas llenas con la información de los usuarios
- La columna `destino` quedará como NULL en registros existentes y debe ser llenada manualmente o desde el frontend

### 2. Columna Destino
- La columna `destino` debe ser proporcionada desde el frontend al crear nuevos registros
- Los valores válidos son: 'Hacia la universidad' y 'Desde la universidad'
- Se incluye un archivo de ejemplo `ejemplo_uso_destino_frontend.js` con componentes React

### 3. Compatibilidad
- Las funciones existentes seguirán funcionando
- El frontend no necesita cambios inmediatos
- Las nuevas columnas son opcionales para consultas existentes

### 4. Rendimiento
- El trigger agrega un pequeño overhead en los INSERTs
- Es mínimo y no afectará el rendimiento de la aplicación

## 🔍 Verificación de Éxito

Después de ejecutar todos los scripts, deberías ver:

1. ✅ Las nuevas columnas en la tabla `searching_pool`
2. ✅ El trigger `trigger_update_searching_pool_user_info` creado
3. ✅ Las funciones actualizadas funcionando correctamente
4. ✅ Los datos existentes actualizados con la nueva información

## 🚨 Solución de Problemas

### Error: "permission denied for table users"
- **Causa**: El trigger intenta acceder a `auth.users` que tiene restricciones de permisos
- **Solución**: Se ha modificado el trigger para usar solo la tabla `profiles` con una columna `email`
- **Prevención**: Ejecuta primero `fix_profiles_email_column.sql` para agregar la columna email a profiles

### Error: "Column already exists"
- Algunas columnas ya podrían existir
- El script usa `ADD COLUMN IF NOT EXISTS` para evitar errores

### Error: "Function already exists"
- Las funciones se actualizan con `CREATE OR REPLACE`
- No debería haber problemas

### Error: "Trigger already exists"
- El trigger se recrea automáticamente
- No debería haber problemas

### Error: "cannot change return type of existing function"
- **Causa**: PostgreSQL no permite cambiar el tipo de retorno de una función existente
- **Solución**: Se ha creado `update_functions_with_new_columns_safe.sql` que elimina las funciones antes de recrearlas
- **Prevención**: Usa siempre el script "safe" para actualizar funciones

## 📞 Soporte

Si encuentras algún problema:

1. Revisa los logs en **Logs** del proyecto Supabase
2. Verifica que todos los scripts se ejecuten sin errores
3. Asegúrate de que las extensiones `uuid-ossp` estén habilitadas

---

**¡Las modificaciones están listas para implementar! 🎉**

# Solución al Problema de Emparejamiento

## Problema Identificado

El emparejamiento no funcionaba porque:

1. **Error de columna ambigua**: Las funciones SQL tenían referencias ambiguas a la columna `id` en los JOINs
2. **Status incorrecto**: La función `add_to_searching_pool` no establecía el status como 'searching'
3. **Lógica de identificación de roles**: Las funciones verificaban `user_type` en lugar de usar solo `vehicle_id`

## Cambios Realizados

### 1. Corregir referencias ambiguas en `distance_matching.sql`
- Cambié `WHERE id = requesting_pool_id` por `WHERE searching_pool.id = requesting_pool_id`
- Cambié `WHERE id = driver_pool_id` por `WHERE searching_pool.id = driver_pool_id`

### 2. Corregir referencias ambiguas en `matchmaking_functions.sql`
- Cambié todas las referencias `id` por `tabla.id` para evitar ambigüedad
- Ejemplo: `WHERE id = request_id_param` → `WHERE trip_requests.id = request_id_param`

### 3. Simplificar lógica de identificación de roles
- **Antes**: Verificaba `p.user_type = 'conductor'` y `p.user_type = 'pasajero'`
- **Ahora**: Solo usa `vehicle_id IS NOT NULL` para conductores y `vehicle_id IS NULL` para pasajeros

### 4. Corregir función `add_to_searching_pool` en `database_setup.sql`
- Agregué el campo `status` con valor 'searching' en el INSERT
- Corregí la referencia ambigua en `accept_trip_request`

### 5. Agregar función de diagnóstico
- Creé `diagnose_searching_pool()` para verificar el estado del pool

## Instrucciones para Aplicar la Solución

### Paso 1: Ejecutar los archivos SQL corregidos
1. Ve al panel de administración de Supabase
2. Ve a la sección "SQL Editor"
3. Ejecuta los siguientes archivos en este orden:
   - `distance_matching.sql`
   - `matchmaking_functions.sql`
   - `database_setup.sql`

### Paso 2: Verificar que las funciones se crearon correctamente
```sql
-- Verificar que las funciones existen
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'find_matches_in_pool_with_distance',
    'find_nearby_passengers',
    'diagnose_searching_pool',
    'add_to_searching_pool'
);
```

### Paso 3: Diagnosticar el estado actual
```sql
-- Ver el estado actual del pool de búsqueda
SELECT * FROM diagnose_searching_pool();
```

### Paso 4: Probar el emparejamiento
1. Crea un conductor y un pasajero con direcciones cercanas
2. Verifica que ambos aparecen en el diagnóstico
3. Prueba las funciones de emparejamiento

## Cómo Funciona Ahora

### Para Pasajeros (buscan conductores):
1. El pasajero se registra en `searching_pool` con `vehicle_id = NULL`
2. La función `find_matches_in_pool_with_distance` busca conductores con `vehicle_id IS NOT NULL`
3. Filtra por distancia y otros criterios

### Para Conductores (buscan pasajeros):
1. El conductor se registra en `searching_pool` con `vehicle_id = UUID del vehículo`
2. La función `find_nearby_passengers` busca pasajeros con `vehicle_id IS NULL`
3. Filtra por distancia y otros criterios

## Verificación

Para verificar que todo funciona:

1. **Ejecuta el script de prueba**: `test_matching.sql`
2. **Verifica en la aplicación**: 
   - Un conductor debería ver pasajeros cercanos
   - Un pasajero debería ver conductores disponibles
3. **Revisa los logs**: No deberían aparecer errores de columna ambigua

## Notas Importantes

- Las funciones ahora usan solo `vehicle_id` para identificar roles
- El status debe ser 'searching' para que aparezcan en los resultados
- La distancia máxima por defecto es 5km
- Los conductores deben tener un vehículo activo registrado

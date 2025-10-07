-- =====================================================
-- RECUPERACIÓN COMPLETA DE PROFILES BORRADOS
-- =====================================================

-- ⚠️ IMPORTANTE: Ejecutar este script en orden para recuperar los perfiles

-- PASO 1: Diagnosticar el problema
SELECT '=== PASO 1: DIAGNÓSTICO ===' as info;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_usuarios_auth,
    (SELECT COUNT(*) FROM profiles) as total_perfiles,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) as usuarios_sin_perfil;

-- Mostrar usuarios sin perfil
SELECT '=== USUARIOS SIN PERFIL ===' as info;
SELECT 
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- PASO 2: Recrear perfiles faltantes
SELECT '=== PASO 2: RECREANDO PERFILES ===' as info;

-- Crear perfiles faltantes
INSERT INTO profiles (id, full_name, email, user_type, avatar_url, rating, total_trips, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(
        u.raw_user_meta_data->>'full_name', 
        'Usuario ' || SUBSTRING(u.email FROM 1 FOR POSITION('@' IN u.email) - 1)
    ) as full_name,
    u.email,
    'pasajero' as user_type,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    0 as rating,
    0 as total_trips,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
AND u.email IS NOT NULL;

-- PASO 3: Verificar que se crearon los perfiles
SELECT '=== PASO 3: VERIFICACIÓN DE PERFILES CREADOS ===' as info;
SELECT 
    id,
    full_name,
    email,
    user_type,
    created_at
FROM profiles
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- PASO 4: Limpiar registros huérfanos en searching_pool
SELECT '=== PASO 4: LIMPIANDO REGISTROS HUÉRFANOS ===' as info;

-- Contar registros huérfanos
SELECT 
    COUNT(*) as registros_huérfanos_a_eliminar
FROM searching_pool sp
LEFT JOIN profiles p ON sp.driver_id = p.id
WHERE p.id IS NULL;

-- Eliminar registros huérfanos
DELETE FROM searching_pool 
WHERE driver_id IN (
    SELECT sp.driver_id
    FROM searching_pool sp
    LEFT JOIN profiles p ON sp.driver_id = p.id
    WHERE p.id IS NULL
);

-- PASO 5: Verificación final
SELECT '=== PASO 5: VERIFICACIÓN FINAL ===' as info;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_usuarios_auth,
    (SELECT COUNT(*) FROM profiles) as total_perfiles,
    (SELECT COUNT(*) FROM searching_pool) as total_registros_searching_pool,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) as usuarios_sin_perfil,
    (SELECT COUNT(*) FROM searching_pool sp LEFT JOIN profiles p ON sp.driver_id = p.id WHERE p.id IS NULL) as registros_huérfanos;

-- Mostrar todos los perfiles recuperados
SELECT '=== TODOS LOS PERFILES ===' as info;
SELECT 
    id,
    full_name,
    email,
    user_type,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- PASO 6: Actualizar registros en searching_pool con las nuevas columnas
SELECT '=== PASO 6: ACTUALIZANDO REGISTROS EN SEARCHING_POOL ===' as info;

-- Actualizar registros existentes con las nuevas columnas
UPDATE searching_pool 
SET 
    tipo_de_usuario = CASE 
        WHEN searching_pool.vehicle_id IS NOT NULL THEN 'conductor'
        ELSE 'pasajero'
    END,
    nombre_usuario = p.full_name,
    correo_usuario = p.email,
    hora_viaje = COALESCE(searching_pool.trip_datetime, searching_pool.created_at)
FROM profiles p
WHERE searching_pool.driver_id = p.id
AND (searching_pool.tipo_de_usuario IS NULL 
     OR searching_pool.nombre_usuario IS NULL 
     OR searching_pool.correo_usuario IS NULL 
     OR searching_pool.hora_viaje IS NULL);

-- Mostrar algunos registros actualizados
SELECT '=== REGISTROS ACTUALIZADOS ===' as info;
SELECT 
    id,
    driver_id,
    tipo_de_usuario,
    nombre_usuario,
    correo_usuario,
    hora_viaje,
    destino,
    status
FROM searching_pool
ORDER BY created_at DESC
LIMIT 5;

SELECT '=== ¡RECUPERACIÓN COMPLETADA! ===' as info;




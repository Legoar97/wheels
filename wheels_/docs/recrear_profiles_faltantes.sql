-- =====================================================
-- RECREAR PROFILES FALTANTES
-- =====================================================

-- 1. Crear perfiles faltantes para usuarios que existen en auth.users
-- pero no tienen perfil en la tabla profiles
INSERT INTO profiles (id, full_name, email, user_type, avatar_url, rating, total_trips, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Usuario ' || SUBSTRING(u.email FROM 1 FOR POSITION('@' IN u.email) - 1)) as full_name,
    u.email,
    'pasajero' as user_type, -- Por defecto como pasajero
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    0 as rating,
    0 as total_trips,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
AND u.email IS NOT NULL;

-- 2. Verificar que se crearon los perfiles
SELECT '=== PERFILES CREADOS ===' as info;
SELECT 
    id,
    full_name,
    email,
    user_type,
    created_at
FROM profiles
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 3. Verificar que ya no hay usuarios sin perfil
SELECT '=== VERIFICACIÓN FINAL ===' as info;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_usuarios_auth,
    (SELECT COUNT(*) FROM profiles) as total_perfiles,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) as usuarios_sin_perfil;

-- 4. Mostrar todos los perfiles actualizados
SELECT '=== TODOS LOS PERFILES ===' as info;
SELECT 
    id,
    full_name,
    email,
    user_type,
    created_at
FROM profiles
ORDER BY created_at DESC;




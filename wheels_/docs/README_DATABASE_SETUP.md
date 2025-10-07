# 🚗 Configuración de Base de Datos para WHEELS - Aplicación de Movilidad Compartida

## 📋 Pasos para Configurar tu Base de Datos en Supabase

### 1. Acceder a tu Proyecto de Supabase
1. Ve a [supabase.com](https://supabase.com) y inicia sesión
2. Selecciona tu proyecto: `ozvjmkvmtpxxvivwenuwt`
3. Ve a la sección **SQL Editor** en el menú lateral

### 2. Ejecutar el Script de Configuración
1. En el SQL Editor, crea una nueva consulta
2. Copia y pega todo el contenido del archivo `database_setup.sql`
3. Haz clic en **Run** para ejecutar el script

### 3. Verificar la Creación de Tablas
Después de ejecutar el script, deberías ver las siguientes tablas en **Table Editor**:

#### 📊 Tablas Principales:
- **`profiles`** - Perfiles de usuarios
- **`vehicles`** - Vehículos de conductores
- **`searching_pool`** - Pool de conductores buscando pasajeros
- **`trip_requests`** - Solicitudes de viaje
- **`confirmed_trips`** - Viajes confirmados
- **`reviews`** - Reseñas y calificaciones
- **`notifications`** - Notificaciones del sistema
- **`payments`** - Registro de pagos
- **`trip_history`** - Historial de viajes

### 4. Configurar Storage para Avatares
1. Ve a **Storage** en el menú lateral
2. Verifica que se haya creado el bucket `avatars`
3. El bucket debe estar configurado como público

### 5. Verificar las Políticas de Seguridad (RLS)
1. Ve a **Authentication > Policies**
2. Verifica que todas las tablas tengan RLS habilitado
3. Las políticas deben estar configuradas correctamente

### 6. Probar la Configuración
1. Ve a **Authentication > Users**
2. Crea un usuario de prueba
3. Verifica que se cree automáticamente un perfil en la tabla `profiles`

## 🔧 Funciones y Procedimientos Almacenados

El script crea las siguientes funciones:

- **`find_matches_in_pool()`** - Encuentra conductores disponibles para un pasajero
- **`create_trip_request()`** - Crea una solicitud de viaje
- **`update_updated_at_column()`** - Actualiza automáticamente timestamps
- **`handle_new_user()`** - Crea perfil automáticamente al registrar usuario

## 🚨 Solución de Problemas Comunes

### Error: "Extension postgis does not exist"
- Ve a **Settings > Extensions**
- Habilita la extensión `postgis`

### Error: "Function uuid_generate_v4() does not exist"
- Ve a **Settings > Extensions**
- Habilita la extensión `uuid-ossp`

### Error: "Bucket avatars does not exist"
- Ve a **Storage**
- Crea manualmente el bucket `avatars` como público

### Error: "insert or update on table 'profiles' violates foreign key constraint"
- **Causa**: Intentaste insertar datos de prueba con UUIDs que no existen en `auth.users`
- **Solución**: 
  1. Ejecuta solo el script principal `database_setup.sql` (sin datos de prueba)
  2. Registra usuarios reales desde tu aplicación
  3. Los perfiles se crearán automáticamente
  4. Si necesitas datos de prueba, usa `insert_test_data.sql` después de tener usuarios reales

## 📱 Próximos Pasos

1. **Probar la autenticación** en tu aplicación
2. **Verificar que se creen perfiles** automáticamente
3. **Probar la subida de avatares** al storage
4. **Verificar las consultas** de matchmaking

## 🔒 Seguridad

- Todas las tablas tienen **Row Level Security (RLS)** habilitado
- Las políticas están configuradas para que los usuarios solo vean sus propios datos
- El bucket de avatares es público para lectura pero privado para escritura

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs en **Logs** del proyecto
2. Verifica que todas las extensiones estén habilitadas
3. Asegúrate de que el script se ejecute completamente sin errores

---

**¡Tu base de datos está lista para usar! 🎉**

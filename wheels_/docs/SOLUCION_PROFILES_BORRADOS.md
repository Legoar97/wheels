# 🚨 Solución para Profiles Borrados por Error

## 📋 Problema Identificado

Has borrado 2 perfiles de la tabla `profiles` por error, pero los usuarios siguen existiendo en `auth.users`. Esto causa:

1. **Inconsistencia de datos**: Usuarios en `auth.users` sin perfil correspondiente
2. **Errores en la aplicación**: Los triggers y funciones fallan al no encontrar perfiles
3. **Registros huérfanos**: Datos en `searching_pool` que referencian usuarios inexistentes

## 🔧 Solución Paso a Paso

### Paso 1: Diagnosticar el Problema

1. Ve a **Supabase** → **SQL Editor**
2. Ejecuta el archivo `diagnosticar_profiles_borrados.sql`
3. Revisa los resultados para confirmar cuántos usuarios están sin perfil

### Paso 2: Recuperación Completa (RECOMENDADO)

**Opción más segura**: Ejecuta el archivo `recuperar_profiles_completo.sql`

Este script hace todo automáticamente:
- ✅ Diagnostica el problema
- ✅ Recrea los perfiles faltantes
- ✅ Limpia registros huérfanos
- ✅ Actualiza las nuevas columnas
- ✅ Verifica que todo esté correcto

### Paso 3: Verificación Manual

Después de ejecutar el script, verifica que:

```sql
-- Debería mostrar 0 usuarios sin perfil
SELECT COUNT(*) as usuarios_sin_perfil
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Debería mostrar 0 registros huérfanos
SELECT COUNT(*) as registros_huérfanos
FROM searching_pool sp
LEFT JOIN profiles p ON sp.driver_id = p.id
WHERE p.id IS NULL;
```

## 🎯 Qué Hace el Script de Recuperación

### 1. **Recrea Perfiles Faltantes**
- Usa los datos de `auth.users` para recrear perfiles
- Genera nombres automáticamente basándose en el email
- Establece `user_type = 'pasajero'` por defecto
- Mantiene la fecha de creación original

### 2. **Limpia Registros Huérfanos**
- Elimina registros en `searching_pool` que no tienen perfil asociado
- Previene errores futuros en la aplicación

### 3. **Actualiza Nuevas Columnas**
- Llena las columnas `tipo_de_usuario`, `nombre_usuario`, `correo_usuario`, `hora_viaje`
- Aplica la lógica correcta para determinar tipo de usuario

## ⚠️ Consideraciones Importantes

### Datos Recuperados
- **Nombres**: Se generan automáticamente desde el email si no hay metadata
- **Tipo de usuario**: Se establece como 'pasajero' por defecto
- **Rating y viajes**: Se inician en 0
- **Avatar**: Se mantiene si existe en metadata

### Datos Perdidos
- **Información personalizada**: Nombres personalizados, preferencias específicas
- **Historial de viajes**: Rating y total_trips se reinician
- **Configuraciones**: Se pierden configuraciones específicas del perfil

## 🔄 Pasos Adicionales Después de la Recuperación

### 1. Actualizar Información de Perfiles
Los usuarios pueden actualizar su información desde la aplicación:
- Nombre completo
- Tipo de usuario (conductor/pasajero)
- Avatar
- Otras preferencias

### 2. Verificar Funcionalidad
Prueba que la aplicación funcione correctamente:
- Registro de usuarios
- Creación de viajes
- Sistema de emparejamiento
- Nuevas columnas en `searching_pool`

### 3. Monitorear Logs
Revisa los logs de Supabase para asegurarte de que no hay errores:
- **Supabase** → **Logs** → **Database logs**

## 🚨 Prevención Futura

### 1. No Borrar Perfiles Directamente
- Usa soft deletes (marcar como inactivo)
- Implementa un sistema de archivo
- Mantén backups regulares

### 2. Usar Transacciones
Cuando hagas cambios importantes:
```sql
BEGIN;
-- Tus cambios aquí
COMMIT;
```

### 3. Backup Regular
- Exporta datos importantes regularmente
- Usa las funciones de backup de Supabase

## 📞 Si Algo Sale Mal

### Opción 1: Restaurar desde Backup
Si tienes un backup reciente de Supabase, puedes restaurar desde ahí.

### Opción 2: Recrear Manualmente
Si solo son 2 perfiles, puedes recrearlos manualmente:
```sql
INSERT INTO profiles (id, full_name, email, user_type, created_at, updated_at)
VALUES 
    ('uuid-del-usuario-1', 'Nombre Usuario 1', 'email1@ejemplo.com', 'pasajero', NOW(), NOW()),
    ('uuid-del-usuario-2', 'Nombre Usuario 2', 'email2@ejemplo.com', 'pasajero', NOW(), NOW());
```

### Opción 3: Contactar Soporte
Si nada funciona, contacta el soporte de Supabase.

---

**¡La recuperación debería resolver el problema y permitir que los usuarios vuelvan a usar la aplicación normalmente! 🎉**




# Pruebas Unitarias para Wheels

## Estructura de las pruebas

Las pruebas unitarias están organizadas para validar los componentes críticos del sistema Wheels:

1. **Autenticación**: Validación de correos institucionales y gestión de usuarios
2. **Gestión de viajes**: Creación y reserva de viajes
3. **Emparejamiento**: Algoritmo para asignar pasajeros a conductores
4. **Optimización de rutas**: Cálculo de rutas óptimas para recoger pasajeros

## Cómo ejecutar las pruebas

### Requisitos previos

1. Instalar las dependencias:

```bash
pip install -r requirements_test.txt
```

2. Configurar variables de entorno (opcional):

```bash
# Windows
set SUPABASE_URL=tu_url_de_supabase
set SUPABASE_KEY=tu_clave_de_supabase

# Linux/Mac
export SUPABASE_URL=tu_url_de_supabase
export SUPABASE_KEY=tu_clave_de_supabase
```

### Ejecución con unittest

Para ejecutar todas las pruebas unitarias:

```bash
python run_unit_tests.py
```

### Ejecución con pytest

Para ejecutar las pruebas con pytest y generar un reporte de cobertura:

```bash
pytest tests/unit -v --cov=wheels
```

## Pruebas incluidas

### Autenticación con Supabase
- Validación de correo institucional
- Registro de usuario
- Manejo de error por correo duplicado

### Gestión de viajes
- Creación de viaje
- Reserva de viaje

### Optimización
- Algoritmo de optimización de rutas

## Interpretar resultados

- ✅ PASS: La prueba fue exitosa
- ❌ FAIL: La prueba falló (revisar el mensaje de error)
- ⚠️ ERROR: Ocurrió un error al ejecutar la prueba

## Agregar nuevas pruebas

Para añadir nuevas pruebas:

1. Crear un nuevo método de prueba en la clase `TestWheelsCore` siguiendo la convención de nombre `test_*`
2. Implementar los pasos: Arrange, Act, Assert
3. Ejecutar las pruebas para verificar la implementación















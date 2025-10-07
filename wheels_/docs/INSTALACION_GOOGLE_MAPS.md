# 🚀 Instalación Rápida - Google Maps Distance Matrix API

## ⚡ Pasos Rápidos (5 minutos)

### 1. **Obtener API Key de Google Maps**
```bash
# 1. Ve a: https://console.cloud.google.com/
# 2. Crea proyecto o selecciona existente
# 3. Habilita "Distance Matrix API"
# 4. Ve a "Credenciales" → "Crear credenciales" → "Clave de API"
# 5. Copia tu API key
```

### 2. **Configurar Variables de Entorno**
```bash
# Copia el archivo de ejemplo
cp env.example .env

# Edita .env y agrega tu API key
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 3. **Verificar Instalación**
```bash
# Ejecutar prueba de integración
node test_google_maps_integration.js
```

## ✅ ¡Listo!

Tu aplicación ahora usa **distancias reales de Google Maps** en lugar de distancias espaciales.

## 🔍 Verificar que Funciona

1. **Abre la consola del navegador** (F12)
2. **Busca un viaje** en tu aplicación
3. **Verifica los logs**:
   ```
   🚀 Iniciando emparejamiento con Google Maps...
   ✅ Pasajero asignado: María - 2.3km (8 min) - Fuente: google_maps
   ```

## 🆘 Si Algo Sale Mal

### **Error: "API key no configurada"**
```bash
# Verifica que .env existe y tiene la API key
cat .env | grep GOOGLE_MAPS
```

### **Error: "REQUEST_DENIED"**
- Verifica que la API key sea correcta
- Asegúrate de que "Distance Matrix API" esté habilitada

### **Error: "OVER_QUERY_LIMIT"**
- Verifica los límites en Google Cloud Console
- Considera actualizar tu plan de facturación

## 📊 Beneficios Inmediatos

- ✅ **Distancias precisas**: Rutas reales de carretera
- ✅ **Tiempos reales**: Considera tráfico actual
- ✅ **Mejor emparejamiento**: Menos matches imposibles
- ✅ **Fallback automático**: Si falla, usa distancia espacial

## 💰 Costos Estimados

```
~100 usuarios activos/día = ~$25/día = ~$750/mes
```

---

**¿Necesitas ayuda?** Revisa `README_GOOGLE_MAPS_INTEGRATION.md` para documentación completa.

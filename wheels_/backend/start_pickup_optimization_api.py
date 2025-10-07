#!/usr/bin/env python3
"""
Script para iniciar el servidor de optimización de rutas
"""

import os
import sys
import subprocess
from pathlib import Path

def check_dependencies():
    """Verifica que las dependencias estén instaladas"""
    try:
        import flask
        import flask_cors
        import pandas
        import requests
        import supabase
        print("✅ Todas las dependencias están instaladas")
        return True
    except ImportError as e:
        print(f"❌ Dependencia faltante: {e}")
        print("📦 Instalando dependencias...")
        return False

def install_dependencies():
    """Instala las dependencias necesarias"""
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements_pickup_optimization.txt"
        ])
        print("✅ Dependencias instaladas correctamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al instalar dependencias: {e}")
        return False

def start_server():
    """Inicia el servidor de optimización"""
    try:
        print("🚀 Iniciando servidor de optimización de rutas...")
        print("📡 Puerto: 5001")
        print("🌐 URL: http://localhost:5001")
        print("📋 Endpoints disponibles:")
        print("  - GET  /api/trip-optimization/<trip_id>")
        print("  - GET  /api/trip-optimization/<trip_id>/step/<step_number>")
        print("  - POST /api/trip-optimization/<trip_id>/next-step")
        print("  - POST /api/trip-optimization/<trip_id>/complete-step")
        print("  - GET  /api/trip-optimization/<trip_id>/status")
        print("  - GET  /api/health")
        print("\n" + "="*50)
        
        # Importar y ejecutar el servidor
        from pickup_optimization_api import app
        app.run(debug=True, host='0.0.0.0', port=5001)
        
    except Exception as e:
        print(f"❌ Error al iniciar el servidor: {e}")
        return False

def main():
    """Función principal"""
    print("🔧 Servidor de Optimización de Rutas para Wheels")
    print("=" * 50)
    
    # Verificar dependencias
    if not check_dependencies():
        if not install_dependencies():
            print("❌ No se pudieron instalar las dependencias")
            sys.exit(1)
    
    # Iniciar servidor
    start_server()

if __name__ == "__main__":
    main()

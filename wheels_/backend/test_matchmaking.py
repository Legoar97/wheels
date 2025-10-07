# test_matchmaking.py
import pandas as pd
from wheels_api import match_rides_enhanced, get_wheels_dataframes

# Obtener datos
profiles_df, searching_pool_df = get_wheels_dataframes()

print("=" * 60)
print("DATOS EN SEARCHING POOL:")
print("=" * 60)
print(searching_pool_df[['tipo_de_usuario', 'correo_usuario', 'destino', 'pickup_address', 'status']])
print()

# Ejecutar matchmaking
matches = match_rides_enhanced(searching_pool_df, profiles_df, max_distance_km=10)

print("=" * 60)
print(f"MATCHES ENCONTRADOS: {len(matches)}")
print("=" * 60)

for i, match in enumerate(matches, 1):
    print(f"\nMatch #{i}:")
    print(f"  Conductor: {match['nombre_conductor']} ({match['correo_conductor']})")
    print(f"  Destino: {match['destino']}")
    print(f"  Pasajeros: {len(match['pasajeros_asignados'])}")
    for p in match['pasajeros_asignados']:
        print(f"    - {p['nombre']} ({p['correo']}) - {p['distance_km']}km")
# METODOLOGÍA DE INVESTIGACIÓN
## Sistema de Carpooling WHEELS: Desarrollo de una Plataforma de Transporte Colaborativo con Algoritmos de Optimización Basados en Grafos

---

## 1. INTRODUCCIÓN

### 1.1 Contexto del Problema

El transporte urbano enfrenta desafíos significativos en términos de congestión vehicular, emisiones contaminantes y costos económicos para los usuarios. El carpooling surge como una solución sostenible que permite optimizar el uso de vehículos privados mediante el compartimiento de viajes entre múltiples usuarios con rutas similares.

### 1.2 Justificación de la Investigación

La necesidad de desarrollar sistemas inteligentes de emparejamiento de usuarios para carpooling requiere la implementación de algoritmos sofisticados que consideren múltiples variables: proximidad geográfica, compatibilidad de horarios, optimización de rutas y experiencia de usuario en tiempo real.

### 1.3 Objetivos de la Investigación

#### Objetivo General
Desarrollar e implementar un sistema de carpooling inteligente que utilice algoritmos de optimización basados en grafos para el emparejamiento eficiente de conductores y pasajeros, integrando tecnologías web modernas y comunicación en tiempo real.

#### Objetivos Específicos
1. Diseñar una arquitectura de microservicios escalable para el sistema de carpooling
2. Implementar algoritmos de emparejamiento basados en proximidad geográfica y compatibilidad de rutas
3. Desarrollar un algoritmo de optimización de rutas de recogida utilizando teoría de grafos
4. Crear interfaces de usuario intuitivas con comunicación en tiempo real
5. Validar la eficiencia del sistema mediante pruebas de rendimiento y usabilidad

---

## 2. MARCO TEÓRICO

### 2.1 Fundamentos del Carpooling

El carpooling, también conocido como ride-sharing, es un modelo de transporte colaborativo donde múltiples pasajeros comparten un vehículo para realizar trayectos con destinos similares. Este modelo presenta beneficios económicos, ambientales y sociales.

### 2.2 Teoría de Grafos Aplicada al Transporte

#### 2.2.1 Conceptos Fundamentales
- **Grafo (G = (V, E))**: Estructura matemática compuesta por vértices (V) y aristas (E)
- **Vértice**: Representa ubicaciones geográficas (puntos de recogida/destino)
- **Arista**: Representa conexiones entre ubicaciones con pesos asociados (distancia, tiempo)
- **Camino**: Secuencia de vértices conectados por aristas
- **Ciclo**: Camino que inicia y termina en el mismo vértice

#### 2.2.2 Algoritmos de Optimización
- **Problema del Vendedor Viajero (TSP)**: Encontrar el camino más corto que visite todos los vértices
- **Algoritmo del Vecino Más Cercano**: Heurística para aproximar soluciones al TSP
- **Algoritmo de Dijkstra**: Encontrar caminos más cortos desde un vértice origen
- **Algoritmos Genéticos**: Optimización mediante evolución artificial

### 2.3 Arquitecturas de Software Modernas

#### 2.3.1 Microservicios
Arquitectura que descompone aplicaciones en servicios independientes y especializados, facilitando la escalabilidad y mantenimiento.

#### 2.3.2 Backend as a Service (BaaS)
Modelo que proporciona servicios de backend como base de datos, autenticación y APIs a través de la nube.

#### 2.3.3 Comunicación en Tiempo Real
Tecnologías como WebSockets que permiten comunicación bidireccional instantánea entre cliente y servidor.

---

## 3. METODOLOGÍA DE DESARROLLO

### 3.1 Enfoque de Investigación

**Tipo de Investigación**: Investigación aplicada con enfoque cuantitativo y cualitativo
**Metodología**: Desarrollo Ágil con Scrum
**Paradigma**: Investigación-Acción

### 3.2 Fases de Desarrollo

#### Fase 1: Análisis y Diseño (4 semanas)
- **Actividades**:
  - Análisis de requerimientos funcionales y no funcionales
  - Diseño de arquitectura del sistema
  - Modelado de base de datos
  - Diseño de interfaces de usuario
  - Selección de tecnologías

- **Entregables**:
  - Documento de especificación de requerimientos
  - Diagramas de arquitectura
  - Modelo entidad-relación
  - Mockups de interfaz de usuario
  - Stack tecnológico definido

#### Fase 2: Desarrollo del Backend (6 semanas)
- **Actividades**:
  - Configuración de base de datos PostgreSQL con Supabase
  - Implementación de APIs REST con Python Flask
  - Desarrollo del algoritmo de emparejamiento
  - Implementación del algoritmo de optimización de rutas con grafos
  - Integración con Google Maps API

- **Entregables**:
  - Base de datos funcional con esquemas y políticas de seguridad
  - API REST documentada
  - Algoritmo de emparejamiento implementado
  - Algoritmo de optimización de rutas basado en grafos
  - Integración con servicios externos

#### Fase 3: Desarrollo del Frontend (5 semanas)
- **Actividades**:
  - Desarrollo de componentes React con TypeScript
  - Implementación de gestión de estado
  - Integración con APIs backend
  - Implementación de comunicación en tiempo real
  - Desarrollo de interfaces responsivas

- **Entregables**:
  - Aplicación web React funcional
  - Componentes reutilizables
  - Integración completa con backend
  - Comunicación en tiempo real operativa
  - Interfaz responsive

#### Fase 4: Integración y Optimización (3 semanas)
- **Actividades**:
  - Integración completa del sistema
  - Optimización de rendimiento
  - Implementación de manejo de errores
  - Configuración de logging y monitoreo
  - Pruebas de integración

- **Entregables**:
  - Sistema completamente integrado
  - Optimizaciones de rendimiento aplicadas
  - Sistema de logging implementado
  - Suite de pruebas de integración
  - Documentación técnica

#### Fase 5: Pruebas y Validación (4 semanas)
- **Actividades**:
  - Pruebas unitarias y de integración
  - Pruebas de rendimiento y carga
  - Pruebas de usabilidad con usuarios
  - Validación de algoritmos
  - Corrección de errores y mejoras

- **Entregables**:
  - Suite completa de pruebas automatizadas
  - Reportes de rendimiento
  - Resultados de pruebas de usabilidad
  - Validación de eficiencia de algoritmos
  - Sistema optimizado y corregido

---

## 4. ARQUITECTURA DEL SISTEMA

### 4.1 Arquitectura General

El sistema WHEELS implementa una arquitectura de microservicios distribuida en tres capas principales:

```
┌─────────────────────────────────────────────────────────────┐
│                 CAPA DE PRESENTACIÓN                       │
│  React 18 + TypeScript + Tailwind CSS + Framer Motion     │
│  • Interfaces de usuario responsivas                       │
│  • Gestión de estado con Context API                       │
│  • Comunicación en tiempo real con WebSockets              │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE LÓGICA DE NEGOCIO                │
│  Python Flask + Algoritmos de Optimización                │
│  • API REST para emparejamiento                           │
│  • Algoritmo de grafos para optimización de rutas         │
│  • Integración con Google Maps Distance Matrix API        │
│  • Procesamiento de datos geoespaciales                   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PERSISTENCIA                    │
│  PostgreSQL + Supabase (BaaS)                             │
│  • Base de datos relacional optimizada                     │
│  • Row Level Security (RLS)                               │
│  • Funciones almacenadas y triggers                       │
│  • Replicación en tiempo real                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Stack Tecnológico

#### Frontend
- **React 18.2.0**: Framework de desarrollo de interfaces de usuario
- **TypeScript**: Superset de JavaScript con tipado estático
- **Vite**: Herramienta de construcción y desarrollo rápido
- **Tailwind CSS**: Framework de estilos utilitarios
- **Framer Motion**: Librería de animaciones
- **Radix UI**: Componentes accesibles y primitivos

#### Backend
- **Python 3.9+**: Lenguaje de programación principal
- **Flask 2.3.0**: Framework web minimalista
- **Pandas**: Manipulación y análisis de datos
- **GeoPy**: Cálculos geoespaciales
- **NetworkX**: Manipulación y análisis de grafos
- **Requests**: Cliente HTTP para integraciones externas

#### Base de Datos
- **PostgreSQL 15**: Sistema de gestión de base de datos relacional
- **Supabase**: Backend as a Service (BaaS)
- **PostGIS**: Extensión para datos geoespaciales

#### APIs Externas
- **Google Maps Distance Matrix API**: Cálculo de distancias y tiempos reales
- **Google Maps Geocoding API**: Conversión de direcciones a coordenadas

---

## 5. ALGORITMO DE OPTIMIZACIÓN DE RUTAS BASADO EN GRAFOS

### 5.1 Fundamentación Teórica

El problema de optimización de rutas de recogida en carpooling se modela como una variante del Problema del Vendedor Viajero (TSP), donde se debe encontrar la ruta más eficiente para recoger múltiples pasajeros antes de dirigirse al destino común.

### 5.2 Modelado del Problema como Grafo

#### 5.2.1 Definición del Grafo
- **G = (V, E, W)** donde:
  - **V**: Conjunto de vértices representando ubicaciones
    - v₀: Ubicación inicial del conductor
    - v₁, v₂, ..., vₙ: Ubicaciones de recogida de pasajeros
    - vₑ: Destino final común
  - **E**: Conjunto de aristas representando conexiones entre ubicaciones
  - **W**: Función de peso que asigna costos a las aristas (distancia, tiempo, tráfico)

#### 5.2.2 Representación Matemática
```
G = (V, E, W)
V = {v₀, v₁, v₂, ..., vₙ, vₑ}
E = {(vᵢ, vⱼ) | ∀i,j ∈ V, i ≠ j}
W: E → ℝ⁺
```

### 5.3 Implementación del Algoritmo

#### 5.3.1 Algoritmo del Vecino Más Cercano Modificado

```python
def optimize_pickup_route_graph(driver_location, passengers, destination):
    """
    Optimiza la ruta de recogida utilizando teoría de grafos
    
    Args:
        driver_location: Tuple (lat, lng) - Ubicación inicial del conductor
        passengers: List[Dict] - Lista de pasajeros con ubicaciones
        destination: Tuple (lat, lng) - Destino final común
    
    Returns:
        Dict: Ruta optimizada con orden de recogida y métricas
    """
    import networkx as nx
    from geopy.distance import geodesic
    
    # 1. Crear el grafo
    G = nx.DiGraph()
    
    # 2. Agregar nodos
    nodes = {
        'driver': driver_location,
        'destination': destination
    }
    
    for i, passenger in enumerate(passengers):
        nodes[f'passenger_{i}'] = (passenger['pickup_lat'], passenger['pickup_lng'])
    
    # 3. Agregar nodos al grafo
    for node_id, coords in nodes.items():
        G.add_node(node_id, coords=coords)
    
    # 4. Calcular y agregar aristas con pesos
    for node1 in nodes:
        for node2 in nodes:
            if node1 != node2:
                coords1 = nodes[node1]
                coords2 = nodes[node2]
                
                # Calcular distancia real usando Google Maps API
                distance_data = calculate_real_distance(coords1, coords2)
                weight = distance_data['distance']  # km
                duration = distance_data['duration']  # minutos
                
                G.add_edge(node1, node2, 
                          weight=weight, 
                          duration=duration,
                          distance_km=weight)
    
    # 5. Aplicar algoritmo de optimización
    optimal_route = nearest_neighbor_tsp(G, 'driver', 'destination')
    
    # 6. Calcular métricas de la ruta
    total_distance = calculate_route_distance(G, optimal_route)
    total_duration = calculate_route_duration(G, optimal_route)
    
    # 7. Generar orden de recogida
    pickup_order = []
    current_eta = 0
    
    for i, node in enumerate(optimal_route[1:-1]):  # Excluir driver y destination
        if node.startswith('passenger_'):
            passenger_idx = int(node.split('_')[1])
            passenger = passengers[passenger_idx]
            
            # Calcular ETA acumulado
            if i > 0:
                prev_node = optimal_route[i]
                current_eta += G[prev_node][node]['duration']
            
            pickup_order.append({
                'passenger_id': passenger.get('passenger_id'),
                'pickup_address': passenger.get('pickup_address'),
                'pickup_coords': (passenger['pickup_lat'], passenger['pickup_lng']),
                'eta_minutes': current_eta,
                'order': len(pickup_order) + 1
            })
    
    return {
        'optimal_route': optimal_route,
        'pickup_order': pickup_order,
        'total_distance_km': total_distance,
        'total_duration_minutes': total_duration,
        'efficiency_score': calculate_efficiency_score(total_distance, len(passengers))
    }

def nearest_neighbor_tsp(graph, start_node, end_node):
    """
    Implementación del algoritmo del vecino más cercano para TSP
    """
    visited = {start_node}
    route = [start_node]
    current_node = start_node
    
    # Visitar todos los nodos pasajero
    passenger_nodes = [n for n in graph.nodes() if n.startswith('passenger_')]
    
    while len(visited) < len(passenger_nodes) + 1:  # +1 por el nodo driver
        unvisited_passengers = [n for n in passenger_nodes if n not in visited]
        
        if not unvisited_passengers:
            break
            
        # Encontrar el pasajero más cercano
        nearest_node = min(unvisited_passengers, 
                          key=lambda n: graph[current_node][n]['weight'])
        
        route.append(nearest_node)
        visited.add(nearest_node)
        current_node = nearest_node
    
    # Agregar destino final
    route.append(end_node)
    
    return route

def calculate_efficiency_score(total_distance, num_passengers):
    """
    Calcula un score de eficiencia de la ruta
    """
    if num_passengers == 0:
        return 0
    
    # Score basado en distancia promedio por pasajero
    avg_distance_per_passenger = total_distance / num_passengers
    
    # Normalizar el score (menor distancia = mayor eficiencia)
    efficiency_score = max(0, 100 - (avg_distance_per_passenger * 10))
    
    return round(efficiency_score, 2)
```

#### 5.3.2 Optimización Avanzada con Algoritmos Genéticos

Para casos con mayor número de pasajeros (n > 10), se implementa un algoritmo genético:

```python
import random
from deap import base, creator, tools, algorithms

def genetic_algorithm_route_optimization(graph, start_node, end_node, population_size=50, generations=100):
    """
    Optimización de ruta usando algoritmos genéticos
    """
    # Definir el problema de optimización
    creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
    creator.create("Individual", list, fitness=creator.FitnessMin)
    
    toolbox = base.Toolbox()
    
    passenger_nodes = [n for n in graph.nodes() if n.startswith('passenger_')]
    
    # Definir funciones genéticas
    toolbox.register("indices", random.sample, range(len(passenger_nodes)), len(passenger_nodes))
    toolbox.register("individual", tools.initIterate, creator.Individual, toolbox.indices)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    
    def evaluate_route(individual):
        """Función de evaluación (fitness)"""
        route = [start_node] + [passenger_nodes[i] for i in individual] + [end_node]
        total_distance = sum(graph[route[i]][route[i+1]]['weight'] 
                           for i in range(len(route)-1))
        return (total_distance,)
    
    toolbox.register("evaluate", evaluate_route)
    toolbox.register("mate", tools.cxOrdered)
    toolbox.register("mutate", tools.mutShuffleIndexes, indpb=0.05)
    toolbox.register("select", tools.selTournament, tournsize=3)
    
    # Ejecutar algoritmo genético
    population = toolbox.population(n=population_size)
    
    algorithms.eaSimple(population, toolbox, 
                       cxpb=0.7, mutpb=0.2, 
                       ngen=generations, 
                       stats=None, halloffame=None, verbose=False)
    
    # Obtener mejor solución
    best_individual = tools.selBest(population, 1)[0]
    best_route = [start_node] + [passenger_nodes[i] for i in best_individual] + [end_node]
    
    return best_route
```

### 5.4 Métricas de Evaluación del Algoritmo

#### 5.4.1 Métricas de Eficiencia
- **Distancia Total**: Suma de distancias entre todos los puntos de la ruta
- **Tiempo Total**: Tiempo estimado de viaje incluyendo tráfico
- **Factor de Detour**: Relación entre ruta optimizada y ruta directa
- **Eficiencia por Pasajero**: Distancia promedio por pasajero recogido

#### 5.4.2 Métricas de Calidad
- **Tiempo de Espera Promedio**: ETA promedio para los pasajeros
- **Desviación Estándar de ETAs**: Variabilidad en tiempos de recogida
- **Score de Satisfacción**: Métrica compuesta de eficiencia y equidad

#### 5.4.3 Fórmulas Matemáticas

```
Factor de Detour = (Distancia_Ruta_Optimizada) / (Distancia_Ruta_Directa)

Eficiencia por Pasajero = (Distancia_Total) / (Número_Pasajeros)

Score de Satisfacción = (α × Eficiencia) + (β × Equidad) + (γ × Rapidez)
```

---

## 6. IMPLEMENTACIÓN DEL ALGORITMO DE EMPAREJAMIENTO

### 6.1 Algoritmo de Emparejamiento Basado en Proximidad

```python
def enhanced_matching_algorithm(drivers, passengers, max_distance_km=5, max_detour_factor=1.3):
    """
    Algoritmo de emparejamiento mejorado que considera múltiples factores
    
    Args:
        drivers: Lista de conductores disponibles
        passengers: Lista de pasajeros buscando viaje
        max_distance_km: Distancia máxima permitida para emparejamiento
        max_detour_factor: Factor máximo de desvío permitido
    
    Returns:
        List[Dict]: Lista de emparejamientos optimizados
    """
    matches = []
    
    for driver in drivers:
        if driver['available_seats'] <= 0:
            continue
            
        driver_route = {
            'origin': (driver['pickup_lat'], driver['pickup_lng']),
            'destination': (driver['dropoff_lat'], driver['dropoff_lng'])
        }
        
        # Calcular distancia base del conductor
        base_distance = calculate_real_distance(
            driver_route['origin'], 
            driver_route['destination']
        )['distance']
        
        compatible_passengers = []
        
        for passenger in passengers:
            # Verificar compatibilidad de destino
            if not is_destination_compatible(driver, passenger):
                continue
            
            passenger_pickup = (passenger['pickup_lat'], passenger['pickup_lng'])
            
            # Calcular distancia desde conductor a pasajero
            pickup_distance = calculate_real_distance(
                driver_route['origin'], 
                passenger_pickup
            )['distance']
            
            if pickup_distance > max_distance_km:
                continue
            
            # Calcular factor de desvío
            total_distance_with_passenger = (
                pickup_distance + 
                calculate_real_distance(
                    passenger_pickup, 
                    driver_route['destination']
                )['distance']
            )
            
            detour_factor = total_distance_with_passenger / base_distance
            
            if detour_factor > max_detour_factor:
                continue
            
            # Calcular score de compatibilidad
            compatibility_score = calculate_compatibility_score(
                driver, passenger, pickup_distance, detour_factor
            )
            
            compatible_passengers.append({
                'passenger': passenger,
                'pickup_distance': pickup_distance,
                'detour_factor': detour_factor,
                'compatibility_score': compatibility_score
            })
        
        if compatible_passengers:
            # Ordenar por score de compatibilidad
            compatible_passengers.sort(
                key=lambda x: x['compatibility_score'], 
                reverse=True
            )
            
            # Seleccionar mejores pasajeros hasta llenar cupos
            selected_passengers = compatible_passengers[:driver['available_seats']]
            
            # Optimizar ruta de recogida usando grafos
            passenger_locations = [
                {
                    'pickup_lat': p['passenger']['pickup_lat'],
                    'pickup_lng': p['passenger']['pickup_lng'],
                    'passenger_id': p['passenger']['id']
                }
                for p in selected_passengers
            ]
            
            optimized_route = optimize_pickup_route_graph(
                driver_route['origin'],
                passenger_locations,
                driver_route['destination']
            )
            
            matches.append({
                'driver': driver,
                'passengers': selected_passengers,
                'route_optimization': optimized_route,
                'total_efficiency_score': optimized_route['efficiency_score']
            })
    
    # Ordenar matches por eficiencia total
    matches.sort(key=lambda x: x['total_efficiency_score'], reverse=True)
    
    return matches

def calculate_compatibility_score(driver, passenger, distance, detour_factor):
    """
    Calcula score de compatibilidad entre conductor y pasajero
    """
    # Factores de scoring
    distance_score = max(0, 100 - (distance * 20))  # Menor distancia = mayor score
    detour_score = max(0, 100 - ((detour_factor - 1) * 100))  # Menor desvío = mayor score
    
    # Factores adicionales
    time_compatibility = calculate_time_compatibility(driver, passenger)
    price_compatibility = calculate_price_compatibility(driver, passenger)
    
    # Score ponderado
    total_score = (
        0.4 * distance_score +
        0.3 * detour_score +
        0.2 * time_compatibility +
        0.1 * price_compatibility
    )
    
    return round(total_score, 2)
```

---

## 7. METODOLOGÍA DE PRUEBAS

### 7.1 Estrategia de Testing

#### 7.1.1 Niveles de Prueba
1. **Pruebas Unitarias**: Componentes individuales
2. **Pruebas de Integración**: Interacción entre módulos
3. **Pruebas de Sistema**: Funcionalidad completa
4. **Pruebas de Aceptación**: Validación con usuarios finales

#### 7.1.2 Tipos de Prueba
- **Pruebas Funcionales**: Verificación de requerimientos
- **Pruebas de Rendimiento**: Escalabilidad y velocidad
- **Pruebas de Seguridad**: Vulnerabilidades y protección de datos
- **Pruebas de Usabilidad**: Experiencia de usuario

### 7.2 Métricas de Evaluación

#### 7.2.1 Métricas del Algoritmo de Grafos
```python
def evaluate_algorithm_performance():
    """
    Evalúa el rendimiento del algoritmo de optimización de rutas
    """
    test_cases = generate_test_scenarios()
    results = []
    
    for scenario in test_cases:
        start_time = time.time()
        
        # Ejecutar algoritmo
        optimized_route = optimize_pickup_route_graph(
            scenario['driver_location'],
            scenario['passengers'],
            scenario['destination']
        )
        
        execution_time = time.time() - start_time
        
        # Calcular métricas
        metrics = {
            'execution_time_ms': execution_time * 1000,
            'total_distance_km': optimized_route['total_distance_km'],
            'efficiency_score': optimized_route['efficiency_score'],
            'num_passengers': len(scenario['passengers']),
            'improvement_over_naive': calculate_improvement(scenario, optimized_route)
        }
        
        results.append(metrics)
    
    return analyze_performance_results(results)
```

#### 7.2.2 Métricas de Sistema
- **Tiempo de Respuesta**: < 2 segundos para emparejamiento
- **Throughput**: > 100 requests/segundo
- **Disponibilidad**: 99.9% uptime
- **Precisión de Emparejamiento**: > 85% de matches exitosos

### 7.3 Validación con Usuarios

#### 7.3.1 Diseño del Experimento
- **Participantes**: 50 usuarios (25 conductores, 25 pasajeros)
- **Duración**: 4 semanas de pruebas
- **Métricas**: Satisfacción, eficiencia, usabilidad

#### 7.3.2 Instrumentos de Medición
- Cuestionarios de satisfacción (escala Likert 1-5)
- Métricas de uso (tiempo en app, matches completados)
- Entrevistas semi-estructuradas
- Análisis de logs de sistema

---

## 8. RESULTADOS ESPERADOS

### 8.1 Indicadores de Éxito

#### 8.1.1 Técnicos
- Reducción del 20% en distancia total de viajes vs. rutas no optimizadas
- Tiempo de emparejamiento < 3 segundos
- Eficiencia del algoritmo de grafos > 90% vs. solución óptima teórica
- 0 errores críticos en producción

#### 8.1.2 Funcionales
- Tasa de emparejamiento exitoso > 80%
- Satisfacción de usuario > 4.0/5.0
- Tiempo promedio de espera < 5 minutos
- Reducción de costos de transporte > 30%

#### 8.1.3 No Funcionales
- Escalabilidad para 1000+ usuarios concurrentes
- Disponibilidad del sistema > 99.5%
- Seguridad: 0 brechas de datos
- Rendimiento: carga de página < 2 segundos

### 8.2 Contribuciones Esperadas

#### 8.2.1 Académicas
- Algoritmo de optimización de rutas específico para carpooling
- Metodología de emparejamiento basada en múltiples criterios
- Análisis comparativo de algoritmos de grafos para transporte
- Framework de evaluación de sistemas de carpooling

#### 8.2.2 Tecnológicas
- Sistema de carpooling escalable y eficiente
- Integración innovadora de tecnologías web modernas
- Implementación de comunicación en tiempo real optimizada
- Arquitectura de microservicios para transporte colaborativo

#### 8.2.3 Sociales
- Reducción de emisiones de CO₂ por optimización de rutas
- Mejora en accesibilidad de transporte urbano
- Fomento de economía colaborativa
- Reducción de congestión vehicular

---

## 9. CRONOGRAMA DE ACTIVIDADES

### 9.1 Diagrama de Gantt

| Fase | Actividad | Semana 1-2 | Semana 3-4 | Semana 5-6 | Semana 7-8 | Semana 9-10 | Semana 11-12 | Semana 13-14 | Semana 15-16 | Semana 17-18 | Semana 19-20 | Semana 21-22 |
|------|-----------|------------|------------|------------|------------|-------------|-------------|-------------|-------------|-------------|-------------|-------------|
| **Fase 1: Análisis y Diseño** | | | | | | | | | | | | |
| Análisis de requerimientos | ████████ | | | | | | | | | | |
| Diseño de arquitectura | | ████████ | | | | | | | | | |
| Diseño de BD y UI | | | ████████ | | | | | | | | |
| Selección de tecnologías | | | | ████████ | | | | | | | |
| **Fase 2: Desarrollo Backend** | | | | | | | | | | | | |
| Configuración BD | | | | | ████████ | | | | | | |
| APIs REST | | | | | | ████████ | | | | | |
| Algoritmo emparejamiento | | | | | | | ████████ | | | | |
| Algoritmo grafos | | | | | | | | ████████ | | | |
| Integración Google Maps | | | | | | | | | ████████ | | |
| **Fase 3: Desarrollo Frontend** | | | | | | | | | | | | |
| Componentes React | | | | | | | ████████ | ████████ | | | |
| Gestión de estado | | | | | | | | ████████ | ████████ | | |
| Integración backend | | | | | | | | | ████████ | ████████ | |
| Tiempo real | | | | | | | | | | ████████ | |
| **Fase 4: Integración** | | | | | | | | | | | | |
| Integración completa | | | | | | | | | | | ████████ |
| Optimización | | | | | | | | | | | ████████ |
| **Fase 5: Pruebas** | | | | | | | | | | | | |
| Pruebas y validación | | | | | | | | | | | ████████ |

### 9.2 Hitos Críticos

1. **Semana 4**: Arquitectura del sistema definida y aprobada
2. **Semana 8**: Backend funcional con algoritmos implementados
3. **Semana 12**: Frontend integrado con backend
4. **Semana 16**: Sistema completo funcionando
5. **Semana 20**: Pruebas completadas y sistema validado
6. **Semana 22**: Documentación final y presentación

---

## 10. RECURSOS Y PRESUPUESTO

### 10.1 Recursos Humanos

| Rol | Dedicación | Semanas | Costo/Hora | Total |
|-----|------------|---------|------------|-------|
| Desarrollador Full-Stack | 40 horas/semana | 22 semanas | $25 | $22,000 |
| Diseñador UX/UI | 10 horas/semana | 8 semanas | $30 | $2,400 |
| Consultor Algoritmos | 5 horas/semana | 6 semanas | $50 | $1,500 |
| **Total Recursos Humanos** | | | | **$25,900** |

### 10.2 Recursos Tecnológicos

| Recurso | Costo Mensual | Meses | Total |
|---------|---------------|-------|-------|
| Supabase Pro | $25 | 6 | $150 |
| Google Maps API | $200 | 6 | $1,200 |
| Hosting/Dominio | $20 | 6 | $120 |
| Herramientas Desarrollo | $50 | 6 | $300 |
| **Total Recursos Tecnológicos** | | | **$1,770** |

### 10.3 Otros Recursos

| Concepto | Costo |
|----------|-------|
| Equipos de desarrollo | $3,000 |
| Software y licencias | $500 |
| Pruebas con usuarios | $800 |
| Documentación y presentación | $300 |
| **Total Otros Recursos** | **$4,600** |

### 10.4 Presupuesto Total

| Categoría | Monto |
|-----------|-------|
| Recursos Humanos | $25,900 |
| Recursos Tecnológicos | $1,770 |
| Otros Recursos | $4,600 |
| **TOTAL PROYECTO** | **$32,270** |

---

## 11. RIESGOS Y MITIGACIÓN

### 11.1 Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Nivel | Estrategia de Mitigación |
|--------|--------------|---------|-------|--------------------------|
| Complejidad del algoritmo de grafos | Media | Alto | Alto | Prototipado temprano, consultoría especializada |
| Limitaciones de Google Maps API | Baja | Alto | Medio | Implementar fallback con OpenStreetMap |
| Problemas de rendimiento | Media | Medio | Medio | Pruebas de carga continuas, optimización |
| Retrasos en desarrollo | Alta | Medio | Alto | Buffer de tiempo del 20%, desarrollo ágil |
| Problemas de usabilidad | Media | Medio | Medio | Pruebas de usuario tempranas y continuas |
| Seguridad de datos | Baja | Alto | Medio | Implementación de RLS, auditorías de seguridad |

### 11.2 Plan de Contingencia

#### 11.2.1 Algoritmo de Grafos
- **Plan A**: Implementación completa con NetworkX y algoritmos genéticos
- **Plan B**: Algoritmo del vecino más cercano simplificado
- **Plan C**: Ordenamiento por distancia simple

#### 11.2.2 APIs Externas
- **Plan A**: Google Maps Distance Matrix API
- **Plan B**: OpenStreetMap con OSRM
- **Plan C**: Cálculos de distancia euclidiana

#### 11.2.3 Rendimiento
- **Plan A**: Optimización completa con caching
- **Plan B**: Limitación de usuarios concurrentes
- **Plan C**: Procesamiento asíncrono

---

## 12. CONSIDERACIONES ÉTICAS

### 12.1 Privacidad de Datos

#### 12.1.1 Principios
- Minimización de datos: Solo recopilar información necesaria
- Transparencia: Informar claramente sobre uso de datos
- Consentimiento: Obtener autorización explícita
- Control: Permitir modificación y eliminación de datos

#### 12.1.2 Implementación
- Encriptación de datos sensibles
- Anonimización de datos de ubicación
- Políticas de retención de datos
- Cumplimiento con GDPR/CCPA

### 12.2 Seguridad

#### 12.2.1 Medidas Técnicas
- Autenticación multifactor
- Encriptación end-to-end
- Auditorías de seguridad
- Monitoreo de actividad sospechosa

#### 12.2.2 Medidas Organizacionales
- Políticas de acceso a datos
- Capacitación en seguridad
- Respuesta a incidentes
- Evaluaciones de riesgo regulares

### 12.3 Equidad y Accesibilidad

#### 12.3.1 Inclusión
- Interfaz accesible (WCAG 2.1)
- Soporte para múltiples idiomas
- Compatibilidad con tecnologías asistivas
- Precios equitativos

#### 12.3.2 No Discriminación
- Algoritmos libres de sesgo
- Igualdad de oportunidades de emparejamiento
- Protección de grupos vulnerables
- Transparencia en criterios de matching

---

## 13. CONCLUSIONES

### 13.1 Síntesis Metodológica

La metodología propuesta para el desarrollo del sistema WHEELS integra enfoques teóricos sólidos con implementaciones tecnológicas modernas. La aplicación de teoría de grafos para la optimización de rutas de recogida representa una contribución significativa al campo del carpooling inteligente, proporcionando soluciones eficientes para problemas complejos de optimización combinatoria.

### 13.2 Innovación Tecnológica

El sistema combina innovadoramente:
- Algoritmos de grafos para optimización de rutas
- Arquitectura de microservicios escalable
- Comunicación en tiempo real
- Interfaces de usuario modernas
- Integración con APIs geoespaciales

### 13.3 Impacto Esperado

#### 13.3.1 Académico
- Avance en algoritmos de optimización para transporte colaborativo
- Metodología replicable para sistemas similares
- Contribución al conocimiento en grafos aplicados

#### 13.3.2 Tecnológico
- Sistema funcional y escalable
- Framework reutilizable
- Mejores prácticas documentadas

#### 13.3.3 Social
- Reducción de emisiones contaminantes
- Optimización del transporte urbano
- Fomento de la economía colaborativa

### 13.4 Sostenibilidad del Proyecto

La arquitectura propuesta garantiza:
- **Escalabilidad**: Capacidad de crecimiento horizontal
- **Mantenibilidad**: Código modular y documentado
- **Extensibilidad**: Facilidad para agregar funcionalidades
- **Viabilidad económica**: Modelo de negocio sostenible

### 13.5 Perspectivas Futuras

El sistema WHEELS establece las bases para futuras investigaciones en:
- Algoritmos de machine learning para predicción de demanda
- Integración con vehículos autónomos
- Optimización multi-objetivo avanzada
- Análisis de patrones de movilidad urbana

---

## 14. REFERENCIAS BIBLIOGRÁFICAS

### 14.1 Referencias Técnicas

1. Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to Algorithms* (3rd ed.). MIT Press.

2. Diestel, R. (2017). *Graph Theory* (5th ed.). Springer.

3. Newman, M. (2018). *Networks: An Introduction* (2nd ed.). Oxford University Press.

4. Russell, S., & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson.

### 14.2 Referencias de Carpooling

5. Agatz, N., Erera, A., Savelsbergh, M., & Wang, X. (2012). Optimization for dynamic ride-sharing: A survey. *European Journal of Operational Research*, 223(2), 295-303.

6. Furuhata, M., Dessouky, M., Ordóñez, F., Brunet, M. E., Wang, X., & Koenig, S. (2013). Ridesharing: The state-of-the-art and future directions. *Transportation Research Part B*, 57, 28-46.

7. Shaheen, S., & Cohen, A. (2019). Shared ride services in North America: Definitions, impacts, and the future of pooling. *Transport Reviews*, 39(4), 427-442.

### 14.3 Referencias de Algoritmos

8. Applegate, D. L., Bixby, R. E., Chvátal, V., & Cook, W. J. (2007). *The Traveling Salesman Problem: A Computational Study*. Princeton University Press.

9. Gendreau, M., & Potvin, J. Y. (Eds.). (2010). *Handbook of Metaheuristics* (2nd ed.). Springer.

10. Laporte, G. (2009). Fifty years of vehicle routing. *Transportation Science*, 43(4), 408-416.

### 14.4 Referencias de Tecnología

11. Fowler, M. (2018). *Microservices Patterns*. Manning Publications.

12. Newman, S. (2015). *Building Microservices*. O'Reilly Media.

13. Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media.

---

**Documento preparado por:** [Nombre del Investigador]  
**Fecha:** [Fecha de preparación]  
**Versión:** 1.0  
**Estado:** Borrador para revisión

---

*Este documento constituye la metodología de investigación completa para el desarrollo del sistema de carpooling WHEELS, incluyendo la implementación de algoritmos de optimización basados en grafos para la optimización de rutas de recogida de pasajeros.*
























// Script de diagnóstico para el auto-emparejamiento
// Ejecutar en la consola del navegador

console.log("🔍 Iniciando diagnóstico de auto-emparejamiento...");

// Función para diagnosticar el problema
function diagnoseAutoMatching() {
    console.log("📋 DIAGNÓSTICO PASO A PASO:");
    
    console.log("1️⃣ Verificar datos en localStorage:");
    const keys = Object.keys(localStorage);
    const driverKeys = keys.filter(key => key.startsWith('driver_accepted_'));
    console.log("   - Claves de conductor:", driverKeys);
    
    console.log("2️⃣ Verificar si hay datos de conductor:");
    if (driverKeys.length > 0) {
        driverKeys.forEach(key => {
            const data = localStorage.getItem(key);
            console.log(`   - ${key}:`, JSON.parse(data));
        });
    } else {
        console.log("   - No hay datos de conductor en localStorage");
    }
    
    console.log("3️⃣ Verificar estado de la aplicación:");
    console.log("   - Abrir DevTools → Application → Local Storage");
    console.log("   - Buscar claves que empiecen con 'driver_accepted_'");
    
    console.log("4️⃣ Verificar consola del navegador:");
    console.log("   - Buscar mensajes que contengan:");
    console.log("     * 'AUTO-EMPAREJAMIENTO DETECTADO'");
    console.log("     * 'Usuario es conductor en match'");
    console.log("     * 'Usuario es pasajero en match'");
    
    console.log("5️⃣ Verificar base de datos:");
    console.log("   - Ejecutar: diagnosticar_auto_emparejamiento.sql");
    console.log("   - Buscar usuarios con doble rol");
}

// Función para simular el problema
function simulateProblem() {
    console.log("🧪 Simulando el problema...");
    
    // Simular que el usuario se empareja consigo mismo
    const userEmail = "test@example.com";
    const selfMatch = {
        conductor_correo: userEmail,
        conductor_id: "123",
        nombre_conductor: "Usuario Test",
        pasajeros_asignados: [{
            pasajero_correo: userEmail,
            nombre: "Usuario Test",
            correo: userEmail
        }]
    };
    
    console.log("📋 Match simulado (auto-emparejamiento):", selfMatch);
    console.log("❌ Este es el tipo de match que causa el problema");
    
    return selfMatch;
}

// Función para verificar la lógica del hook
function testHookLogic() {
    console.log("🔧 Probando lógica del hook...");
    
    const userEmail = "test@example.com";
    const matches = [
        {
            conductor_correo: userEmail, // Mismo usuario como conductor
            pasajeros_asignados: [{
                pasajero_correo: userEmail // Mismo usuario como pasajero
            }]
        },
        {
            conductor_correo: "otro@example.com", // Diferente conductor
            pasajeros_asignados: [{
                pasajero_correo: userEmail // Usuario como pasajero
            }]
        }
    ];
    
    console.log("📋 Matches de prueba:", matches);
    
    // Simular la lógica del hook
    const userMatches = [];
    for (const match of matches) {
        const conductorEmail = match.conductor_correo;
        
        if (conductorEmail === userEmail) {
            console.log("✅ Usuario es conductor en match:", match);
            userMatches.push({...match, role: 'driver'});
            continue;
        }
        
        const isPassenger = match.pasajeros_asignados?.some(passenger => {
            return passenger.pasajero_correo === userEmail;
        });
        
        if (isPassenger) {
            console.log("✅ Usuario es pasajero en match:", match);
            userMatches.push({...match, role: 'passenger'});
        }
    }
    
    console.log("🎯 Resultado:", userMatches);
    return userMatches;
}

// Función para limpiar datos de prueba
function clearDebugData() {
    console.log("🗑️ Limpiando datos de debug...");
    
    const keys = Object.keys(localStorage);
    const debugKeys = keys.filter(key => 
        key.startsWith('driver_accepted_') || 
        key.startsWith('test_') ||
        key.startsWith('debug_')
    );
    
    debugKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`   - Eliminado: ${key}`);
    });
    
    console.log("✅ Datos de debug limpiados");
}

// Exportar funciones
window.debugAutoMatching = {
    diagnose: diagnoseAutoMatching,
    simulate: simulateProblem,
    test: testHookLogic,
    clear: clearDebugData
};

console.log("🎯 Funciones de diagnóstico disponibles:");
console.log("  - debugAutoMatching.diagnose() - Diagnóstico completo");
console.log("  - debugAutoMatching.simulate() - Simular el problema");
console.log("  - debugAutoMatching.test() - Probar lógica del hook");
console.log("  - debugAutoMatching.clear() - Limpiar datos de debug");

console.log("\n📝 Pasos recomendados:");
console.log("1. debugAutoMatching.diagnose() - Ver qué está pasando");
console.log("2. Revisar consola del navegador para mensajes de error");
console.log("3. Ejecutar diagnosticar_auto_emparejamiento.sql en Supabase");
console.log("4. debugAutoMatching.clear() - Limpiar después de debuggear");


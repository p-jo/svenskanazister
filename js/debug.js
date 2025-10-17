// Debug script - lägg till detta i din index.html för att testa steg för steg
console.log("=== DEBUGGING START ===");

// 1. Kontrollera att config finns
console.log("1. Config check:");
console.log("AppConfig exists:", typeof window.AppConfig !== 'undefined');
console.log("API_BASE:", window.AppConfig?.API_BASE);

// 2. Testa API-anrop manuellt
async function testAPI() {
    console.log("\n2. API Test:");
    
    const apiBase = window.AppConfig?.API_BASE || 'http://localhost:3000';
    
    try {
        console.log("Testing health endpoint...");
        const healthResponse = await fetch(`${apiBase}/health`);
        console.log("Health status:", healthResponse.status);
        const healthData = await healthResponse.json();
        console.log("Health data:", healthData);
    } catch (error) {
        console.error("Health endpoint failed:", error);
        return;
    }
    
    try {
        console.log("Testing personer endpoint...");
        const personerResponse = await fetch(`${apiBase}/api/personer`);
        console.log("Personer status:", personerResponse.status);
        const personerData = await personerResponse.json();
        console.log("Personer count:", personerData?.length);
        console.log("First person:", personerData?.[0]);
    } catch (error) {
        console.error("Personer endpoint failed:", error);
    }
}

// 3. Testa DataLoader
async function testDataLoader() {
    console.log("\n3. DataLoader Test:");
    
    try {
        console.log("DataLoader exists:", typeof window.DataLoader !== 'undefined');
        console.log("loadCoreData method exists:", typeof window.DataLoader?.loadCoreData === 'function');
        
        if (window.DataLoader?.loadCoreData) {
            console.log("Calling loadCoreData...");
            const data = await window.DataLoader.loadCoreData();
            console.log("Data loaded successfully:");
            console.log("- Persons:", data[0]?.length);
            console.log("- Orgs:", data[1]?.length);
            console.log("- Län:", data[2]?.length);
            console.log("- Kommuner:", data[3]?.length);
            console.log("- Branscher:", data[4]?.length);
        }
    } catch (error) {
        console.error("DataLoader failed:", error);
    }
}

// 4. Kontrollera CORS
function checkCORS() {
    console.log("\n4. CORS Check:");
    console.log("Origin:", window.location.origin);
    console.log("Protocol:", window.location.protocol);
    
    if (window.location.protocol === 'file:') {
        console.warn("WARNING: Du kör från file:// protokoll. Detta kan orsaka CORS-problem.");
        console.warn("Prova att köra från en lokal server istället (t.ex. Live Server i VS Code)");
    }
}

// Kör alla tester
async function runAllTests() {
    checkCORS();
    await testAPI();
    await testDataLoader();
    console.log("\n=== DEBUGGING END ===");
}

// Kör automatiskt när sidan laddats
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}
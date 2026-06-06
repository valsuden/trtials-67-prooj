// =============================================================================
// CONFIGURACIÓN GLOBAL
// =============================================================================

const CONFIG = {
    // 1. URL API GOOGLE APPS SCRIPT
    API_URL: "https://script.google.com/macros/s/AKfycbwMAknrkWqBSR8gXOtFS8apc7-QD5Wkxh8NX4LRGw3c/exec",

    // 2. SALTS (CRÍTICO: SECURITY_SALT_API debe coincidir con Google Apps Script)
    SECURITY_SALT_COINS: "ArcaneMastery2026_X",
    SECURITY_SALT_STORAGE: "tom_secure_salt_2026_X",
    SECURITY_SALT_API: "trialsofmastery2025",

    // 3. HASH ADMIN SHA-256 (default: admin123)
    ADMIN_PASSWORD_HASH: "240eb5185c83d0f414b3297a378877b8922db289567858f965d1347a0641f622"
};

window.CONFIG = CONFIG;
console.log("⚙️ Configuración global cargada.");

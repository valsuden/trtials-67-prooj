// =============================================================================
// =============================================================================
// Para que estos códigos funcionen en el juego, debes añadirlos al Google Apps Script

const SECRET_CODES = [
    { code: "PLAYA2026",     coins: 500,  expiresAt: "2026-12-31" },
    { code: "MARLERY2026",   coins: 1000, expiresAt: "2026-12-31" },
    { code: "SECRETCODE",    coins: 1500, expiresAt: "2026-08-31" },
    { code: "ARCADE2026",    coins: 300,  expiresAt: "2026-12-31" },
    { code: "BONUS500",      coins: 500,  expiresAt: "2026-10-31" },
    { code: "SUPREME100",    coins: 100,  expiresAt: "2027-01-01" },
    { code: "GOLDENCOIN",    coins: 800,  expiresAt: "2026-11-30" },
    { code: "LEVELUP",       coins: 400,  expiresAt: "2026-09-30" },
    { code: "CHAMPION",      coins: 1200, expiresAt: "2026-07-31" },
    { code: "FREECOINS",     coins: 200,  expiresAt: "2026-06-30" }
];

if (typeof module !== 'undefined') {
    module.exports = SECRET_CODES;
}

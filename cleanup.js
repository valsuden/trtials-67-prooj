const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Remove the first huge script block (lines 152 to 1990)
// It starts after `<div id="game-over" ...>...</div>` and before `<!-- Leaderboard modal -->`
const startIdx = html.indexOf('<script>\r\n\r\n        (function () {\r\n\r\n            // Variable for music');
const endIdx = html.indexOf('// cambia por la tuya\r\n\r\n\r\n        })();\r\n\r\n    </script>', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
    const fullEnd = endIdx + '// cambia por la tuya\r\n\r\n\r\n        })();\r\n\r\n    </script>'.length;
    html = html.substring(0, startIdx) + '<!-- Game Logic moved to js/game.js -->' + html.substring(fullEnd);
    console.log('Removed first script block successfully!');
} else {
    // Try with LF line endings
    const startIdxLF = html.indexOf('<script>\n\n        (function () {\n\n            // Variable for music');
    const endIdxLF = html.indexOf('// cambia por la tuya\n\n\n        })();\n\n    </script>', startIdxLF);
    if (startIdxLF !== -1 && endIdxLF !== -1) {
        const fullEndLF = endIdxLF + '// cambia por la tuya\n\n\n        })();\n\n    </script>'.length;
        html = html.substring(0, startIdxLF) + '<!-- Game Logic moved to js/game.js -->' + html.substring(fullEndLF);
        console.log('Removed first script block (LF) successfully!');
    } else {
        console.error('Failed to locate first script block!');
    }
}

// 2. Remove the second script block (Global Leaderboard functions)
const startIdx2 = html.indexOf('<script>\r\n        window.leaderboardAPI = "https://script.google.com/macros/s/AKfycbwMAknrkWqBSR8gXOtFS8apc7-QD5Wkxh8NX4LRGw3c/exec";');
const endIdx2 = html.indexOf('playModalSound();\r\n            } catch (e) { }\r\n        }\r\n\r\n\r\n    </script>');
if (startIdx2 !== -1 && endIdx2 !== -1) {
    const fullEnd2 = endIdx2 + 'playModalSound();\r\n            } catch (e) { }\r\n        }\r\n\r\n\r\n    </script>'.length;
    html = html.substring(0, startIdx2) + '<!-- Global Leaderboard Logic consolidated in js/api.js -->' + html.substring(fullEnd2);
    console.log('Removed second script block successfully!');
} else {
    // Try with LF
    const startIdx2LF = html.indexOf('<script>\n        window.leaderboardAPI = "https://script.google.com/macros/s/AKfycbwMAknrkWqBSR8gXOtFS8apc7-QD5Wkxh8NX4LRGw3c/exec";');
    const endIdx2LF = html.indexOf('playModalSound();\n            } catch (e) { }\n        }\n\n\n    </script>');
    if (startIdx2LF !== -1 && endIdx2LF !== -1) {
        const fullEnd2LF = endIdx2LF + 'playModalSound();\n            } catch (e) { }\n        }\n\n\n    </script>'.length;
        html = html.substring(0, startIdx2LF) + '<!-- Global Leaderboard Logic consolidated in js/api.js -->' + html.substring(fullEnd2LF);
        console.log('Removed second script block (LF) successfully!');
    } else {
        console.error('Failed to locate second script block!');
    }
}

// 3. Remove the third script block (shopSwitchTab and lobby music replayer)
const startIdx3 = html.indexOf('<script>\r\n        // ---- TABS: Estandartes / Runas ----');
const endIdx3 = html.indexOf('playAudioBoosted(\'lobby-seagulls\');\r\n                    }, 300);\r\n                });\r\n            }\r\n        });\r\n    </script>');
if (startIdx3 !== -1 && endIdx3 !== -1) {
    const fullEnd3 = endIdx3 + 'playAudioBoosted(\'lobby-seagulls\');\r\n                    }, 300);\r\n                });\r\n            }\r\n        });\r\n    </script>'.length;
    html = html.substring(0, startIdx3) + '<!-- Shop Tabs and Music toggle moved to js/shop.js -->' + html.substring(fullEnd3);
    console.log('Removed third script block successfully!');
} else {
    // Try with LF
    const startIdx3LF = html.indexOf('<script>\n        // ---- TABS: Estandartes / Runas ----');
    const endIdx3LF = html.indexOf('playAudioBoosted(\'lobby-seagulls\');\n                    }, 300);\n                });\n            }\n        });\n    </script>');
    if (startIdx3LF !== -1 && endIdx3LF !== -1) {
        const fullEnd3LF = endIdx3LF + 'playAudioBoosted(\'lobby-seagulls\');\n                    }, 300);\n                });\n            }\n        });\n    </script>'.length;
        html = html.substring(0, startIdx3LF) + '<!-- Shop Tabs and Music toggle moved to js/shop.js -->' + html.substring(fullEnd3LF);
        console.log('Removed third script block (LF) successfully!');
    } else {
        console.error('Failed to locate third script block!');
    }
}

// 4. Remove the fourth script block (Integration patches)
const startIdx4 = html.indexOf('<script>\r\n        // ===================================================\r\n        // INTEGRACIÓN: conectar nuevos sistemas con el juego');
const endIdx4 = html.indexOf('setTimeout(function () { LB.renderTop3(); }, 500);\r\n            });\r\n\r\n        })();\r\n    </script>');
if (startIdx4 !== -1 && endIdx4 !== -1) {
    const fullEnd4 = endIdx4 + 'setTimeout(function () { LB.renderTop3(); }, 500);\r\n            });\r\n\r\n        })();\r\n    </script>'.length;
    html = html.substring(0, startIdx4) + '<!-- Integration patches consolidated directly in js/game.js, js/users.js -->' + html.substring(fullEnd4);
    console.log('Removed fourth script block successfully!');
} else {
    // Try with LF
    const startIdx4LF = html.indexOf('<script>\n        // ===================================================\n        // INTEGRACIÓN: conectar nuevos sistemas con el juego');
    const endIdx4LF = html.indexOf('setTimeout(function () { LB.renderTop3(); }, 500);\n            });\n\n        })();\n    </script>');
    if (startIdx4LF !== -1 && endIdx4LF !== -1) {
        const fullEnd4LF = endIdx4LF + 'setTimeout(function () { LB.renderTop3(); }, 500);\n            });\n\n        })();\n    </script>'.length;
        html = html.substring(0, startIdx4LF) + '<!-- Integration patches consolidated directly in js/game.js, js/users.js -->' + html.substring(fullEnd4LF);
        console.log('Removed fourth script block (LF) successfully!');
    } else {
        console.error('Failed to locate fourth script block!');
    }
}

// 5. Remove the fifth script block (UX improvements and MutationObserver VFX)
const startIdx5 = html.indexOf('<script>\r\n        // ===========================================================\r\n        // MEJORAS UI/UX — Menú, Selector obligatorio, VFX energía');
const endIdx5 = html.indexOf('window._vfx = { energyLoss: triggerEnergyLossVFX, correct: triggerCorrectVFX };\r\n\r\n        })();\r\n    </script>');
if (startIdx5 !== -1 && endIdx5 !== -1) {
    const fullEnd5 = endIdx5 + 'window._vfx = { energyLoss: triggerEnergyLossVFX, correct: triggerCorrectVFX };\r\n\r\n        })();\r\n    </script>'.length;
    html = html.substring(0, startIdx5) + '<!-- UX and VFX triggers moved directly to js/effects.js, js/users.js -->' + html.substring(fullEnd5);
    console.log('Removed fifth script block successfully!');
} else {
    // Try with LF
    const startIdx5LF = html.indexOf('<script>\n        // ===========================================================\n        // MEJORAS UI/UX — Menú, Selector obligatorio, VFX energía');
    const endIdx5LF = html.indexOf('window._vfx = { energyLoss: triggerEnergyLossVFX, correct: triggerCorrectVFX };\n\n        })();\n    </script>');
    if (startIdx5LF !== -1 && endIdx5LF !== -1) {
        const fullEnd5LF = endIdx5LF + 'window._vfx = { energyLoss: triggerEnergyLossVFX, correct: triggerCorrectVFX };\n\n        })();\n    </script>'.length;
        html = html.substring(0, startIdx5LF) + '<!-- UX and VFX triggers moved directly to js/effects.js, js/users.js -->' + html.substring(fullEnd5LF);
        console.log('Removed fifth script block (LF) successfully!');
    } else {
        console.error('Failed to locate fifth script block!');
    }
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('index.html cleanup complete!');

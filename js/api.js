// =============================================================================
// API Y RED — Trials of Mastery
// =============================================================================
(function () {
    'use strict';

    // =========================================================================
    // 1. URL DEL SERVIDOR — Obtenida de CONFIG si está disponible
    // =========================================================================
    window.leaderboardAPI = (window.CONFIG && window.CONFIG.API_URL) || "https://script.google.com/macros/s/AKfycbwMAknrkWqBSR8gXOtFS8apc7-QD5Wkxh8NX4LRGw3c/exec";

    // =========================================================================
    // 2. CÓDIGOS PROMOCIONALES PREDETERMINADOS
    // =========================================================================
    const _defaultCodes = (typeof SECRET_CODES !== 'undefined' ? SECRET_CODES : (window.SECRET_CODES || [])); // Códigos movidos al archivo seguro codes.js para que no se vean en la consola.

    var _initCustomCodes = [];
    try {
        var raw = localStorage.getItem('tom_cc_data');
        if (raw) _initCustomCodes = JSON.parse(atob(raw));
    } catch (e) { }
    window.CODES_DATA = _defaultCodes.concat(_initCustomCodes);

    // =========================================================================
    // 3. ANTI-CHEAT: Generación de Hash de Firma
    // =========================================================================
    window.generateHash = function (name, score, streak) {
        if (score > 3000 || streak > 3000) {
            console.warn("Anti-Cheat: Valores inválidos detectados. El servidor rechazará este guardado.");
            return "CHEAT_DETECTED_INVALID_HASH_REJECTED";
        }
        var salt = (window.CONFIG && window.CONFIG.SECURITY_SALT_API) || "trialsofmastery2025";
        var str = name + score + streak + salt;
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(36);
    };

    // =========================================================================
    // 4. GUARDAR PUNTUACIÓN EN EL LEADERBOARD GLOBAL
    // =========================================================================
    window.saveToLeaderboard = function (playerName, score) {
        try {
            var rawName = playerName ||
                (document.getElementById('player-name-display') || {}).textContent ||
                (document.getElementById('player-name-input') || {}).value || 'Player';
            if (rawName === 'Guest') return;

            var name = encodeURIComponent(rawName);
            var scoreNum = Number(score);
            var streakNum = (window.Game && window.Game.state && window.Game.state.maxStreak) || Number(window._gameMaxStreak) || 0;
            var coinsNum = (typeof Users !== 'undefined' && Users.data) ? (Users.data.coins || 0) : 0;

            if (scoreNum > 3000 || streakNum > 3000 || coinsNum > 3000) {
                console.error("Anti-Cheat: Métricas fuera de rango. Operación cancelada.");
                return;
            }

            var wordFailsData = (window.Game && window.Game.state && window.Game.state.wordFailCount) || window._gameWordFailCount || {};
            var sortedFails = Object.entries(wordFailsData)
                .sort(function (a, b) { return b[1] - a[1]; })
                .slice(0, 10);
            var limitedFails = Object.fromEntries(sortedFails);
            var wordFailsStr = encodeURIComponent(JSON.stringify(limitedFails));

            var hash = window.generateHash(decodeURIComponent(name), scoreNum, streakNum);
            var callbackName = 'jsonpSaveCallback_' + Math.round(1000000 * Math.random());
            var url = window.leaderboardAPI + '?action=save&name=' + name +
                '&score=' + scoreNum + '&streak=' + streakNum +
                '&coins=' + coinsNum + '&wordFails=' + wordFailsStr +
                '&hash=' + hash + '&callback=' + callbackName;

            window[callbackName] = function (response) {
                delete window[callbackName];
                var scriptTag = document.getElementById(callbackName);
                if (scriptTag) scriptTag.remove();
                if (response && response.success) {
                    localStorage.removeItem('pendingScore');
                    console.log('Leaderboard: puntaje guardado vía JSONP');
                } else {
                    _savePending(rawName, scoreNum, streakNum, coinsNum, wordFailsData);
                }
            };

            var script = document.createElement('script');
            script.id = callbackName;
            script.src = url;
            script.onerror = function () {
                delete window[callbackName];
                script.remove();
                _savePending(rawName, scoreNum, streakNum, coinsNum, wordFailsData);
            };
            document.body.appendChild(script);
        } catch (e) {
            console.error('Error al guardar en leaderboard:', e);
        }
    };

    function _savePending(name, score, streak, coins, wordFails) {
        localStorage.setItem('pendingScore', JSON.stringify({
            name: name, score: score, streak: streak, coins: coins, wordFails: wordFails
        }));
        console.warn('Leaderboard: guardado pendiente para el próximo intento.');
    }

    // =========================================================================
    // 5. REINTENTAR GUARDADO PENDIENTE
    // =========================================================================
    window.retrySendPending = function () {
        var pending = localStorage.getItem('pendingScore');
        if (!pending) return;
        try {
            var data = JSON.parse(pending);
            var scoreVal = Number(data.score) || 0;
            var streakVal = Number(data.streak) || 0;
            var coinsVal = Number(data.coins) || 0;

            if (scoreVal > 3000 || streakVal > 3000 || coinsVal > 3000) {
                console.warn("Anti-Cheat: Pendiente rechazado por valores inválidos.");
                localStorage.removeItem('pendingScore');
                return;
            }

            var rawName = data.name || 'Player';
            var name = encodeURIComponent(rawName);
            var sortedFails = Object.entries(data.wordFails || {}).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10);
            var wordFailsStr = encodeURIComponent(JSON.stringify(Object.fromEntries(sortedFails)));
            var hash = window.generateHash(decodeURIComponent(name), scoreVal, streakVal);

            var callbackName = 'jsonpRetryCallback_' + Math.round(1000000 * Math.random());
            var url = window.leaderboardAPI + '?action=save&name=' + name +
                '&score=' + scoreVal + '&streak=' + streakVal +
                '&coins=' + coinsVal + '&wordFails=' + wordFailsStr +
                '&hash=' + hash + '&callback=' + callbackName;

            window[callbackName] = function (response) {
                delete window[callbackName];
                var scriptTag = document.getElementById(callbackName);
                if (scriptTag) scriptTag.remove();
                if (response && response.success) {
                    localStorage.removeItem('pendingScore');
                    console.log('Leaderboard: pendiente sincronizado.');
                }
            };
            var script = document.createElement('script');
            script.id = callbackName;
            script.src = url;
            script.onerror = function () { delete window[callbackName]; script.remove(); };
            document.body.appendChild(script);
        } catch (e) { console.error('Error en reintento:', e); }
    };

    // =========================================================================
    // 6. MOSTRAR LEADERBOARD GLOBAL (JSONP)
    // =========================================================================
    window.showLeaderboard = function () {
        var list = document.getElementById('leaderboard-list');
        if (!list) return;
        list.innerHTML = '<p>Cargando puntajes...</p>';

        var oldScript = document.getElementById('leaderboard-jsonp-script');
        if (oldScript) oldScript.remove();

        var script = document.createElement('script');
        script.id = 'leaderboard-jsonp-script';
        script.src = window.leaderboardAPI + '?callback=handleLeaderboardData&t=' + Date.now();
        script.onerror = function () {
            list.innerHTML = '<p>Error de conexión. Verifica tu internet.</p>';
            window.openLeaderboardModal();
        };
        document.body.appendChild(script);

        setTimeout(function () {
            if (list.innerHTML.includes('Cargando')) {
                list.innerHTML = '<p>Tiempo de espera agotado.</p>';
                window.openLeaderboardModal();
            }
        }, 8000);
    };

    window.handleLeaderboardData = function (data) {
        var list = document.getElementById('leaderboard-list');
        try {
            if (!Array.isArray(data) || data.length === 0) {
                list.innerHTML = '<p>¡No hay puntajes aún. Sé el primero!</p>';
                window.openLeaderboardModal();
                return;
            }

            var uniquePlayers = {};
            data.forEach(function (entry) {
                if (!entry || !entry.name) return;
                var n = String(entry.name).trim();
                var s = Number(entry.score) || 0;
                if (!uniquePlayers[n] || s > (Number(uniquePlayers[n].score) || 0)) {
                    uniquePlayers[n] = entry;
                }
            });
            var uniqueData = Object.values(uniquePlayers);
            uniqueData.sort(function (a, b) { return Number(b.score) - Number(a.score); });
            var top20 = uniqueData.slice(0, 20);
            var medals = ['🥇', '🥈', '🥉'];

            var html = top20.map(function (r, i) {
                var isTop1 = i === 0;
                var medal = medals[i] || '';
                var rowClass = isTop1 ? 'lb-global-row top1-row' : 'lb-global-row';
                var nameClass = isTop1 ? 'lb-global-name lb-king-name' : 'lb-global-name';
                if (typeof Storage !== 'undefined') {
                    var localU = Storage.getUser(r.name);
                    if (localU && localU.equippedBanner && typeof getBanner !== 'undefined') {
                        var b = getBanner(localU.equippedBanner);
                        if (b) rowClass += ' ' + b.css;
                    }
                }
                var crownHtml = isTop1 ? '<span class="top1-crown">👑</span>' : '';
                var scoreStyle = isTop1 ? 'color:#ffd700;font-size:1.1em;font-weight:bold;' : '';
                return '<div class="' + rowClass + '">' +
                    '<span class="lb-global-medal">' + medal + '</span>' +
                    '<span class="lb-global-num">' + (i + 1) + '.</span>' +
                    '<span class="' + nameClass + '">' + crownHtml + _escapeHtml(r.name) + '</span>' +
                    '<span class="lb-global-score" style="' + scoreStyle + '">' + _escapeHtml(String(r.score)) + ' pts</span>' +
                    '<span class="lb-global-streak">🔥' + _escapeHtml(String(r.streak || 0)) + '</span>' +
                    '</div>';
            }).join('');

            var totalPlayers = uniqueData.length;
            var footer = totalPlayers > 20
                ? '<p style="margin-top:15px;color:#00ff4c;font-size:0.6em;">Mostrando top 20 de ' + totalPlayers + ' jugadores</p>'
                : '';
            list.innerHTML = html + footer;
            window.openLeaderboardModal();
        } catch (e) {
            console.error('Error mostrando leaderboard:', e);
            list.innerHTML = '<p>Error mostrando puntajes.</p>';
            window.openLeaderboardModal();
        }
    };

    // =========================================================================
    // 7. TOP 3 EN VIVO DURANTE EL JUEGO
    // =========================================================================
    var _top3Interval = null;

    window.loadTop3Display = function () {
        var top3List = document.getElementById('top3-list');
        if (!top3List) return;
        top3List.innerHTML = '<p style="color:#00ff4c;">Cargando...</p>';

        window.top3Callback = function (data) {
            try {
                if (!Array.isArray(data) || data.length === 0) {
                    top3List.innerHTML = '<p style="color:#ffffff;">¡Sin puntajes aún!</p>';
                    return;
                }
                data.sort(function (a, b) { return Number(b.score) - Number(a.score); });
                var top3 = data.slice(0, 3);
                var medals = ['🥇', '🥈', '🥉'];
                top3List.innerHTML = top3.map(function (player, i) {
                    return '<p style="color:#ffffff;margin:5px 0;">' +
                        medals[i] + ' ' + _escapeHtml(player.name) +
                        ': <span style="color:#ffcc00;">' + player.score + '</span></p>';
                }).join('') || '<p style="color:#ffffff;">¡Sin puntajes aún!</p>';
            } catch (e) {
                top3List.innerHTML = '<p style="color:#ff3333;">Error cargando</p>';
            }
        };

        var script = document.createElement('script');
        script.src = window.leaderboardAPI + '?callback=top3Callback&t=' + Date.now();
        document.body.appendChild(script);
    };

    window.startTop3Updates = function () {
        window.loadTop3Display();
        if (_top3Interval) clearInterval(_top3Interval);
        _top3Interval = setInterval(function () { window.loadTop3Display(); }, 30000);
    };

    window.stopTop3Updates = function () {
        if (_top3Interval) { clearInterval(_top3Interval); _top3Interval = null; }
    };

    // =========================================================================
    // 8. MODAL DE LEADERBOARD GLOBAL
    // =========================================================================
    window.openLeaderboardModal = function () {
        var backdrop = document.getElementById('leaderboard-modal-backdrop');
        if (!backdrop) return;
        backdrop.style.display = 'flex';
        backdrop.setAttribute('aria-hidden', 'false');
        _playModalSound();
    };

    window.closeLeaderboardModal = function () {
        var backdrop = document.getElementById('leaderboard-modal-backdrop');
        if (!backdrop) return;
        backdrop.style.display = 'none';
        backdrop.setAttribute('aria-hidden', 'true');
    };

    function _playModalSound() {
        try {
            var audio = new Audio('https://freesound.org/data/previews/522/522375_11682929-lq.mp3');
            audio.volume = 0.3;
            audio.play().catch(function () { });
        } catch (e) { }
    }

    // =========================================================================
    // 9. DESCARGAR CSV DEL LEADERBOARD
    // =========================================================================
    window.downloadLeaderboardCSV = function () {
        if (typeof Storage === 'undefined') return;
        var rows = Storage.getLeaderboard();
        if (!rows || rows.length === 0) { alert('No hay puntajes locales para exportar.'); return; }
        var csv = 'Pos,Nombre,Puntaje\n';
        rows.forEach(function (r, i) {
            csv += (i + 1) + ',' + r.name.replace(/,/g, '') + ',' + r.score + '\n';
        });
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'leaderboard_arcane.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // =========================================================================
    // 10. CÓDIGOS ONLINE (JSONP)
    // =========================================================================
    window.loadOnlineCodesCallback = function (data) {
        if (data && data.success && Array.isArray(data.codes)) {
            var localCustom = [];
            try {
                var rawCC = localStorage.getItem('tom_cc_data');
                if (rawCC) localCustom = JSON.parse(atob(rawCC));
            } catch (e) { }
            var allCustom = localCustom.concat(data.codes);
            var uniqueCustom = [];
            var seen = {};
            for (var i = allCustom.length - 1; i >= 0; i--) {
                var c = allCustom[i];
                if (!seen[c.code]) { seen[c.code] = true; uniqueCustom.unshift(c); }
            }
            window.CODES_DATA = _defaultCodes.concat(uniqueCustom);
            console.log("☁️ Códigos dinámicos cargados desde la nube.");
        }
    };

    setTimeout(function () {
        var s = document.createElement('script');
        s.src = window.leaderboardAPI + '?action=getCodes&callback=loadOnlineCodesCallback&t=' + Date.now();
        document.body.appendChild(s);
    }, 1500);

    // =========================================================================
    // 11. SINCRONIZACIÓN DE PERFIL ONLINE (JSONP + POST)
    // =========================================================================
    window.syncProfileCallback = function (data) {
        if (data && data.success && data.profile) {
            try {
                var onlineData = JSON.parse(atob(data.profile));
                var name = data.name;
                if (typeof Users !== 'undefined' && Users.current === name) {
                    var localData = Users.data || {};
                    var merged = {
                        coins: Math.max(localData.coins || 0, onlineData.coins || 0),
                        highScore: Math.max(localData.highScore || 0, onlineData.highScore || 0),
                        equippedBanner: localData.equippedBanner || onlineData.equippedBanner || null,
                        ownedBanners: Array.from(new Set((localData.ownedBanners || []).concat(onlineData.ownedBanners || []))),
                        wordFailCount: localData.wordFailCount || onlineData.wordFailCount || {},
                        redeemedCodes: Array.from(new Set((localData.redeemedCodes || []).concat(onlineData.redeemedCodes || []))),
                        stats: {
                            gamesPlayed: Math.max((localData.stats && localData.stats.gamesPlayed) || 0, (onlineData.stats && onlineData.stats.gamesPlayed) || 0),
                            wordsCorrect: Math.max((localData.stats && localData.stats.wordsCorrect) || 0, (onlineData.stats && onlineData.stats.wordsCorrect) || 0),
                            maxStreak: Math.max((localData.stats && localData.stats.maxStreak) || 0, (onlineData.stats && onlineData.stats.maxStreak) || 0)
                        }
                    };
                    Users.data = merged;
                    Storage.saveUser(name, merged);
                    Users._updateHUD();
                    Users._showPreview();
                    Users._applyBannerToName();
                    console.log('☁️ Perfil de "' + name + '" sincronizado con Google Sheets.');
                }
            } catch (e) { console.error("Error al fusionar perfil de la nube:", e); }
        }
    };

    setTimeout(function () {
        if (typeof Users !== 'undefined') {
            var origLoad = Users.load;
            Users.load = function (name) {
                origLoad.call(this, name);
                if (name && name !== 'Guest') {
                    var s = document.createElement('script');
                    s.src = window.leaderboardAPI + '?action=getProfile&name=' + encodeURIComponent(name) + '&callback=syncProfileCallback&t=' + Date.now();
                    document.body.appendChild(s);
                }
            };
        }
        if (typeof Storage !== 'undefined') {
            var origSaveUser = Storage.saveUser;
            var _profileSyncTimer = null;
            Storage.saveUser = function (name, data) {
                origSaveUser.call(this, name, data);
                if (name && name !== 'Guest') {
                    clearTimeout(_profileSyncTimer);
                    _profileSyncTimer = setTimeout(function () {
                        try {
                            var profileStr = btoa(JSON.stringify(data));
                            var formData = new URLSearchParams();
                            formData.append('action', 'saveProfile');
                            formData.append('name', name);
                            formData.append('profile', profileStr);
                            fetch(window.leaderboardAPI, {
                                method: 'POST',
                                mode: 'no-cors',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: formData.toString()
                            }).catch(function (e) { console.warn('Error sincronizando perfil:', e); });
                        } catch (e) { console.warn('Error en sync perfil:', e); }
                    }, 2000);
                }
            };
        }
    }, 1200);

    // =========================================================================
    // 12. SISTEMA DE ADMINISTRADOR (protegido por contraseña)
    // =========================================================================
    var _adminUnlocked = false;
    var _adminLocked = true;

    function _adminDenied() {
        console.log('%c ¿ERES IDIOTA? ', 'background:#ff0000;color:#fff;font-size:16px;font-family:monospace;padding:4px 10px;border-radius:3px;');
    }
    function _adminOk(msg) {
        console.log('%c ✓ ' + msg, 'background:#003300;color:#00ff4c;font-size:13px;font-family:monospace;padding:3px 8px;border-radius:3px;');
    }

    async function _sha256(message) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // Fallback for local file:// protocol where crypto.subtle is not available.
            // In a real app we'd use a JS SHA-256 library, but here we can just
            // hardcode the expected password hash for 'admin123' to keep it simple.
            if (message === "admin123") {
                return "240eb5185c83d0f414b3297a378877b8922db289567858f965d1347a0641f622";
            }
            return "unsupported";
        }
    }

    window.adminLogin = async function (password) {
        if (!password) {
            _adminUnlocked = false;
            _adminLocked = true;
            _adminDenied();
            return;
        }
        try {
            const enteredHash = await _sha256(password);
            const targetHash = (window.CONFIG && window.CONFIG.ADMIN_PASSWORD_HASH) || "240eb5185c83d0f414b3297a378877b8922db289567858f965d1347a0641f622";
            if (enteredHash === targetHash) {
                _adminUnlocked = true;
                _adminLocked = false;
                _adminOk('Modo Admin desbloqueado. Comandos disponibles: score, coins, saveLeader, modLeader, addCode');
            } else {
                _adminUnlocked = false;
                _adminLocked = true;
                _adminDenied();
            }
        } catch (e) {
            console.error("Error en adminLogin:", e);
            _adminUnlocked = false;
            _adminLocked = true;
            _adminDenied();
        }
    };

    function _addCodeFunc(codeName) {
        if (_adminLocked) { _adminDenied(); return; }
        if (!codeName || typeof codeName !== 'string' || !codeName.trim()) {
            console.error("❌ Código inválido."); return;
        }
        var name = codeName.trim().toUpperCase();
        var daysInput = prompt("🔑 [ADMIN] DÍAS de validez (0 = configurar por horas):");
        if (daysInput === null) { console.log("❌ Cancelado."); return; }
        var days = parseInt(daysInput.trim());
        if (isNaN(days) || days < 0) { alert("❌ Días inválido."); return; }

        var expiresAt = "";
        if (days === 0) {
            var hoursInput = prompt("🕒 [ADMIN] HORAS de validez:");
            if (hoursInput === null) { console.log("❌ Cancelado."); return; }
            var hours = parseInt(hoursInput.trim());
            if (isNaN(hours) || hours <= 0) { alert("❌ Horas inválidas."); return; }
            var dt = new Date(Date.now() + hours * 3600 * 1000);
            expiresAt = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0') + ' ' + String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
        } else {
            var dt2 = new Date(Date.now() + days * 24 * 3600 * 1000);
            expiresAt = dt2.getFullYear() + '-' + String(dt2.getMonth() + 1).padStart(2, '0') + '-' + String(dt2.getDate()).padStart(2, '0');
        }

        var coinsInput = prompt("🪙 [ADMIN] Arcane Coins de recompensa:");
        if (coinsInput === null) { console.log("❌ Cancelado."); return; }
        var coins = parseInt(coinsInput.trim());
        if (isNaN(coins) || coins <= 0) { alert("❌ Monedas inválidas."); return; }

        var newCodeObj = { code: name, coins: coins, expiresAt: expiresAt };
        var customCodes = [];
        try {
            var rawCC = localStorage.getItem('tom_cc_data');
            if (rawCC) customCodes = JSON.parse(atob(rawCC));
        } catch (e) { }
        customCodes = customCodes.filter(function (c) { return c.code !== name; });
        customCodes.push(newCodeObj);
        try {
            localStorage.setItem('tom_cc_data', btoa(JSON.stringify(customCodes)));
        } catch (e) { console.error("❌ Error guardando código.", e); return; }
        window.CODES_DATA = _defaultCodes.concat(customCodes);

        var addCbName = 'addCodeCb_' + Math.round(Math.random() * 999999);
        var addScript = document.createElement('script');
        addScript.id = addCbName;
        addScript.src = window.leaderboardAPI + '?action=addCode&code=' + encodeURIComponent(name) + '&coins=' + coins + '&expiresAt=' + encodeURIComponent(expiresAt) + '&callback=' + addCbName + '&t=' + Date.now();
        window[addCbName] = function () { delete window[addCbName]; var el = document.getElementById(addCbName); if (el) el.remove(); };
        addScript.onerror = function () { delete window[addCbName]; addScript.remove(); };
        document.body.appendChild(addScript);

        _adminOk('Código "' + name + '" creado. 🎁 ' + coins + ' coins | 📅 ' + expiresAt);
    }


    Object.defineProperty(window, 'score', {
        get: function () {
            var el = document.getElementById('score');
            return el ? parseInt(el.textContent) || 0 : 0;
        },
        set: function (v) {
            if (_adminLocked) { _adminDenied(); return; }
            var n = parseInt(v);
            if (isNaN(n)) { _adminDenied(); return; }
            var el = document.getElementById('score');
            if (el) el.textContent = n;
            try { window._gameScore = n; } catch (e) { }
            if (typeof Users !== 'undefined' && Users.data) Users.updateHighScore(n);
            _adminOk('score → ' + n);
        },
        configurable: false, enumerable: false
    });

    Object.defineProperty(window, 'saveLeader', {
        get: function () {
            if (_adminLocked) { _adminDenied(); return null; }
            var nameEl = document.getElementById('player-name-display');
            var scoreEl = document.getElementById('score');
            var name = (nameEl ? nameEl.textContent : null) || (typeof Users !== 'undefined' ? Users.current : 'Player') || 'Player';
            var s = parseInt(scoreEl ? scoreEl.textContent : 0) || 0;
            if (typeof Users !== 'undefined' && Users.data) {
                Users.updateHighScore(s);
                _adminOk('Leaderboard guardado — ' + name + ' → ' + s + ' pts');
            }
            return true;
        },
        configurable: false, enumerable: false
    });

    Object.defineProperty(window, 'coins', {
        get: function () {
            if (_adminLocked) { _adminDenied(); return null; }
            return typeof Users !== 'undefined' && Users.data ? Users.data.coins : null;
        },
        set: function (v) {
            if (_adminLocked) { _adminDenied(); return; }
            var str = String(v).trim();
            var parts = str.split(' ');
            var lastPart = parts[parts.length - 1];
            var amount, targetName;
            if (!isNaN(parseInt(lastPart))) {
                amount = parseInt(lastPart);
                targetName = parts.slice(0, -1).join(' ').trim() || null;
            } else {
                amount = parseInt(str); targetName = null;
            }
            if (isNaN(amount)) { _adminDenied(); return; }
            var name = targetName || (typeof Users !== 'undefined' ? Users.current : null) || 'Player';
            try {
                var all = JSON.parse(localStorage.getItem('tom_users') || '{}');
                if (!all[name]) all[name] = { coins: 0, highScore: 0, equippedBanner: null, ownedBanners: [], stats: {} };
                all[name].coins = amount;
                localStorage.setItem('tom_users', JSON.stringify(all));
                if (typeof Users !== 'undefined' && Users.current === name) {
                    Users.data.coins = amount;
                    Users._updateHUD();
                }
                _adminOk('coins → ' + name + ' : ' + amount);
            } catch (e) { console.error('Error coins:', e); }
        },
        configurable: false, enumerable: false
    });

    Object.defineProperty(window, 'modLeader', {
        get: function () { return _adminLocked ? (_adminDenied(), null) : 'ready'; },
        set: function (v) {
            if (_adminLocked) { _adminDenied(); return; }
            var str = String(v).trim();
            var parts = str.split(' ');
            var lastPart = parts[parts.length - 1];
            if (isNaN(parseInt(lastPart))) { _adminDenied(); return; }
            var amount = parseInt(lastPart);
            var name = parts.slice(0, -1).join(' ').trim();
            if (!name || isNaN(amount)) { _adminDenied(); return; }
            try {
                var all = JSON.parse(localStorage.getItem('tom_users') || '{}');
                if (!all[name]) all[name] = { coins: 0, highScore: 0, equippedBanner: null, ownedBanners: [], stats: {} };
                all[name].highScore = amount;
                localStorage.setItem('tom_users', JSON.stringify(all));
                _adminOk('modLeader → ' + name + ' score set to ' + amount);
            } catch (e) { console.error('modLeader failed', e); }
        },
        configurable: false, enumerable: false
    });

    Object.defineProperty(window, 'addCode', {
        get: function () { return _adminLocked ? (_adminDenied(), null) : _addCodeFunc; },
        set: function (v) { if (_adminLocked) { _adminDenied(); return; } _addCodeFunc(v); },
        configurable: false, enumerable: false
    });

    // =========================================================================
    // 13. LISTENER DE LEADERBOARD Y RETRY AL INICIO
    // =========================================================================
    document.addEventListener('click', function (e) {
        var id = e.target.id;
        if (id === 'view-leaderboard-start' || id === 'show-leaderboard-btn' || id === 'view-leaderboard-after-victory') {
            e.stopPropagation();
            window.showLeaderboard();
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        var viewStart = document.getElementById('view-leaderboard-start');
        var closeBtn = document.getElementById('close-leaderboard');
        var downloadBtn = document.getElementById('download-csv');
        var showBtn = document.getElementById('show-leaderboard-btn');

        if (viewStart) viewStart.addEventListener('click', function (e) { e.stopPropagation(); window.showLeaderboard(); });
        if (closeBtn) closeBtn.addEventListener('click', window.closeLeaderboardModal);
        if (downloadBtn) downloadBtn.addEventListener('click', window.downloadLeaderboardCSV);
        if (showBtn) showBtn.addEventListener('click', function (e) { e.stopPropagation(); window.showLeaderboard(); });

        var backdrop = document.getElementById('leaderboard-modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', function (e) { if (e.target === backdrop) window.closeLeaderboardModal(); });
        }

        // Title double click to unlock admin
        var title = document.querySelector('h1');
        if (title) {
            title.style.cursor = 'pointer';
            title.addEventListener('dblclick', function() {
                var pass = prompt("🔑 [ADMIN] Enter password:");
                if (pass) window.adminLogin(pass);
            });
        }

        // Keyboard shortcut: Ctrl + Shift + A to trigger admin login prompt
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                e.preventDefault();
                var pass = prompt("🔑 [ADMIN] Enter password:");
                if (pass) window.adminLogin(pass);
            }
        });

        setTimeout(window.retrySendPending, 3000);
    });

    function _escapeHtml(s) {
        if (!s) return '';
        return s.replace(/[&<>"]/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]);
        });
    }
    window.escapeHtml = _escapeHtml;

})();

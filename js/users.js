const Users = {
    current: null,
    data: null,

    init() {
        const sel = document.getElementById('player-name-input');
        if (!sel) return;

        // Inyectar warning y card de usuario debajo del select
        const warning = document.createElement('div');
        warning.id = 'select-warning';
        warning.innerHTML = '⚠ SELECCIONA TU NOMBRE PARA JUGAR';
        warning.style.display = 'none'; // oculto inicialmente
        sel.parentNode.insertBefore(warning, sel.nextSibling);

        const userCard = document.createElement('div');
        userCard.id = 'selected-user-card';
        userCard.innerHTML =
            '<span class="card-username" id="card-username">—</span>' +
            '<span class="card-coins">🪙 Coins: <span id="card-coins-val">0</span></span><br>' +
            '<span class="card-score">🏆 Best: <span id="card-score-val">0</span></span>' +
            '<span class="card-banner-preview-wrap" id="card-banner-preview"></span>';
        warning.parentNode.insertBefore(userCard, warning.nextSibling);

        sel.addEventListener('change', e => {
            const name = e.target.value;
            if (name) {
                localStorage.setItem('savedPlayerName', name);
                document.cookie = "savedPlayerName=" + encodeURIComponent(name) + "; max-age=31536000; path=/";
            } else {
                localStorage.removeItem('savedPlayerName');
                document.cookie = "savedPlayerName=; max-age=0; path=/";
            }

            if (!name) {
                userCard.style.display = 'none';
                warning.style.display = 'none';
                this.current = null;
                this.data = null;
                this._hideHUD();
                return;
            }

            this.load(name);
        });

        // Helper para leer cookies
        function getCookie(cookieName) {
            var value = "; " + document.cookie;
            var parts = value.split("; " + cookieName + "=");
            if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
            return null;
        }

        // Auto-cargar usuario guardado
        var savedName = localStorage.getItem('savedPlayerName') || getCookie('savedPlayerName');
        if (savedName) {
            var options = sel.options;
            for (var i = 0; i < options.length; i++) {
                if (options[i].value === savedName) {
                    sel.value = savedName;
                    this.load(savedName);
                    break;
                }
            }
        }

        // Interceptar START para bloquear si no hay usuario
        var startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', function (e) {
                if (!sel.value) {
                    e.stopImmediatePropagation();
                    warning.style.display = 'block';
                    sel.style.borderColor = '#ff3300';
                    sel.style.boxShadow = '0 0 15px rgba(255,51,0,0.6)';
                    setTimeout(function () {
                        sel.style.borderColor = '';
                        sel.style.boxShadow = '';
                    }, 2000);
                }
            }, true); // captura ANTES que el listener original
        }
    },

    load(name) {
        if (!name) { this.current = null; this.data = null; this._hideHUD(); return; }
        this.current = name;
        this.data = Storage.getUser(name);

        if (this.data.equippedBanner === 'royal_zenith' || this.data.equippedBanner === 'celestial_king') {
            const rows = Storage.getLeaderboard ? Storage.getLeaderboard() : [];
            const isTop1 = rows.length > 0 && rows[0].name === name;
            const actuallyOwned = (this.data.ownedBanners || []).includes(this.data.equippedBanner);
            if (!isTop1 && !actuallyOwned) {
                this.data.equippedBanner = null;
                this.save();
            }
        }

        this._showHUD();
        this._updateHUD();
        this._showPreview();
    },

    save() {
        if (this.current) Storage.saveUser(this.current, this.data);
    },

    addCoins(n) {
        if (!this.data) return;
        let newCoins = (this.data.coins || 0) + n;
        if (newCoins > 3000) {
            console.warn("Anti-Cheat: Coins capped at 3000.");
            newCoins = 3000;
        }
        this.data.coins = Math.max(0, newCoins);
        this.save();
        this._updateHUD();
        this._showPreview();
    },

    updateHighScore(s) {
        if (!this.data) return;
        if (s > 3000) {
            console.warn("Anti-Cheat: Score capped at 3000.");
            s = 3000;
        }
        if (s > (this.data.highScore || 0)) {
            this.data.highScore = s;
            this.save();
        }
        this._showPreview();
    },

    equipBanner(id) {
        if (!this.data) return;
        const rows = Storage.getLeaderboard ? Storage.getLeaderboard() : [];
        const isTop1 = rows.length > 0 && rows[0].name === this.current;
        const isTopBanner = id === 'royal_zenith' || id === 'celestial_king';
        const canEquip = (this.data.ownedBanners || []).includes(id) || (isTopBanner && isTop1);
        if (!canEquip) return;

        this.data.equippedBanner = id;
        this.save();
        this._updateHUD();
        this._applyBannerToName();
        this._showPreview();
    },

    unequipBanner() {
        if (!this.data) return;
        this.data.equippedBanner = null;
        this.save();
        this._updateHUD();
        this._applyBannerToName();
        this._showPreview();
    },

    buyBanner(id) {
        if (!this.data) return false;
        const b = getBanner(id);
        if (!b) return false;
        if ((this.data.ownedBanners || []).includes(id)) return false;
        if (this.data.coins < b.price) return false;
        this.data.coins -= b.price;
        this.data.ownedBanners = this.data.ownedBanners || [];
        this.data.ownedBanners.push(id);
        this.save();
        this._updateHUD();
        this._showPreview();
        return true;
    },

    _showHUD() {
        const h = document.getElementById('shop-hud');
        if (h) h.style.display = 'flex';
    },
    _hideHUD() {
        const h = document.getElementById('shop-hud');
        if (h) h.style.display = 'none';
    },
    _updateHUD() {
        const c = document.getElementById('hud-coins-val');
        if (c && this.data) c.textContent = this.data.coins;
    },
    _showPreview() {
        const data = this.data;
        if (!data) return;
        const userCard = document.getElementById('selected-user-card');
        if (userCard) userCard.style.display = 'block';

        const cName = document.getElementById('card-username');
        if (cName) cName.textContent = '👤 ' + this.current;

        const c = document.getElementById('card-coins-val');
        if (c) c.textContent = data.coins || 0;
        const s = document.getElementById('card-score-val');
        if (s) s.textContent = data.highScore || 0;
        const bp = document.getElementById('card-banner-preview');
        if (bp) {
            bp.innerHTML = '';
            if (data.equippedBanner && typeof getBanner === 'function') {
                const bn = getBanner(data.equippedBanner);
                if (bn) {
                    const sp = document.createElement('span');
                    sp.className = bn.css;
                    sp.style.fontSize = '0.9em';
                    sp.textContent = this.current;
                    bp.appendChild(document.createTextNode('🎖 '));
                    bp.appendChild(sp);
                }
            } else {
                bp.textContent = '🎖 Sin banner equipado';
            }
        }
    },
    _applyBannerToName() {
        const nameSpan = document.getElementById('player-name-display');
        if (!nameSpan || !this.data) return;
        nameSpan.className = '';
        if (this.data.equippedBanner) {
            const b = getBanner(this.data.equippedBanner);
            if (b) nameSpan.className = b.css;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Users.init());

class SecuritySystem {
    constructor() {
        this.salt = (window.CONFIG && window.CONFIG.SECURITY_SALT_COINS) || "ArcaneMastery2026_X";
        this.initStorage();
    }

    _hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            let char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    initStorage() {
        if (!localStorage.getItem('arcane_coins_hash')) {
            this.setCoins(0);
        }
    }

    getCoins() {
        const val = localStorage.getItem('arcane_coins');
        const hash = localStorage.getItem('arcane_coins_hash');
        if (val && hash === this._hash(val + this.salt)) {
            return parseInt(val) || 0;
        }
        console.warn("Manipulación de monedas detectada. Reiniciando a 0.");
        this.setCoins(0);
        return 0;
    }

    setCoins(amount) {
        amount = Math.max(0, parseInt(amount) || 0);
        localStorage.setItem('arcane_coins', amount.toString());
        localStorage.setItem('arcane_coins_hash', this._hash(amount.toString() + this.salt));
        document.dispatchEvent(new CustomEvent('coinsUpdated', { detail: { amount } }));
    }

    addCoins(amount) {
        this.setCoins(this.getCoins() + amount);
    }

    saveData(key, data) {
        const strData = JSON.stringify(data);
        localStorage.setItem(key, strData);
        localStorage.setItem(key + '_hash', this._hash(strData + this.salt));
    }

    loadData(key) {
        const val = localStorage.getItem(key);
        const hash = localStorage.getItem(key + '_hash');
        if (val && hash === this._hash(val + this.salt)) {
            try { return JSON.parse(val); } catch (e) { return null; }
        }
        return null;
    }

    sanitize(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
}

const Security = new SecuritySystem();

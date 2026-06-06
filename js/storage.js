const Storage = {

    salt: (window.CONFIG && window.CONFIG.SECURITY_SALT_STORAGE) || "tom_secure_salt_2026_X",

    _hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            let char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },

    _getAll() {
        try {
            const raw = localStorage.getItem('tom_users');
            const signature = localStorage.getItem('tom_users_sig');
            if (!raw) return {};

            if (signature !== this._hash(raw + this.salt)) {
                console.warn("⚠️ SEGURIDAD: Modificación no autorizada detectada en el almacenamiento local. Restableciendo datos.");
                localStorage.removeItem('tom_users');
                localStorage.removeItem('tom_users_sig');
                return {};
            }

            return JSON.parse(raw);
        } catch(e) { return {}; }
    },

    _saveAll(data) {
        for (let name in data) {
            if (data[name].coins > 3000) {
                console.warn(`Anti-Cheat: Coins cap exceeded for ${name}. Resetting to safe value.`);
                data[name].coins = 3000;
            }
            if (data[name].highScore > 3000) {
                console.warn(`Anti-Cheat: Score cap exceeded for ${name}. Resetting to safe value.`);
                data[name].highScore = 3000;
            }
            if (data[name].stats && data[name].stats.maxStreak > 3000) {
                data[name].stats.maxStreak = 3000;
            }
        }
        const raw = JSON.stringify(data);
        localStorage.setItem('tom_users', raw);
        localStorage.setItem('tom_users_sig', this._hash(raw + this.salt));
    },

    getUser(name) {
        const all = this._getAll();
        if (!all[name]) {
            all[name] = {
                coins: 0,
                highScore: 0,
                equippedBanner: null,
                ownedBanners: [],
                wordFailCount: {},
                difficultWords: {},
                stats: { gamesPlayed: 0, wordsCorrect: 0, maxStreak: 0 }
            };
            this._saveAll(all);
        }
        return all[name];
    },

    saveUser(name, data) {
        const all = this._getAll();
        all[name] = data;
        this._saveAll(all);
    },

    getAllUsers() {
        return this._getAll();
    },

    getLeaderboard() {
        const users = this._getAll();
        return Object.entries(users)
            .filter(([name]) => name !== 'Guest')
            .map(([name, d]) => ({ name, score: d.highScore || 0, banner: d.equippedBanner }))
            .sort((a, b) => b.score - a.score);
    }
};

// Bloque: Datos de Tienda
const RARITY_COLORS = {
    'Common': '#aaaaaa',
    'Uncommon': '#00ff4c',
    'Rare': '#00ccff',
    'Epic': '#aa00ff',
    'Legendary': '#ff6600',
    'Mythic': '#ff0000',
    'Secret': 'rainbow',
    'Divine': 'divine'
};

class ShopSystem {
    constructor() {
        this.stockData = Security.loadData('shopStock') || this.initializeStock();
        this.unlockedBanners = Security.loadData('unlockedBanners') || [];
        this.equippedBanner = Security.loadData('equippedBanner') || null;
    }

    initializeStock() {
        const stock = {};
        BANNERS_DATA.forEach(b => {
            stock[b.id] = b.stock;
        });
        return stock;
    }

    saveStock() {
        Security.saveData('shopStock', this.stockData);
        Security.saveData('unlockedBanners', this.unlockedBanners);
        Security.saveData('equippedBanner', this.equippedBanner);
    }

    buyBanner(bannerId) {
        const banner = BANNERS_DATA.find(b => b.id === bannerId);
        if (!banner) return { success: false, msg: "Banner no existe." };
        if (this.unlockedBanners.includes(bannerId)) return { success: false, msg: "Ya posees este banner." };
        if (this.stockData[bannerId] !== 'infinite' && this.stockData[bannerId] <= 0) return { success: false, msg: "Agotado." };
        
        let coins = Security.getCoins();
        if (coins < banner.price) return { success: false, msg: "Arcane Coins insuficientes." };

        Security.setCoins(coins - banner.price);
        this.unlockedBanners.push(bannerId);
        
        if (this.stockData[bannerId] !== 'infinite') {
            this.stockData[bannerId]--;
        }
        this.saveStock();
        return { success: true, msg: "¡Banner desbloqueado!" };
    }

    equipBanner(bannerId) {
        if (this.unlockedBanners.includes(bannerId)) {
            this.equippedBanner = bannerId;
            this.saveStock();
            return true;
        }
        return false;
    }
}

const Shop = new ShopSystem();

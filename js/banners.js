class BannersSystem {
    constructor() {}

    applyBannerToElement(element, bannerId) {
        element.className = element.className.replace(/\bbanner-\S+/g, '');
        
        if (!bannerId) return;

        const bannerData = BANNERS_DATA.find(b => b.id === bannerId);
        if (bannerData) {
            element.classList.add(bannerData.cssClass);
        }
    }

    renderBannerPreview(container, bannerId) {
        const bannerData = BANNERS_DATA.find(b => b.id === bannerId);
        if (!bannerData) return;

        container.className = `banner-preview ${bannerData.cssClass}`;
        container.innerHTML = `
            <div class="banner-name" style="color: ${RARITY_COLORS[bannerData.rarity]}">${bannerData.name}</div>
        `;
    }
}

const Banners = new BannersSystem();

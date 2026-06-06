function toast(msg, type='success') {
    const t = document.createElement('div');
    t.className = `tom-toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

const Shop = {
    open() {
        if (!Users.current) { toast('¡Selecciona un usuario primero!', 'error'); return; }
        this.render();
        const ov = document.getElementById('shop-overlay');
        if (ov) ov.classList.add('open');
    },
    close() {
        const ov = document.getElementById('shop-overlay');
        if (ov) ov.classList.remove('open');
    },
    render() {
        const grid = document.getElementById('shop-grid');
        if (!grid || !Users.data) return;
        grid.innerHTML = '';

        const bal = document.getElementById('shop-bal');
        if (bal) bal.textContent = Users.data.coins;

        BANNERS.forEach(b => {
            const rows = Storage.getLeaderboard ? Storage.getLeaderboard() : [];
            const isTop1 = rows.length > 0 && rows[0].name === Users.current;
            const isTopBanner = b.id === 'royal_zenith' || b.id === 'celestial_king';
            const owned = (Users.data.ownedBanners || []).includes(b.id) || (isTopBanner && isTop1);
            const equipped = Users.data.equippedBanner === b.id;
            const rar = getRarity(b.rarity);

            const card = document.createElement('div');
            card.className = 'shop-card' + (owned ? ' owned' : '') + (equipped ? ' equipped-card' : '');

            const prev = document.createElement('div');
            prev.className = `card-banner-preview ${b.css}`;
            prev.textContent = b.name;
            card.appendChild(prev);

            const nm = document.createElement('div');
            nm.className = 'card-name';
            nm.textContent = b.name;
            card.appendChild(nm);

            const rt = document.createElement('div');
            rt.className = `card-rarity rarity-tag rarity-${b.rarity}`;
            rt.textContent = b.rarity;
            card.appendChild(rt);

            const pr = document.createElement('div');
            pr.className = 'card-price' + (owned ? ' owned-label' : '');
            pr.textContent = owned ? (equipped ? '✓ EQUIPADO' : '✓ TUYO') : `🪙 ${b.price}`;
            card.appendChild(pr);

            const btn = document.createElement('button');
            btn.className = 'card-btn';
            if (!owned) {
                btn.classList.add('btn-buy');
                btn.textContent = 'COMPRAR';
                btn.onclick = () => this.buy(b.id);
            } else if (equipped) {
                btn.classList.add('btn-unequip');
                btn.textContent = 'DESEQUIPAR';
                btn.onclick = () => { Users.unequipBanner(); this.render(); };
            } else {
                btn.classList.add('btn-equip');
                btn.textContent = 'EQUIPAR';
                btn.onclick = () => { Users.equipBanner(b.id); this.render(); };
            }
            card.appendChild(btn);

            grid.appendChild(card);
        });
    },
    buy(id) {
        const b = getBanner(id);
        if (!b) return;
        if (Users.buyBanner(id)) {
            toast(`¡${b.name} desbloqueado!`, 'success');
            this.render();
        } else {
            toast('Arcane Coins insuficientes', 'error');
        }
    },
    redeemCode() {
        const input = document.getElementById('promo-code-input');
        const feedback = document.getElementById('promo-code-feedback');
        if (!input || !feedback) return;

        const enteredCode = input.value.trim().toUpperCase();
        if (!enteredCode) {
            feedback.textContent = '❌ INGRESA UN CÓDIGO';
            feedback.style.color = '#ff3300';
            return;
        }

        if (typeof CODES_DATA === 'undefined') {
            feedback.textContent = '❌ ERROR: CONFIG CÓDIGOS FALTA';
            feedback.style.color = '#ff3300';
            return;
        }

        const match = CODES_DATA.find(c => c.code.trim().toUpperCase() === enteredCode);

        if (!match) {
            feedback.textContent = '❌ CÓDIGO INVÁLIDO o INCORRECTO';
            feedback.style.color = '#ff3300';
            return;
        }

        if (match.expiresAt) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expDate = new Date(match.expiresAt);
            if (today > expDate) {
                feedback.textContent = '❌ ESTE CÓDIGO HA EXPIRADO';
                feedback.style.color = '#ff3300';
                return;
            }
        }

        if (!Users.current || !Users.data) {
            feedback.textContent = '❌ ERROR: SELECCIONA UN USUARIO PRIMERO';
            feedback.style.color = '#ff3300';
            return;
        }

        Users.data.redeemedCodes = Users.data.redeemedCodes || [];

        const enteredHash = btoa(enteredCode);
        if (Users.data.redeemedCodes.includes(enteredHash)) {
            feedback.textContent = '❌ ESTE CÓDIGO YA HA SIDO CANJEADO';
            feedback.style.color = '#ff3300';
            return;
        }

        const prizeCoins = match.coins || 0;
        
        if (prizeCoins > 3000) {
            feedback.textContent = '❌ ERROR DE SEGURIDAD';
            feedback.style.color = '#ff3300';
            return;
        }

        Users.addCoins(prizeCoins);
        Users.data.redeemedCodes.push(enteredHash);
        Users.save();

        const bal = document.getElementById('shop-bal');
        if (bal) bal.textContent = Users.data.coins;
        
        feedback.textContent = `✅ ¡CÓDIGO CANJEADO! +${prizeCoins} COINS`;
        feedback.style.color = '#00ff4c';
        input.value = '';

        if (typeof Users._updateHUD === 'function') Users._updateHUD();
        
        if (typeof saveToLeaderboard === 'function') {
            saveToLeaderboard(Users.current, 0);
        }

        toast(`¡Recibiste ${prizeCoins} Arcane Coins!`, 'success');
    }
};

const LB = {
    open() {
        this.render();
        const ov = document.getElementById('lb-overlay');
        if (ov) ov.classList.add('open');
    },
    close() {
        const ov = document.getElementById('lb-overlay');
        if (ov) ov.classList.remove('open');
    },
    render() {
        const list = document.getElementById('lb-list');
        if (!list) return;
        list.innerHTML = '';

        const rows = Storage.getLeaderboard();
        if (rows.length === 0) {
            list.innerHTML = '<p style="font-size:0.7em;color:#aaa;text-align:center;padding:30px 10px">¡Aún no hay puntajes locales!<br><br>Juega una partida y aparece aquí.</p>';
            return;
        }

        const medals = ['🥇','🥈','🥉'];
        rows.slice(0, 20).forEach((r, i) => {
            const row = document.createElement('div');
            row.className = 'lb-row' + (i === 0 ? ' rank-1' : '');

            const rank = document.createElement('span');
            rank.className = 'lb-rank';
            rank.textContent = medals[i] || `#${i+1}`;
            row.appendChild(rank);

            const name = document.createElement('span');
            name.className = 'lb-name';
            if (i === 0) {
                name.classList.add('top1-aura');
                const crownHtml = document.createElement('span');
                crownHtml.textContent = '👑 ';
                crownHtml.style.cssText = 'font-size:1.3em; margin-right:4px;';
                name.appendChild(crownHtml);
            }
            if (r.banner) {
                const b = getBanner(r.banner);
                if (b) row.classList.add(b.css);
            }
            name.appendChild(document.createTextNode(r.name));
            row.appendChild(name);

            const score = document.createElement('span');
            score.className = 'lb-score';
            score.textContent = r.score + ' pts';
            if (i === 0) score.style.cssText = 'color:#ffd700; font-size:1.1em; font-weight:bold;';
            row.appendChild(score);

            list.appendChild(row);
        });
    },
    renderTop3() {
        const el = document.getElementById('top3-list');
        if (!el) return;
        const rows = Storage.getLeaderboard().slice(0, 3);
        if (rows.length === 0) { el.innerHTML = '<p style="color:#888;font-size:0.6em;">Sin puntajes aún</p>'; return; }
        const medals = ['🥇','🥈','🥉'];
        el.innerHTML = rows.map((r, i) => {
            const b = r.banner ? getBanner(r.banner) : null;
            const cls = b ? b.css : '';
            const top = i === 0 ? 'top1-aura' : '';
            return `<div style="font-size:0.6em;margin:4px 0">${medals[i]} <span class="${cls} ${top}">${r.name}</span> <span style="color:#ffcc00">${r.score}</span></div>`;
        }).join('');
    }
};

window.shopSwitchTab = function(tab) {
    var secBanners = document.getElementById('shop-section-banners');
    var secRunas = document.getElementById('shop-section-runas');
    var tabBanners = document.getElementById('tab-banners');

    var submenuBanners = document.getElementById('submenu-banners');
    var submenuRunas = document.getElementById('submenu-runas');
    var tabRunas = document.getElementById('tab-runas');

    var shopPanel = document.querySelector('.shop-panel');

    if (tab === 'runas') {
        if (secBanners) secBanners.style.display = 'none';
        if (secRunas) secRunas.style.display = 'block';
        if (tabBanners) {
            tabBanners.classList.remove('active');
            tabBanners.innerHTML = '🔮 RUNAS ▾';
        }
        if (tabRunas) tabRunas.classList.add('active');
        if (submenuBanners) submenuBanners.classList.remove('active');
        if (submenuRunas) submenuRunas.classList.add('active');
        if (shopPanel) shopPanel.classList.remove('theme-beach');
    } else {
        if (secRunas) secRunas.style.display = 'none';
        if (secBanners) secBanners.style.display = 'block';
        if (tabBanners) {
            tabBanners.classList.add('active');
            tabBanners.innerHTML = '🎖 ESTANDARTES ▾';
        }
        if (tabRunas) tabRunas.classList.remove('active');
        if (submenuBanners) submenuBanners.classList.add('active');
        if (submenuRunas) submenuRunas.classList.remove('active');
        if (shopPanel) shopPanel.classList.add('theme-beach');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const shopBtn = document.getElementById('hud-shop-btn');
    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            shopSwitchTab('banners');
            Shop.open();
        });
    }

    const closeShop = document.getElementById('close-shop');
    if (closeShop) closeShop.addEventListener('click', () => Shop.close());

    const closeLB = document.getElementById('close-lb');
    if (closeLB) closeLB.addEventListener('click', () => LB.close());

    document.getElementById('shop-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'shop-overlay') Shop.close();
    });
    document.getElementById('lb-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'lb-overlay') LB.close();
    });

    const promoBtn = document.getElementById('promo-code-btn');
    if (promoBtn) {
        promoBtn.addEventListener('click', () => Shop.redeemCode());
    }
    const promoInput = document.getElementById('promo-code-input');
    if (promoInput) {
        promoInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') Shop.redeemCode();
        });
    }

    // Click toggles submenu class to support mobile touch devices
    var tabBannersBtn = document.getElementById('tab-banners');
    if (tabBannersBtn) {
        tabBannersBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var wrapper = this.parentNode;
            if (wrapper) {
                wrapper.classList.toggle('open');
            }
        });
    }

    // Close submenu when clicking anywhere outside
    document.addEventListener('click', function () {
        var wrapper = document.querySelector('.shop-tab-wrapper');
        if (wrapper) {
            wrapper.classList.remove('open');
        }
    });

    // Lobby music reloader when returning to menu
    var returnMenuBtn = document.getElementById('return-menu-btn');
    if (returnMenuBtn) {
        returnMenuBtn.addEventListener('click', function () {
            setTimeout(function () {
                if (window.UI) {
                    UI.stopSound('background');
                    UI.playSound('lobby');
                    UI.playSound('lobby-seagulls');
                }
            }, 300);
        });
    }
});

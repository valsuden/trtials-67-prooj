// =============================================================================
// =============================================================================
// =============================================================================

class LeaderboardSystem {
    constructor() {}

    getRankedUsers() {
        if (typeof Storage === 'undefined') return [];
        var users = Storage.getAllUsers();
        var ranked = [];
        for (var name in users) {
            if (name === 'Guest') continue;
            var u = users[name];
            var score = u.highScore || u.highestScore || 0;
            if (score > 0) {
                ranked.push({ name: name, score: score, banner: u.equippedBanner || null });
            }
        }
        ranked.sort(function (a, b) { return b.score - a.score; });
        return ranked;
    }

    renderTop3() {
        if (typeof LB !== 'undefined' && typeof LB.renderTop3 === 'function') {
            LB.renderTop3();
            return;
        }
        var list = document.getElementById('top3-list');
        if (!list) return;
        var ranked = this.getRankedUsers().slice(0, 3);
        if (ranked.length === 0) {
            list.innerHTML = '<p style="color:gray;font-size:0.6em;">Sin puntajes aún.</p>';
            return;
        }
        var medals = ['🥇', '🥈', '🥉'];
        list.innerHTML = ranked.map(function (p, i) {
            return '<div style="font-size:0.6em;margin:4px 0">' + medals[i] + ' ' + p.name +
                ' <span style="color:#ffcc00">' + p.score + '</span></div>';
        }).join('');
    }

    fetchTop3() {
        this.renderTop3();
    }

    openLeaderboard() {
        if (typeof LB !== 'undefined' && typeof LB.open === 'function') {
            LB.open();
        }
    }

    closeLeaderboard() {
        if (typeof LB !== 'undefined' && typeof LB.close === 'function') {
            LB.close();
        }
    }
}

const Leaderboard = new LeaderboardSystem();

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        Leaderboard.fetchTop3();
    }, 600);
});

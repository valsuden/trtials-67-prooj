class UIManager {
    constructor() {
        this.sounds = {};
    }

    init() {
        this.sounds = {
            correct: document.getElementById('correct-sound'),
            incorrect: document.getElementById('incorrect-sound'),
            victory: document.getElementById('victory-sound'),
            lobby: document.getElementById('lobby-music'),
            'lobby-seagulls': document.getElementById('lobby-seagulls'),
            background: document.getElementById('background-music')
        };

        // Load highest score from localStorage
        const highestScore = localStorage.getItem('highestScore') || 0;
        const highestScoreEl = document.getElementById('highest-score');
        if (highestScoreEl) highestScoreEl.textContent = highestScore;

        // Start screen click event to trigger lobby music
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.addEventListener('click', () => {
                startScreen.style.display = 'none';
                this.playSound('lobby');
                this.playSound('lobby-seagulls');
            });
        }

        // Live clock updating
        const updateGameClock = () => {
            const now = new Date();
            const options = {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            };
            const clockEl = document.getElementById('game-clock');
            if (clockEl) clockEl.textContent = now.toLocaleString('en-US', options);
        };
        updateGameClock();
        setInterval(updateGameClock, 1000);

        document.addEventListener('coinsUpdated', (e) => {
            var displays = document.querySelectorAll('.coins-display, #hud-coins-val, #shop-bal');
            displays.forEach(function (d) { d.textContent = e.detail.amount; });
        });

        if (typeof Security !== 'undefined') {
            Security.setCoins(Security.getCoins());
        }
    }

    playSound(soundName) {
        var snd = this.sounds[soundName];
        if (snd) {
            try { 
                snd.currentTime = 0; 
                snd.volume = 1.0;
                snd.play().catch(function () {}); 
            } catch (e) {}
        }
    }

    stopSound(soundName) {
        var snd = this.sounds[soundName];
        if (snd) {
            try {
                snd.pause();
                snd.currentTime = 0;
            } catch (e) {}
        }
    }

    updateTimer(timeLeft, isStreakActive) {
        const timerCircle = document.getElementById('timer');
        if (!timerCircle) return;
        timerCircle.textContent = timeLeft;

        // Only change background color if no streak effects are active
        if (!timerCircle.classList.contains('timer-streak') && !isStreakActive) {
            if (timeLeft <= 5) {
                timerCircle.style.backgroundColor = 'red';
            } else if (timeLeft <= 30) {
                timerCircle.style.backgroundColor = 'yellow';
            } else {
                timerCircle.style.backgroundColor = 'green';
            }
        }
        timerCircle.classList.add('timer-smooth');
    }

    updateEnergyDisplay(magicEnergy) {
        let energyDisplay = document.getElementById('energy-display');

        if (!energyDisplay) {
            energyDisplay = document.createElement('div');
            energyDisplay.id = 'energy-display';
            energyDisplay.style.cssText = `
                font-size: 1.1em;
                margin-bottom: 15px;
                color: #00ff4c;
                text-align: center;
            `;
            const levelTitle = document.getElementById('level-title');
            if (levelTitle && levelTitle.parentNode) {
                levelTitle.parentNode.insertBefore(energyDisplay, levelTitle.nextSibling);
            }
        }

        let energySymbols = '';
        for (let i = 0; i < 5; i++) {
            if (i < magicEnergy) {
                energySymbols += '💎 ';
            } else {
                energySymbols += '💀 ';
            }
        }

        energyDisplay.innerHTML = `Magic Energy: ${energySymbols}`;

        if (magicEnergy <= 1) {
            energyDisplay.style.color = '#ff0000';
        } else if (magicEnergy <= 2) {
            energyDisplay.style.color = '#ff9900';
        } else {
            energyDisplay.style.color = '#00ff4c';
        }
    }

    updateScore(score) {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = score;
    }

    updateWordCounter(wordIndex, totalWords) {
        const progressEl = document.getElementById('current-word-num');
        if (progressEl) progressEl.textContent = Math.min(wordIndex + 1, totalWords);
    }

    showWord(word) {
        const display = document.getElementById('word-to-translate');
        if (display) {
            display.textContent = word;
            display.setAttribute('translate', 'no');
        }
    }

    setFeedback(text, color, isCorrect = null) {
        const feedbackEl = document.getElementById('feedback');
        if (!feedbackEl) return;
        feedbackEl.textContent = text;
        feedbackEl.style.color = color || '';

        feedbackEl.classList.remove('correct-fb', 'wrong-fb');
        if (isCorrect === true) {
            feedbackEl.classList.add('correct-fb');
        } else if (isCorrect === false) {
            feedbackEl.classList.add('wrong-fb');
        }
    }

    showEventNotification(title, message) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(45deg, #ff6b35, #f7931e);
                color: white;
                padding: 20px;
                border-radius: 15px;
                border: 3px solid #ffcc00;
                text-align: center;
                z-index: 10000;
                font-size: 1.2em;
                animation: pulse 0.5s ease-in-out;
            ">
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 3000);
    }

    showNotification(title, message, type) {
        type = type || 'info';
        var notif = document.createElement('div');
        notif.className = 'notification ' + type;
        notif.innerHTML = '<strong>' + title + '</strong><br><span>' + message + '</span>';
        document.body.appendChild(notif);
        setTimeout(function () {
            notif.classList.add('fade-out');
            setTimeout(function () { notif.remove(); }, 500);
        }, 3000);
    }

    updateHUD(coins) {
        const c = document.getElementById('hud-coins-val');
        if (c) c.textContent = coins;
    }
}

const UI = new UIManager();
window.UI = UI;

document.addEventListener('DOMContentLoaded', function () {
    UI.init();
});

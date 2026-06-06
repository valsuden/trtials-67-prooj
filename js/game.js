// =============================================================================
// GAME SYSTEM — Trials of Mastery
// =============================================================================
(function() {
    'use strict';

    window.Game = {
        // Core game state
        currentLevel: 0,
        playerName: 'Player',
        score: 0,
        levelScore: 0,
        timeLeft: 0,
        timerInterval: null,
        currentWord: '',
        selectedWords: [],
        wordIndex: 0,

        // Power-ups
        bonusTimeUsed: false,
        skipWordUsed: false,

        // Error & state management
        errorCount: 0,
        magicEnergy: 5,
        isRecovering: false,
        difficultWords: {},
        wordFailCount: {},
        usedWordsByLevel: {},
        sessionMistakeWords: new Set(),
        isFTFromGameOver: false,

        // Events
        eventActive: false,
        currentEvent: null,
        eventTimeLeft: 0,

        // Streaks
        currentStreak: 0,
        maxStreak: 0,
        streakLevels: [3, 5, 7, 10],

        // Recovery System
        recoveryWords: [],
        recoveryWordsCorrect: 0,
        currentRecoveryIndex: 0,

        // Focus Training
        ftWords: [],
        ftIndex: 0,

        // Settings
        musicEnabled: true,

        init() {
            // Bind buttons
            const startBtn = document.getElementById('start-btn');
            if (startBtn) startBtn.addEventListener('click', () => this.startGame());

            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) submitBtn.addEventListener('click', () => this.checkAnswer());

            const nextLevelBtn = document.getElementById('next-level-btn');
            if (nextLevelBtn) nextLevelBtn.addEventListener('click', () => this.loadNextLevel());

            const answerInput = document.getElementById('answer');
            if (answerInput) {
                answerInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.checkAnswer();
                });
            }

            const tryAgainBtn = document.getElementById('try-again-btn');
            if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => this.tryAgain());

            // Events for power-up buttons
            const bonusTimeBtn = document.getElementById('bonus-time-btn');
            if (bonusTimeBtn) bonusTimeBtn.addEventListener('click', () => this.addBonusTime());

            const skipWordBtn = document.getElementById('skip-word-btn');
            if (skipWordBtn) skipWordBtn.addEventListener('click', () => this.skipWord());

            const ftAnswerInput = document.getElementById('ft-answer');
            if (ftAnswerInput) {
                ftAnswerInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const ftSubmitBtn = document.getElementById('ft-submit-btn');
                        if (ftSubmitBtn) ftSubmitBtn.click();
                    }
                });
            }
        },

        startGame() {
            // Hide the game image when starting the game
            const headerImage = document.getElementById('game-header-image');
            if (headerImage) headerImage.classList.add('hidden');
            
            // Ocultar el botón del leaderboard durante el juego
            const viewLB = document.getElementById('view-leaderboard-start');
            if (viewLB) viewLB.classList.add('hidden');

            // Pausa lobby music y arranca música del juego
            if (window.UI) {
                UI.stopSound('lobby');
                UI.stopSound('lobby-seagulls');
                if (this.musicEnabled) {
                    setTimeout(() => {
                        UI.playSound('background');
                    }, 500);
                }
            }

            // Get player name
            const nameInput = document.getElementById('player-name-input');
            this.playerName = (nameInput && nameInput.value.trim()) || 'Player';
            
            const display = document.getElementById('player-name-display');
            if (display) display.textContent = this.playerName;

            if (typeof Users !== 'undefined' && Users._applyBannerToName) {
                Users._applyBannerToName();
            }

            this.currentLevel = 0;
            this.score = 0;
            if (window.UI) UI.updateScore(this.score);

            const setupSection = document.getElementById('player-setup');
            if (setupSection) setupSection.classList.add('hidden');
            
            const startBtn = document.getElementById('start-btn');
            if (startBtn) startBtn.classList.add('hidden');
            
            const gameContainer = document.getElementById('game');
            if (gameContainer) gameContainer.classList.remove('hidden');
            
            const completeContainer = document.getElementById('level-complete');
            if (completeContainer) completeContainer.classList.add('hidden');
            
            const gameOverContainer = document.getElementById('game-over');
            if (gameOverContainer) gameOverContainer.classList.add('hidden');

            // Reset power-ups
            this.resetPowerups();

            // Reset state
            this.errorCount = 0;
            this.sessionMistakeWords = new Set();
            this.magicEnergy = 5;
            this.isRecovering = false;
            
            try {
                this.difficultWords = JSON.parse(localStorage.getItem('difficultWords') || '{}');
                this.wordFailCount = JSON.parse(localStorage.getItem('wordFailCount') || '{}');
            } catch (e) {
                this.difficultWords = {};
                this.wordFailCount = {};
            }
            
            this.eventActive = false;
            this.currentEvent = null;
            this.currentStreak = 0;
            this.maxStreak = 0;

            if (typeof window.startTop3Updates === 'function') {
                window.startTop3Updates();
            }
            
            this.loadLevel();
        },

        loadLevel() {
            const viewLB = document.getElementById('view-leaderboard-start');
            if (viewLB) viewLB.classList.add('hidden');
            
            this.levelScore = 0;
            this.wordIndex = 0;

            // Reset power-ups for each level
            this.resetPowerups();

            // Reset error count for each level
            this.errorCount = 0;

            if (typeof levels !== 'undefined' && levels[this.currentLevel]) {
                const level = levels[this.currentLevel];
                const levelTitle = document.getElementById('level-title');
                if (levelTitle) levelTitle.textContent = level.name;
                
                this.timeLeft = level.time;
                if (window.UI) {
                    UI.updateTimer(this.timeLeft, this.currentStreak >= 3);
                    UI.updateEnergyDisplay(this.magicEnergy);
                }

                this.selectWordsWithDifficulty();
                this.nextWord();
                this.startTimer();
            }
        },

        loadNextLevel() {
            this.currentLevel++;
            if (typeof levels !== 'undefined' && this.currentLevel < levels.length) {
                const completeContainer = document.getElementById('level-complete');
                if (completeContainer) completeContainer.classList.add('hidden');
                this.loadLevel();
            } else {
                // Game completed
                this.updateHighestScore();
                this.showEpicVictoryScreen();
                
                const completeContainer = document.getElementById('level-complete');
                if (completeContainer) completeContainer.classList.add('hidden');
                
                const gameContainer = document.getElementById('game');
                if (gameContainer) gameContainer.classList.add('hidden');
                
                const setupSection = document.getElementById('player-setup');
                if (setupSection) setupSection.classList.remove('hidden');
                
                const startBtn = document.getElementById('start-btn');
                if (startBtn) startBtn.classList.remove('hidden');
                
                const viewLB = document.getElementById('view-leaderboard-start');
                if (viewLB) viewLB.classList.remove('hidden');

                const headerImage = document.getElementById('game-header-image');
                if (headerImage) headerImage.classList.remove('hidden');

                if (window.UI) {
                    UI.stopSound('background');
                }
            }
        },

        startTimer() {
            clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => {
                this.timeLeft--;
                if (window.UI) {
                    UI.updateTimer(this.timeLeft, this.currentStreak >= 3);
                }
                if (this.timeLeft <= 0) {
                    this.gameOver();
                }
            }, 1000);
        },

        nextWord() {
            if (this.wordIndex < this.selectedWords.length) {
                let next = this.selectedWords[this.wordIndex];

                // Evitar repetir la misma palabra si el arreglo no cambia correctamente
                if (next === this.currentWord) {
                    this.wordIndex++;
                    if (this.wordIndex >= this.selectedWords.length) {
                        this.levelComplete();
                        return;
                    }
                    next = this.selectedWords[this.wordIndex];
                }

                this.currentWord = next;
                if (window.UI) {
                    UI.showWord(this.currentWord);
                    UI.updateWordCounter(this.wordIndex, this.selectedWords.length);
                }
                
                const ans = document.getElementById('answer');
                if (ans) ans.value = '';
            } else {
                this.levelComplete();
            }
        },

        checkAnswer() {
            const ansInput = document.getElementById('answer');
            const userAnswer = (ansInput && ansInput.value.trim().toLowerCase()) || '';

            // Seleccionar el mapeo adecuado según modo de recuperación
            const currentWordsMapping = (typeof levels !== 'undefined' && levels[this.currentLevel]) ? levels[this.currentLevel].words : null;
            const recoveryWordsMapping = (typeof levels !== 'undefined' && levels[0]) ? levels[0].words : null;
            
            const mapping = this.isRecovering ? recoveryWordsMapping : currentWordsMapping;
            const correctAnswers = mapping ? mapping[this.currentWord] : undefined;

            // Si no hay mapeo para la palabra actual, registrar y tratar como incorrecta segura
            if (!Array.isArray(correctAnswers)) {
                console.warn('checkAnswer: no mapping found for word', this.currentWord, 'level', this.isRecovering ? 0 : this.currentLevel);
                if (window.UI) {
                    UI.setFeedback('No mapping for this word.', '#ff9900');
                }
                this.handleIncorrectAnswer([]);
                return;
            }

            // Comparar respuestas en minúsculas
            const normalized = correctAnswers.map(a => a.toLowerCase());
            if (normalized.includes(userAnswer)) {
                this.handleCorrectAnswer();
            } else {
                this.handleIncorrectAnswer(correctAnswers);
            }
        },

        handleCorrectAnswer() {
            if (this.isRecovering) {
                // Modo recuperación
                this.recoveryWordsCorrect++;
                this.currentRecoveryIndex++;

                if (window.UI) {
                    UI.setFeedback(`Correct! Energy recovering... (${this.recoveryWordsCorrect}/3)`, '#00ff00');
                    UI.playSound('correct');
                }

                if (this.recoveryWordsCorrect >= 3) {
                    this.completeEnergyRecovery();
                } else {
                    setTimeout(() => {
                        this.showNextRecoveryWord();
                    }, 1000);
                }
            } else {
                // Modo normal
                let pointsToAdd = 1;
                if (this.currentEvent === 'star_rain') {
                    pointsToAdd = 2; // Doble puntos durante lluvia de estrellas
                }

                this.score += pointsToAdd;
                this.levelScore += pointsToAdd;
                
                if (window.UI) {
                    UI.updateScore(this.score);
                    UI.setFeedback('Correct!', '#00ff00', true);
                    UI.playSound('correct');
                }
                // Award coins for correct answer
                if (typeof Users !== 'undefined') {
                    Users.addCoins(2);
                }

                this.wordIndex++;
                const ansInput = document.getElementById('answer');
                if (ansInput) ansInput.value = '';

                this.errorCount = 0;
                this.currentStreak++;
                if (this.currentStreak > this.maxStreak) {
                    this.maxStreak = this.currentStreak;
                }

                // Aplicar efectos visuales según la racha
                this.updateStreakVisuals();

                // Verificar evento sorpresa después de respuesta correcta
                this.checkForRandomEvent();

                setTimeout(() => {
                    this.nextWord();
                }, 500);
            }
        },

        handleIncorrectAnswer(correctAnswers) {
            if (this.isRecovering) {
                // Mostrar la respuesta correcta
                const correctAnswerText = correctAnswers.join(', ');
                if (window.UI) {
                    UI.setFeedback(`Incorrect! Correct: ${correctAnswerText}`, '#ff0000');
                    UI.playSound('incorrect');
                }

                setTimeout(() => {
                    const ansInput = document.getElementById('answer');
                    if (ansInput) ansInput.value = '';
                    this.currentRecoveryIndex++;
                    this.showNextRecoveryWord();
                }, 1500);
            } else {
                // Modo normal - reducir energía mágica
                this.magicEnergy--;
                
                if (window.UI) {
                    UI.updateEnergyDisplay(this.magicEnergy);
                    UI.playSound('incorrect');
                }

                // Trigger screen shake/flash VFX directly without MutationObserver
                if (window.Effects) {
                    Effects.triggerEnergyLossVFX();
                }

                // Reiniciar racha en respuesta incorrecta
                this.currentStreak = 0;
                this.removeStreakVisuals();

                // Marcar palabra como difícil
                this.markWordAsDifficult(this.currentWord);

                // Registrar fallo en la sesión
                this.sessionMistakeWords.add(this.currentWord);

                const correctAnswerText = correctAnswers.join(', ');
                if (window.UI) {
                    UI.setFeedback(`Energy lost! Correct: ${correctAnswerText}`, '#ff0000', false);
                }

                // Verificar si se acabó la energía
                if (this.magicEnergy <= 0) {
                    setTimeout(() => {
                        this.startEnergyRecovery();
                    }, 1000);
                    return;
                }

                // Continuar con palabra diferente
                setTimeout(() => {
                    const ansInput = document.getElementById('answer');
                    if (ansInput) ansInput.value = '';
                    this.showDifferentWord();
                }, 1500);
            }
        },

        completeEnergyRecovery() {
            const viewLB = document.getElementById('view-leaderboard-start');
            if (viewLB) viewLB.classList.add('hidden');
            
            this.magicEnergy = 3; // Recuperar energía parcialmente
            this.isRecovering = false;
            this.recoveryWordsCorrect = 0;

            // Restaurar interfaz normal
            if (typeof levels !== 'undefined' && levels[this.currentLevel]) {
                const levelTitle = document.getElementById('level-title');
                if (levelTitle) levelTitle.textContent = levels[this.currentLevel].name;
            }
            
            if (window.UI) {
                UI.setFeedback('Energy restored! Continue your trial!', '#00ff4c');
                UI.updateEnergyDisplay(this.magicEnergy);
            }

            // Reanudar timer
            this.startTimer();

            // Continuar con el juego normal
            setTimeout(() => {
                this.nextWord();
            }, 1500);
        },

        markWordAsDifficult(word) {
            if (!this.wordFailCount[word]) {
                this.wordFailCount[word] = 0;
            }

            this.wordFailCount[word]++;

            // Marcar como difícil después de 2 fallos
            if (this.wordFailCount[word] >= 2) {
                this.difficultWords[word] = true;
                console.log(`Palabra marcada como difícil: ${word}`);
                try {
                    localStorage.setItem('difficultWords', JSON.stringify(this.difficultWords));
                    localStorage.setItem('wordFailCount', JSON.stringify(this.wordFailCount));
                } catch(e) {}
            }
        },

        getDifficultWordsForLevel() {
            if (typeof levels === 'undefined' || !levels[this.currentLevel]) return [];
            const levelWords = Object.keys(levels[this.currentLevel].words);
            const difficultInThisLevel = levelWords.filter(word => this.difficultWords[word]);
            return difficultInThisLevel;
        },

        selectWordsWithDifficulty() {
            if (typeof levels === 'undefined' || !levels[this.currentLevel]) return;
            const level = levels[this.currentLevel];
            const allWords = Object.keys(level.words || {});
            
            if (!this.usedWordsByLevel[this.currentLevel]) {
                this.usedWordsByLevel[this.currentLevel] = new Set();
            }

            const difficultInLevel = this.getDifficultWordsForLevel();
            this.selectedWords = [];

            // Incluir hasta 4 difíciles
            let difficultCandidates = difficultInLevel.filter(w => !this.usedWordsByLevel[this.currentLevel].has(w));
            const numDifficult = Math.min(4, difficultCandidates.length);
            for (let i = 0; i < numDifficult; i++) {
                this.selectedWords.push(difficultCandidates[i]);
                if (this.wordFailCount[difficultCandidates[i]] >= 4) {
                    this.selectedWords.push(difficultCandidates[i]);
                }
                this.usedWordsByLevel[this.currentLevel].add(difficultCandidates[i]);
            }

            // Mezclar el resto
            let remainingWords = allWords.filter(w => !this.selectedWords.includes(w));
            for (let i = remainingWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remainingWords[i], remainingWords[j]] = [remainingWords[j], remainingWords[i]];
            }

            // Rellenar hasta 10
            for (let i = 0; i < remainingWords.length && this.selectedWords.length < 10; i++) {
                this.selectedWords.push(remainingWords[i]);
                this.usedWordsByLevel[this.currentLevel].add(remainingWords[i]);
            }

            // Si no llegamos a 10, reiniciar usadas y tomar más
            if (this.selectedWords.length < 10) {
                this.usedWordsByLevel[this.currentLevel].clear();
                remainingWords = allWords.filter(w => !this.selectedWords.includes(w));
                for (let i = 0; i < remainingWords.length && this.selectedWords.length < 10; i++) {
                    this.selectedWords.push(remainingWords[i]);
                    this.usedWordsByLevel[this.currentLevel].add(remainingWords[i]);
                }
            }

            // Barajar orden final evitando palabras difíciles consecutivas
            for (let i = this.selectedWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.selectedWords[i], this.selectedWords[j]] = [this.selectedWords[j], this.selectedWords[i]];
            }

            // Separar palabras repetidas para que no sean consecutivas
            for (let i = 1; i < this.selectedWords.length; i++) {
                if (this.selectedWords[i] === this.selectedWords[i - 1]) {
                    for (let j = i + 2; j < this.selectedWords.length; j++) {
                        if (this.selectedWords[j] !== this.selectedWords[i]) {
                            [this.selectedWords[i], this.selectedWords[j]] = [this.selectedWords[j], this.selectedWords[i]];
                            break;
                        }
                    }
                }
            }
        },

        checkForRandomEvent() {
            if (this.eventActive) return;
            const randomNum = Math.random() * 1000;
            if (randomNum < 5) {
                this.triggerEvent('legendary_power');
            } else if (randomNum < 15) {
                this.triggerEvent('star_rain');
            }
        },

        triggerEvent(eventType) {
            this.eventActive = true;
            this.currentEvent = eventType;

            if (eventType === 'star_rain') {
                this.startStarRainEvent();
            } else if (eventType === 'legendary_power') {
                this.startLegendaryPowerEvent();
            }
        },

        startStarRainEvent() {
            this.eventTimeLeft = 20;
            if (window.UI) {
                UI.showEventNotification('⭐ STAR RAIN EVENT! ⭐', 'Double points for 20 seconds!');
            }

            const eventInterval = setInterval(() => {
                this.eventTimeLeft--;
                this.updateEventDisplay();

                if (this.eventTimeLeft <= 0) {
                    this.endStarRainEvent();
                    clearInterval(eventInterval);
                }
            }, 1000);
        },

        startLegendaryPowerEvent() {
            const powers = [
                'Time Freeze: +30 seconds',
                'Energy Shield: +3 magic energy',
                'Word Reveal: See next 3 answers',
                'Double XP: 2x points for this level',
                'Phoenix Resurrection: Immunity to next 3 errors'
            ];

            const randomPower = powers[Math.floor(Math.random() * powers.length)];
            if (window.UI) {
                UI.showEventNotification('🌟 LEGENDARY POWER! 🌟', `You gained: ${randomPower}`);
            }

            this.applyLegendaryPower(randomPower);
            this.eventActive = false; // Los poderes legendarios son instantáneos
        },

        applyLegendaryPower(power) {
            if (power.includes('Time Freeze')) {
                this.timeLeft += 30;
                if (window.UI) UI.updateTimer(this.timeLeft, this.currentStreak >= 3);
            } else if (power.includes('Energy Shield')) {
                this.magicEnergy = Math.min(5, this.magicEnergy + 3);
                if (window.UI) UI.updateEnergyDisplay(this.magicEnergy);
            } else if (power.includes('Double XP')) {
                this.currentEvent = 'double_xp';
            }
        },

        endStarRainEvent() {
            this.eventActive = false;
            this.currentEvent = null;
            this.hideEventDisplay();
        },

        updateEventDisplay() {
            if (this.currentEvent === 'star_rain') {
                const minutes = Math.floor(this.eventTimeLeft / 60);
                const seconds = this.eventTimeLeft % 60;
                if (window.UI) {
                    UI.setFeedback(`⭐ STAR RAIN: ${minutes}:${seconds.toString().padStart(2, '0')} ⭐`, '#ffcc00');
                }
            }
        },

        hideEventDisplay() {
            const fb = document.getElementById('feedback');
            if (fb && fb.textContent.includes('STAR RAIN')) {
                fb.textContent = '';
            }
        },

        updateStreakVisuals() {
            const timerCircle = document.getElementById('timer');
            const container = document.querySelector('.container');
            const streakIndicator = this.getOrCreateStreakIndicator();

            if (!container || !timerCircle || !streakIndicator) return;

            container.classList.remove(
                'inferno-background',
                'stormy-background',
                'cosmic-background',
                'streak-glow'
            );
            timerCircle.classList.remove(
                'inferno-effect',
                'thunderstorm-effect',
                'energy-effect',
                'timer-streak'
            );
            document.body.style.background = '';

            timerCircle.classList.add('timer-smooth');

            if (this.currentStreak >= 60) {
                timerCircle.classList.add('timer-streak', 'energy-effect');
                container.classList.add('streak-glow', 'cosmic-background');
                streakIndicator.textContent = `🌌 COSMIC STREAK: ${this.currentStreak} 🌌`;
                streakIndicator.style.color = '#bb00ff';

                for (let i = 0; i < 20; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.top = Math.random() * container.offsetHeight + "px";
                    particle.style.left = Math.random() * container.offsetWidth + "px";
                    container.appendChild(particle);
                    setTimeout(() => particle.remove(), 2000);
                }
            } else if (this.currentStreak >= 40) {
                timerCircle.classList.add('timer-streak', 'energy-effect', 'thunderstorm-effect');
                container.classList.add('streak-glow', 'stormy-background');
                streakIndicator.textContent = `⚡ THUNDERSTORM STREAK: ${this.currentStreak} ⚡`;
                streakIndicator.style.color = '#00ccff';
                streakIndicator.style.textShadow = '0 0 10px #00ccff';
            } else if (this.currentStreak >= 20) {
                timerCircle.classList.add('timer-streak', 'energy-effect', 'inferno-effect');
                container.classList.add('streak-glow', 'inferno-background');
                streakIndicator.textContent = `🔥 INFERNO STREAK: ${this.currentStreak} 🔥`;
                streakIndicator.style.color = '#ff3300';
                document.body.style.background = "linear-gradient(45deg, #660000, #ff3300, #660000)";
            } else if (this.currentStreak >= 10) {
                timerCircle.classList.add('timer-streak', 'energy-effect');
                container.classList.add('streak-glow');
                streakIndicator.textContent = `🔥 MASTER STREAK: ${this.currentStreak} 🔥`;
                streakIndicator.style.color = '#ff6b35';
            } else if (this.currentStreak >= 7) {
                timerCircle.classList.add('timer-streak');
                container.classList.add('streak-glow');
                streakIndicator.textContent = `⚡ LIGHTNING STREAK: ${this.currentStreak} ⚡`;
                streakIndicator.style.color = '#ffcc00';
            } else if (this.currentStreak >= 5) {
                timerCircle.classList.add('timer-streak');
                streakIndicator.textContent = `💫 SPEED STREAK: ${this.currentStreak} 💫`;
                streakIndicator.style.color = '#00ff4c';
            } else if (this.currentStreak >= 3) {
                timerCircle.style.background = 'linear-gradient(45deg, #00ff4c, #33ff66)';
                timerCircle.style.boxShadow = '0 0 10px #00ff4c';
                streakIndicator.textContent = `✨ STREAK: ${this.currentStreak} ✨`;
                streakIndicator.style.color = '#00ff4c';
            } else {
                this.removeStreakVisuals();
            }
        },

        removeStreakVisuals() {
            const timerCircle = document.getElementById('timer');
            const container = document.querySelector('.container');
            const streakIndicator = this.getOrCreateStreakIndicator();

            if (!timerCircle || !container || !streakIndicator) return;

            timerCircle.classList.remove(
                'timer-streak',
                'energy-effect',
                'inferno-effect',
                'thunderstorm-effect'
            );

            container.classList.remove(
                'streak-glow',
                'inferno-background',
                'stormy-background',
                'cosmic-background'
            );

            document.querySelectorAll('.particle, .lightning-overlay, .ripple, .fire-spark, .lightning-bolt').forEach(el => el.remove());

            streakIndicator.textContent = '';
            streakIndicator.style.color = '';
            streakIndicator.style.textShadow = '';

            timerCircle.style.background = '';
            timerCircle.style.backgroundColor = '';
            timerCircle.style.boxShadow = '';
            timerCircle.style.border = '';

            document.body.style.background = '';

            setTimeout(() => {
                if (window.UI) UI.updateTimer(this.timeLeft, false);
            }, 50);
        },

        getOrCreateStreakIndicator() {
            let indicator = document.getElementById('streak-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'streak-indicator';
                indicator.className = 'streak-indicator';
                const timer = document.getElementById('timer');
                if (timer && timer.parentNode) {
                    timer.parentNode.insertBefore(indicator, timer.nextSibling);
                }
            }
            return indicator;
        },

        levelComplete() {
            clearInterval(this.timerInterval);
            const levelScoreEl = document.getElementById('level-score');
            if (levelScoreEl) levelScoreEl.textContent = this.score;

            const levelCompleteContent = document.querySelector('.level-complete-content');
            const nextButton = document.getElementById('next-level-btn');

            if (!levelCompleteContent || !nextButton) return;

            // Limpiar cualquier elemento previo
            const prevDT = document.getElementById('level-complete-datetime');
            if (prevDT) prevDT.remove();

            const existingStreak = document.getElementById('current-streak-display');
            if (existingStreak) existingStreak.remove();

            // Mostrar racha actual si aplica
            if (this.currentStreak > 0) {
                const streakDisplay = document.createElement('p');
                streakDisplay.id = 'current-streak-display';
                streakDisplay.innerHTML = `Current Streak: ${this.currentStreak}`;
                streakDisplay.style.color = '#ffcc00';
                streakDisplay.style.fontSize = '1em';
                streakDisplay.style.marginTop = '10px';
                levelCompleteContent.insertBefore(streakDisplay, nextButton);
            }

            // Agregar fecha y hora actual
            const levelDateTime = document.createElement('p');
            levelDateTime.id = 'level-complete-datetime';
            levelDateTime.style.cssText = 'font-size: 0.7em; color: #00ff4c; margin-top: 10px;';
            levelDateTime.textContent = new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            levelCompleteContent.insertBefore(levelDateTime, nextButton);

            if (this.currentEvent === 'double_xp') {
                this.levelScore *= 2;
                this.score += this.levelScore;
                if (window.UI) {
                    UI.updateScore(this.score);
                }
                if (levelScoreEl) levelScoreEl.textContent = this.levelScore;
            }

            const completeContainer = document.getElementById('level-complete');
            if (completeContainer) completeContainer.classList.remove('hidden');

            if (window.UI) {
                UI.playSound('victory');
            }
            // Award coins for completing a level
            if (typeof Users !== 'undefined') {
                Users.addCoins(10);
                // Bonus for perfect streak of 70
                if (this.currentStreak >= 70) {
                    Users.addCoins(40);
                }
            }

            try {
                localStorage.setItem('difficultWords', JSON.stringify(this.difficultWords));
                localStorage.setItem('wordFailCount', JSON.stringify(this.wordFailCount));
            } catch(e) {}
        },

        gameOver() {
            const viewLB = document.getElementById('view-leaderboard-start');
            if (viewLB) viewLB.classList.remove('hidden');
            
            clearInterval(this.timerInterval);

            if (typeof window.retrySendPending === 'function') {
                window.retrySendPending();
            }
            if (typeof window.startTop3Updates === 'function') {
                window.startTop3Updates();
            }
            if (typeof window.saveToLeaderboard === 'function') {
                window.saveToLeaderboard(this.playerName, this.score);
            }

            this.removeStreakVisuals();
            this.currentStreak = 0;
            this.maxStreak = 0;
            this.updateHighestScore();

            // Añadir fecha y hora en la pantalla de Game Over
            const existingFinalDt = document.getElementById('final-datetime');
            if (existingFinalDt) existingFinalDt.remove();
            
            const finalDateTime = document.createElement('p');
            finalDateTime.id = 'final-datetime';
            finalDateTime.style.cssText = 'font-size: 0.8em; color: #ff3333; margin-top: 10px;';
            finalDateTime.textContent = new Date().toLocaleString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            
            const goContent = document.querySelector('.game-over-content');
            if (goContent) goContent.appendChild(finalDateTime);

            const finalScoreEl = document.getElementById('final-score');
            if (finalScoreEl) finalScoreEl.textContent = this.score;

            // Mostrar las 3 palabras más problemáticas
            this.showFocusWordsFeedback();

            // Verificar si se activa Focus Training (al menos 3 palabras falladas en esta sesión y hay palabras para entrenar)
            var focusWords = this.getFocusWords().filter((w) => !this.checkWordMastered(w));
            if (this.sessionMistakeWords.size >= 3 && focusWords.length > 0) {
                this.showFocusTraining(true);
            } else {
                this.showGameOverScreenDirectly();
            }
        },

        showGameOverScreenDirectly() {
            const goContainer = document.getElementById('game-over');
            if (goContainer) goContainer.classList.remove('hidden');

            if (typeof window.showLeaderboard === 'function') {
                window.showLeaderboard();
            }

            const setupSection = document.getElementById('player-setup');
            if (setupSection) setupSection.classList.remove('hidden');

            const startBtn = document.getElementById('start-btn');
            if (startBtn) startBtn.classList.remove('hidden');

            const gameContainer = document.getElementById('game');
            if (gameContainer) gameContainer.classList.add('hidden');

            const headerImage = document.getElementById('game-header-image');
            if (headerImage) headerImage.classList.remove('hidden');

            if (window.UI) {
                UI.stopSound('background');
                if (this.musicEnabled) {
                    UI.playSound('lobby');
                    UI.playSound('lobby-seagulls');
                }
            }
        },

        startEnergyRecovery() {
            this.isRecovering = true;
            clearInterval(this.timerInterval); // Pausar el timer principal

            const wordDisplay = document.getElementById('word-to-translate');
            if (wordDisplay) wordDisplay.textContent = 'RECOVERING ENERGY...';

            const levelTitle = document.getElementById('level-title');
            if (levelTitle) levelTitle.textContent = 'Energy Recovery';

            if (window.UI) {
                UI.setFeedback('Answer 3 easy words correctly to restore your magic energy!', '#00ff4c');
            }

            // Reiniciar contador de errores para la recuperación
            this.errorCount = 0;
            this.recoveryWordsCorrect = 0;

            // Seleccionar palabras fáciles para recuperación
            this.selectRecoveryWords();
            this.showNextRecoveryWord();
        },

        selectRecoveryWords() {
            if (typeof levels === 'undefined' || !levels[0]) return;
            const easyWords = Object.keys(levels[0].words);

            for (let i = easyWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [easyWords[i], easyWords[j]] = [easyWords[j], easyWords[i]];
            }

            this.recoveryWords = easyWords.slice(0, 5);
            this.currentRecoveryIndex = 0;
        },

        showNextRecoveryWord() {
            if (this.currentRecoveryIndex < this.recoveryWords.length) {
                this.currentWord = this.recoveryWords[this.currentRecoveryIndex];
                if (window.UI) {
                    UI.showWord(this.currentWord);
                    UI.setFeedback(`Recovery word ${this.recoveryWordsCorrect + 1}/3`, '#00ff4c');
                }
                
                const ansInput = document.getElementById('answer');
                if (ansInput) ansInput.value = '';
            } else {
                this.gameOver();
            }
        },

        tryAgain() {
            if (typeof window.stopTop3Updates === 'function') {
                window.stopTop3Updates();
            }
            const goContainer = document.getElementById('game-over');
            if (goContainer) goContainer.classList.add('hidden');
            this.startGame();
        },

        showDifferentWord() {
            if (!Array.isArray(this.selectedWords) || this.selectedWords.length === 0) {
                this.selectWordsWithDifficulty();
            }

            let pool = this.selectedWords.filter(w => w !== this.currentWord);

            if (pool.length === 0) {
                this.selectWordsWithDifficulty();
                pool = this.selectedWords.filter(w => w !== this.currentWord);
            }

            if (pool.length === 0) {
                console.warn('No hay palabras disponibles para este nivel:', this.currentLevel);
                return;
            }

            const next = pool[Math.floor(Math.random() * pool.length)];
            this.currentWord = next;

            if (!this.usedWordsByLevel[this.currentLevel]) {
                this.usedWordsByLevel[this.currentLevel] = new Set();
            }
            this.usedWordsByLevel[this.currentLevel].add(this.currentWord);

            if (window.UI) {
                UI.showWord(this.currentWord);
            }

            const ansInput = document.getElementById('answer');
            if (ansInput) ansInput.value = '';
        },

        addBonusTime() {
            if (!this.bonusTimeUsed) {
                this.timeLeft += 10;
                if (window.UI) {
                    UI.updateTimer(this.timeLeft, this.currentStreak >= 3);
                    UI.playSound('correct');
                }
                this.bonusTimeUsed = true;
                const bonusBtn = document.getElementById('bonus-time-btn');
                if (bonusBtn) bonusBtn.classList.add('disabled');
            }
        },

        skipWord() {
            if (!this.skipWordUsed) {
                this.wordIndex++;
                const ansInput = document.getElementById('answer');
                if (ansInput) ansInput.value = '';
                
                this.skipWordUsed = true;
                const skipBtn = document.getElementById('skip-word-btn');
                if (skipBtn) skipBtn.classList.add('disabled');

                if (window.UI) {
                    UI.playSound('correct');
                }

                this.nextWord();
            }
        },

        resetPowerups() {
            this.bonusTimeUsed = false;
            this.skipWordUsed = false;
            
            const bonusBtn = document.getElementById('bonus-time-btn');
            if (bonusBtn) bonusBtn.classList.remove('disabled');
            
            const skipBtn = document.getElementById('skip-word-btn');
            if (skipBtn) skipBtn.classList.remove('disabled');
        },

        updateHighestScore() {
            const currentHighest = localStorage.getItem('highestScore') || 0;
            if (this.score > currentHighest) {
                try {
                    localStorage.setItem('highestScore', this.score);
                } catch(e) {}
                const hEl = document.getElementById('highest-score');
                if (hEl) hEl.textContent = this.score;
            }
        },

        showEpicVictoryScreen() {
            // Se actualiza endpoint para victoria
            window.leaderboardAPI = "https://script.google.com/macros/s/AKfycbyY727Fzocbl1rqRn5xWTckw_RqtRXOrdQNfaEDELi8R41NKzgIVPCHrQGYbGswVukMHA/exec";
            if (typeof window.saveToLeaderboard === 'function') {
                window.saveToLeaderboard(this.playerName, this.score);
            }

            const epicContainer = document.createElement('div');
            epicContainer.id = 'epic-victory-screen';
            epicContainer.innerHTML = `
                <div class="epic-overlay">
                    <div class="epic-content">
                        <div class="epic-title">🏆 LEGENDARY MASTER! 🏆</div>
                        <div class="epic-subtitle">You have conquered ALL trials!</div>
                        
                        <div class="stats-container">
                            <div class="stat-item">
                                <span class="stat-label">FINAL SCORE:</span>
                                <span class="stat-value epic-score">${this.score}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">HIGHEST STREAK:</span>
                                <span class="stat-value epic-streak">${this.maxStreak}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">MASTERY LEVEL:</span>
                                <span class="stat-value epic-level">LEGENDARY</span>
                            </div>
                        </div>
                        
                        <div class="epic-message">
                            You are now a TRUE WORD MASTER FROM ARCANIS!<br>
                            Your legend will be remembered forever! 🌟
                        </div>
                        
                        <button class="epic-button" id="claim-glory-btn">
                            ✨ CLAIM YOUR GLORY ✨
                        </button>
                    </div>
                    
                    <div class="particles-container">
                        <div class="particle"></div><div class="particle"></div>
                        <div class="particle"></div><div class="particle"></div>
                        <div class="particle"></div><div class="particle"></div>
                        <div class="particle"></div><div class="particle"></div>
                        <div class="particle"></div><div class="particle"></div>
                    </div>
                </div>
            `;

            document.body.appendChild(epicContainer);
            
            const claimBtn = document.getElementById('claim-glory-btn');
            if (claimBtn) {
                claimBtn.addEventListener('click', () => {
                    this.closeEpicVictory();
                });
            }
        },

        closeEpicVictory() {
            const screen = document.getElementById('epic-victory-screen');
            if (screen) screen.remove();

            if (typeof Users !== 'undefined') {
                Users.updateHighScore(this.score);
                Users.addCoins(500); // Bonus victoria
            }

            if (typeof LB !== 'undefined') {
                LB.renderTop3();
            }
        },

        // Word Mastery & Translation helpers
        getTranslation(word) {
            if (typeof levels === 'undefined') return '?';
            for (let i = 0; i < levels.length; i++) {
                if (levels[i].words && levels[i].words[word]) {
                    return levels[i].words[word][0];
                }
            }
            return '?';
        },

        getAllCorrectAnswers(word) {
            if (typeof levels === 'undefined') return [];
            for (let i = 0; i < levels.length; i++) {
                if (levels[i].words && levels[i].words[word]) {
                    return levels[i].words[word].map(a => a.toLowerCase());
                }
            }
            return [];
        },

        getFocusWords() {
            return Object.entries(this.wordFailCount)
                .filter(entry => entry[1] > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(entry => entry[0]);
        },

        checkWordMastered(word) {
            try {
                var data = JSON.parse(localStorage.getItem('ftMastery') || '{}');
                var entry = data[word];
                if (!entry) return false;
                return entry.hits >= 3 && entry.sessions && entry.sessions.length >= 2;
            } catch(e) { return false; }
        },

        recordHit(word, correct) {
            var today = new Date().toDateString();
            var data = {};
            try {
                data = JSON.parse(localStorage.getItem('ftMastery') || '{}');
            } catch(e) {}
            if (!data[word]) data[word] = { hits: 0, sessions: [] };
            if (correct) {
                data[word].hits = (data[word].hits || 0) + 1;
                if (data[word].sessions.indexOf(today) === -1) {
                    data[word].sessions.push(today);
                }
            } else {
                data[word].hits = 0;
            }
            try {
                localStorage.setItem('ftMastery', JSON.stringify(data));
            } catch(e) {}
            return data[word];
        },

        showFocusWordsFeedback() {
            const feedbackDiv = document.getElementById('focus-words-feedback');
            if (!feedbackDiv) return;

            const sorted = Object.entries(this.wordFailCount)
                .filter(([word, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);

            if (sorted.length === 0) {
                feedbackDiv.innerHTML = '<p style="color:#00ff4c; font-size:0.7em; text-align:center;">✓ No problematic words this session!</p>';
                return;
            }

            let html = '<p style="color:#f2c94c; font-size:0.7em; margin-bottom:8px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">🌊 FOCUS ON THESE WORDS:</p>';
            html += '<div style="background:rgba(0,92,138,0.3); border-radius:8px; padding:10px; border: 1px solid rgba(242,201,76,0.3);">';
            sorted.forEach(([word, count]) => {
                const translation = this.getTranslation(word);
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; 
                                padding:6px 8px; margin-bottom:4px; background:rgba(0,131,176,0.2); 
                                border-left:3px solid #f2c94c; border-radius:4px;">
                        <span style="color:#ffffff; font-size:0.75em;">
                            <span style="color:#f2c94c;">${word}</span>
                            <span style="color:#81d4fa;"> → </span>
                            <span style="color:#69f0ae;">${translation}</span>
                        </span>
                        <span style="color:#ff8c00; font-size:0.6em;">${count} ✗</span>
                    </div>`;
            });
            html += '</div>';

            feedbackDiv.innerHTML = html;
        },

        // Focus Training system
        showFocusTraining(fromGameOver) {
            this.isFTFromGameOver = !!fromGameOver;
            this.ftWords = this.getFocusWords().filter(w => !this.checkWordMastered(w));
            if (this.ftWords.length === 0) {
                if (this.isFTFromGameOver) {
                    this.showGameOverScreenDirectly();
                } else {
                    this.startGameCore();
                }
                return;
            }
            this.ftIndex = 0;
            const ftTotal = document.getElementById('ft-total');
            if (ftTotal) ftTotal.textContent = this.ftWords.length;
            
            const ftOverlay = document.getElementById('focus-training');
            if (ftOverlay) ftOverlay.style.display = 'flex';
            
            this.showFTWord();
        },

        showFTWord() {
            var word = this.ftWords[this.ftIndex];
            const ftCurrent = document.getElementById('ft-current');
            if (ftCurrent) ftCurrent.textContent = this.ftIndex + 1;
            
            const ftWord = document.getElementById('ft-word');
            if (ftWord) ftWord.textContent = word;
            
            const ftAns = document.getElementById('ft-answer');
            if (ftAns) {
                ftAns.value = '';
                ftAns.focus();
            }
            
            const ftFeedback = document.getElementById('ft-feedback');
            if (ftFeedback) {
                ftFeedback.textContent = '';
                ftFeedback.style.color = '';
            }
            
            const ftSubmit = document.getElementById('ft-submit-btn');
            if (ftSubmit) {
                ftSubmit.textContent = 'CHECK';
                ftSubmit.onclick = () => this.checkFTAnswer();
            }
        },

        checkFTAnswer() {
            var word = this.ftWords[this.ftIndex];
            const ftAns = document.getElementById('ft-answer');
            var userAnswer = (ftAns && ftAns.value.trim().toLowerCase()) || '';
            var allCorrect = this.getAllCorrectAnswers(word);
            var isCorrect = allCorrect.indexOf(userAnswer) !== -1;
            var entry = this.recordHit(word, isCorrect);

            const ftFeedback = document.getElementById('ft-feedback');
            const ftSubmit = document.getElementById('ft-submit-btn');

            if (isCorrect) {
                if (ftFeedback) {
                    if (entry.hits >= 3 && entry.sessions.length >= 2) {
                        ftFeedback.innerHTML = '🏆 <span style="color:#ffd700;">You mastered</span> <span style="color:#00ff9d;">"' + word + '"</span>!<br><span style="color:#888; font-size:0.85em;">It will no longer appear in Focus Training</span>';
                        ftFeedback.style.color = '#ffd700';
                    } else {
                        ftFeedback.textContent = '✓ Correct!';
                        ftFeedback.style.color = '#00ff4c';
                    }
                }
                if (ftSubmit) {
                    ftSubmit.textContent = 'NEXT →';
                    ftSubmit.onclick = () => this.advanceFT();
                }
            } else {
                var correctAnswer = this.getTranslation(word);
                if (ftFeedback) {
                    ftFeedback.innerHTML = '✗ Correct answer: <span style="color:#ffcc00;">' + correctAnswer + '</span><br><span style="color:#aaaaaa; font-size:0.85em;">Type it to continue...</span>';
                    ftFeedback.style.color = '#ff4444';
                }
                if (ftAns) {
                    ftAns.value = '';
                    ftAns.focus();
                }
                if (ftSubmit) {
                    ftSubmit.textContent = 'CHECK';
                    ftSubmit.onclick = () => {
                        var retryAnswer = (ftAns && ftAns.value.trim().toLowerCase()) || '';
                        var retryCorrect = this.getAllCorrectAnswers(word);
                        if (retryCorrect.indexOf(retryAnswer) !== -1) {
                            if (ftFeedback) {
                                ftFeedback.textContent = '✓ Good! Now you can continue.';
                                ftFeedback.style.color = '#00ff4c';
                            }
                            ftSubmit.textContent = 'NEXT →';
                            ftSubmit.onclick = () => this.advanceFT();
                        } else {
                            if (ftFeedback) {
                                ftFeedback.innerHTML = '✗ Not yet. Write: <span style="color:#ffcc00;">' + correctAnswer + '</span>';
                                ftFeedback.style.color = '#ff4444';
                            }
                            if (ftAns) {
                                ftAns.value = '';
                                ftAns.focus();
                            }
                        }
                    };
                }
            }
        },

        advanceFT() {
            this.ftIndex++;
            if (this.ftIndex >= this.ftWords.length) {
                const ftOverlay = document.getElementById('focus-training');
                if (ftOverlay) ftOverlay.style.display = 'none';
                
                if (this.isFTFromGameOver) {
                    this.showGameOverScreenDirectly();
                } else {
                    this.startGameCore();
                }
            } else {
                this.showFTWord();
            }
        },

        startGameCore() {
            const ftOverlay = document.getElementById('focus-training');
            if (ftOverlay) ftOverlay.style.display = 'none';
            
            this.currentLevel = 0;
            this.score = 0;
            if (window.UI) {
                UI.updateScore(this.score);
            }
            this.errorCount = 0;
            this.magicEnergy = 5;
            this.isRecovering = false;
            this.eventActive = false;
            this.currentEvent = null;
            this.loadLevel();
        }
    };

    // Expose helpers for API
    Object.defineProperty(window, '_gameMaxStreak', {
        get() { return window.Game ? window.Game.maxStreak : 0; }
    });
    Object.defineProperty(window, '_gameWordFailCount', {
        get() { return window.Game ? window.Game.wordFailCount : {}; }
    });
    Object.defineProperty(window, '_gameScore', {
        get() { return window.Game ? window.Game.score : 0; }
    });

    // Run Game setup
    document.addEventListener('DOMContentLoaded', () => {
        window.Game.init();
    });

})();

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hafizh Quest - Game Hafalan Al-Qur'an</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap"> <!-- Fallback font -->
    <style>
        @font-face {
            font-family: 'Uthmani';
            src: url('https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/fonts/KFGQPCUthmanicScriptHAFS.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
        }
        body { font-family: 'Uthmani', 'Amiri', serif; background: linear-gradient(135deg, #1e3c72, #2a5298); color: #333; margin: 0; padding: 10px; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .container { max-width: 100%; margin: 0 auto; }
        h1 { text-align: center; color: #fff; font-size: 1.5em; margin-bottom: 10px; }
        .section { display: none; background: rgba(255,255,255,0.95); border-radius: 10px; padding: 15px; margin: 10px 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .active { display: block; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 10px; margin: 10px 0; }
        .juz-btn { background: #4CAF50; color: white; border: none; padding: 10px; border-radius: 5px; font-size: 0.9em; cursor: pointer; transition: background 0.3s; }
        .juz-btn.selected { background: #FF9800; }
        .juz-btn:hover { background: #45a049; }
        input, select, button { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px; font-family: inherit; }
        button { background: #2196F3; color: white; cursor: pointer; transition: background 0.3s; }
        button:hover { background: #0b7dda; }
        .question { font-size: 1.2em; text-align: right; direction: rtl; line-height: 1.5; margin: 20px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; animation: fadeIn 0.5s; }
        .options { display: flex; flex-direction: column; gap: 10px; }
        .option { background: #e3f2fd; padding: 10px; border-radius: 5px; cursor: pointer; transition: background 0.3s; border: 2px solid transparent; }
        .option:hover, .option.selected { background: #bbdefb; border-color: #2196F3; }
        .timer { text-align: center; font-size: 1.2em; color: #FF5722; margin: 10px 0; }
        .score { text-align: center; font-size: 1.1em; color: #4CAF50; margin: 10px 0; }
        .level { text-align: center; font-size: 1em; color: #9C27B0; margin: 10px 0; }
        .leaderboard { margin: 10px 0; }
        .leader-item { display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #ddd; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hidden { display: none; }
        @media (max-width: 600px) { .grid { grid-template-columns: repeat(5, 1fr); } h1 { font-size: 1.2em; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🕌 Hafizh Quest 🕌</h1>
        
        <!-- Section 1: Input Nama -->
        <div id="nameSection" class="section active">
            <label>Masukkan Nama Pemain:</label>
            <input type="text" id="playerName" placeholder="Nama Anda..." required>
            <button onclick="startJuzSelection()">Lanjut</button>
        </div>
        
        <!-- Section 2: Pemilihan Juz -->
        <div id="juzSection" class="section">
            <h3>Pilih Juz (1-30)</h3>
            <p><small>Klik untuk pilih satu/beberapa, atau "Semua" untuk 1-30.</small></p>
            <div class="grid" id="juzGrid"></div>
            <button onclick="selectAllJuz()">Pilih Semua</button>
            <button onclick="startGame()">Mulai Bermain</button>
            <button onclick="backToName()">Kembali</button>
        </div>
        
        <!-- Section 3: Gameplay -->
        <div id="gameSection" class="section">
            <div class="timer" id="timer">Waktu: 30s</div>
            <div class="score" id="currentScore">Skor: 0</div>
            <div class="level" id="currentLevel">Level: Beginner</div>
            <div class="question" id="question"></div>
            <div class="options" id="options"></div>
            <button onclick="submitAnswer()" id="submitBtn" disabled>Kirim Jawaban</button>
            <button onclick="nextQuestion()" class="hidden" id="nextBtn">Soal Berikutnya</button>
        </div>
        
        <!-- Section 4: Leaderboard & Total -->
        <div id="endSection" class="section">
            <h3>Selamat! Sesi Selesai</h3>
            <div class="score">Total Skor: <span id="totalScore">0</span></div>
            <div class="level">Level Anda: <span id="totalLevel">Beginner</span></div>
            <div class="leaderboard">
                <h4>Papan Peringkat</h4>
                <div id="leaderboardList"></div>
            </div>
            <button onclick="playAgain()">Main Lagi</button>
            <button onclick="resetGame()">Reset Semua Data</button>
        </div>
    </div>

    <script>
        // State Variables
        let playerName = '';
        let selectedJuz = [];
        let verses = {}; // Cache ayat per juz
        let currentQuestion = null;
        let usedQuestions = JSON.parse(localStorage.getItem('usedQuestions')) || {}; // Track used: {juz: [questionId]}
        let totalScore = parseInt(localStorage.getItem('totalScore') || '0');
        let gameStartTime = Date.now();
        let timerInterval;
        let questionTimer = 30;
        let currentScore = 0;
        let questionType = ''; // 'multiple' or 'connect'
        let selectedOption = null;

        // Sound Effects (dari Mixkit - ganti jika perlu)
        const sounds = {
            click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-click-1110.mp3'),
            correct: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3'),
            wrong: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3')
        };
        // Fallback beep
        function playSound(type) {
            if (sounds[type]) sounds[type].play().catch(() => beep(type));
            else beep(type);
        }
        function beep(type) {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = type === 'correct' ? 800 : type === 'wrong' ? 200 : 400;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        }

        // Inisialisasi Juz Grid
        function initJuzGrid() {
            const grid = document.getElementById('juzGrid');
            grid.innerHTML = '';
            for (let i = 1; i <= 30; i++) {
                const btn = document.createElement('button');
                btn.className = 'juz-btn';
                btn.textContent = i;
                btn.onclick = () => toggleJuz(i);
                grid.appendChild(btn);
            }
        }

        // Toggle Juz Selection
        function toggleJuz(juz) {
            const btn = event.target;
            const idx = selectedJuz.indexOf(juz);
            if (idx > -1) {
                selectedJuz.splice(idx, 1);
                btn.classList.remove('selected');
            } else {
                selectedJuz.push(juz);
                btn.classList.add('selected');
            }
            playSound('click');
        }

        function selectAllJuz() {
            selectedJuz = Array.from({length: 30}, (_, i) => i + 1);
            document.querySelectorAll('.juz-btn').forEach(btn => {
                const num = parseInt(btn.textContent);
                btn.classList.toggle('selected', selectedJuz.includes(num));
            });
            playSound('click');
        }

        // Start Functions
        function startJuzSelection() {
            playerName = document.getElementById('playerName').value.trim();
            if (!playerName) return alert('Masukkan nama!');
            document.getElementById('nameSection').classList.remove('active');
            document.getElementById('juzSection').classList.add('active');
            initJuzGrid();
        }

        async function startGame() {
            if (selectedJuz.length === 0) return alert('Pilih minimal 1 Juz!');
            document.getElementById('juzSection').classList.remove('active');
            document.getElementById('gameSection').classList.add('active');
            currentScore = 0;
            gameStartTime = Date.now();
            updateScore();
            updateLevel(currentScore + totalScore);
            await fetchVerses();
            generateQuestion();
            startTimer();
        }

        // Fetch Verses from API
        async function fetchVerses() {
            for (let juz of selectedJuz) {
                if (!verses[juz]) {
                    try {
                        const res = await fetch(`https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`);
                        const data = await res.json();
                        verses[juz] = data.data.verses.map(v => ({text: v.text_uthmani, surah: v.surah.number, ayah: v.ayah.number}));
                    } catch (e) {
                        console.error('API Error:', e);
                        alert('Gagal load ayat. Coba lagi.');
                    }
                }
            }
        }

        // Generate Question
        function generateQuestion() {
            const availableJuz = selectedJuz.filter(j => verses[j] && verses[j].length > 1);
            if (availableJuz.length === 0) return endGame();
            const juz = availableJuz[Math.floor(Math.random() * availableJuz.length)];
            const allVerses = verses[juz];
            const used = usedQuestions[juz] || [];
            let candidates = allVerses.filter((v, i) => !used.includes(i));
            if (candidates.length < 2) {
                usedQuestions[juz] = []; // Reset if depleted
                candidates = allVerses;
            }
            const idx1 = Math.floor(Math.random() * candidates.length);
            const verse1 = candidates[idx1];
            const idx2 = (idx1 + 1) % allVerses.length;
            const verse2 = allVerses[idx2];
            const qId = `${juz}-${idx1}`;
            if (!used.includes(qId)) usedQuestions[juz].push(qId);

            questionType = Math.random() > 0.5 ? 'multiple' : 'connect';
            if (questionType === 'multiple') {
                // Pilihan Ganda: Hilangkan kata acak
                const words = verse1.text.split(' ');
                const blankIdx = Math.floor(Math.random() * words.length);
                const blankWord = words[blankIdx];
                const prompt = words.slice(0, blankIdx).join(' ') + ' _____ ' + words.slice(blankIdx + 1).join(' ');
                const options = [blankWord];
                while (options.length < 4) {
                    const wrong = allVerses[Math.floor(Math.random() * allVerses.length)].text.split(' ')[Math.floor(Math.random() * 10)];
                    if (!options.includes(wrong)) options.push(wrong);
                }
                options.sort(() => Math.random() - 0.5);
                currentQuestion = { type: 'multiple', prompt, answer: blankWord, options, juz, id: qId };
                showQuestion(prompt, options.map(opt => ({text: opt, isCorrect: opt === blankWord})));
            } else {
                // Sambung Ayat: Pilih ayat selanjutnya
                const prompt = `Lanjutkan ayat ini: ${verse1.text}`;
                const options = [verse2.text];
                for (let i = 0; i < 3; i++) {
                    const wrongVerse = allVerses[Math.floor(Math.random() * allVerses.length)].text;
                    if (wrongVerse !== verse2.text && !options.includes(wrongVerse)) options.push(wrongVerse);
                }
                options.sort(() => Math.random() - 0.5);
                currentQuestion = { type: 'connect', prompt, answer: verse2.text, options, juz, id: qId };
                showQuestion(prompt, options.map(opt => ({text: opt, isCorrect: opt === verse2.text})));
            }
            localStorage.setItem('usedQuestions', JSON.stringify(usedQuestions));
        }

        function showQuestion(prompt, opts) {
            document.getElementById('question').innerHTML = `<strong>${prompt}</strong> (Juz ${currentQuestion.juz})`;
            const optionsDiv = document.getElementById('options');
            optionsDiv.innerHTML = '';
            opts.forEach((opt, i) => {
                const btn = document.createElement('div');
                btn.className = 'option';
                btn.innerHTML = opt.text;
                btn.onclick = () => selectOption(i);
                optionsDiv.appendChild(btn);
            });
            document.getElementById('submitBtn').disabled = true;
            selectedOption = null;
        }

        function selectOption(idx) {
            document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
            event.target.classList.add('selected');
            selectedOption = idx;
            document.getElementById('submitBtn').disabled = false;
            playSound('click');
        }

        function submitAnswer() {
            if (selectedOption === null) return;
            const isCorrect = currentQuestion.options[selectedOption].isCorrect;
            playSound(isCorrect ? 'correct' : 'wrong');
            const timeBonus = questionTimer * 5;
            if (isCorrect) currentScore += 100 + timeBonus;
            updateScore();
            updateLevel(currentScore + totalScore);
            document.getElementById('submitBtn').classList.add('hidden');
            document.getElementById('nextBtn').classList.remove('hidden');
            // Highlight correct
            setTimeout(() => {
                document.querySelectorAll('.option').forEach((el, i) => {
                    if (i === selectedOption) el.style.background = isCorrect ? '#c8e6c9' : '#ffcdd2';
                });
            }, 500);
        }

        function nextQuestion() {
            document.getElementById('nextBtn').classList.add('hidden');
            document.getElementById('submitBtn').classList.remove('hidden');
            questionTimer = 30;
            generateQuestion();
        }

        // Timer
        function startTimer() {
            timerInterval = setInterval(() => {
                questionTimer--;
                document.getElementById('timer').textContent = `Waktu: ${questionTimer}s`;
                if (questionTimer <= 0) {
                    playSound('wrong');
                    nextQuestion();
                }
            }, 1000);
        }

        function updateScore() {
            document.getElementById('currentScore').textContent = `Skor Sesi: ${currentScore}`;
        }

        function updateLevel(score) {
            let level = 'Beginner';
            if (score > 10000) level = 'Hafizh';
            else if (score > 5000) level = 'Expert';
            else if (score > 1000) level = 'Intermediate';
            document.getElementById('currentLevel').textContent = `Level: ${level}`;
        }

        function endGame() {
            clearInterval(timerInterval);
            totalScore += currentScore;
            localStorage.setItem('totalScore', totalScore.toString());
            const sessionTime = ((Date.now() - gameStartTime) / 1000).toFixed(0);
            const entry = { name: playerName, score: totalScore, time: sessionTime };
            let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
            leaderboard.push(entry);
            leaderboard.sort((a, b) => b.score - a.score || a.time - b.time);
            leaderboard = leaderboard.slice(0, 10);
            localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
            document.getElementById('gameSection').classList.remove('active');
            document.getElementById('endSection').classList.add('active');
            document.getElementById('totalScore').textContent = totalScore;
            updateLevel(totalScore);
            showLeaderboard(leaderboard);
        }

        function showLeaderboard(list) {
            const lbDiv = document.getElementById('leaderboardList');
            lbDiv.innerHTML = '';
            list.forEach((item, i) => {
                const div = document.createElement('div');
                div.className = 'leader-item';
                div.innerHTML = `<strong>${i+1}. ${item.name}</strong> <span>Skor: ${item.score} (Waktu: ${item.time}s)</span>`;
                lbDiv.appendChild(div);
            });
        }

        // Navigation
        function backToName() {
            document.getElementById('juzSection').classList.remove('active');
            document.getElementById('nameSection').classList.add('active');
            selectedJuz = [];
        }

        function playAgain() {
            document.getElementById('endSection').classList.remove('active');
            document.getElementById('juzSection').classList.add('active');
            selectedJuz = [];
            initJuzGrid();
        }

        function resetGame() {
            if (confirm('Reset semua data?')) {
                localStorage.clear();
                totalScore = 0;
                usedQuestions = {};
                location.reload();
            }
        }

        // Auto-end after 20 questions or manual
        setTimeout(() => { if (document.getElementById('gameSection').classList.contains('active')) endGame(); }, 20 * 30000); // 20 soal
    </script>
</body>
</html>

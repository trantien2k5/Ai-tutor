function setQuizMode(mode, btn) {
    quizState.mode = mode;
    document.querySelectorAll('.q-mode-btn').forEach(b => {
        b.classList.replace('border-blue-500', 'border-slate-100');
        b.classList.remove('bg-blue-50', 'text-blue-600');
    });
    btn.classList.replace('border-slate-100', 'border-blue-500');
    btn.classList.add('bg-blue-50', 'text-blue-600');
}

function setQuizCount(num, btn) {
    quizState.total = num;
    document.querySelectorAll('.q-count-btn').forEach(b => {
        b.classList.replace('border-blue-500', 'border-slate-100');
        b.classList.remove('bg-blue-50', 'text-blue-600');
    });
    btn.classList.replace('border-slate-100', 'border-blue-500');
    btn.classList.add('bg-blue-50', 'text-blue-600');
}

function updateQuizTopics() {
    const topicSelect = document.getElementById('quiz-topic-select');
    if (!topicSelect) return;
    const uniqueTopics = [...new Set(vocabList.map(v => v.topic || 'General'))];
    topicSelect.innerHTML = '<option value="all">🌐 Tất cả chủ đề</option>' + uniqueTopics.map(t => `<option value="${t}">📂 ${t}</option>`).join('');
}

function initNewQuiz() {
    const topic = document.getElementById('quiz-topic-select').value;
    let filtered = topic === 'all' ? [...vocabList] : vocabList.filter(v => v.topic === topic);
    if (filtered.length < 4) return showToast("⚠️ Cần ít nhất 4 từ để học!", 'error');

    quizState.pool = filtered.sort(() => 0.5 - Math.random()).slice(0, quizState.total);
    quizState.currentIdx = 0;
    quizState.score = 0;

    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-active').classList.remove('hidden');
    if (quizState.mode === 'exam') startTimer();
    renderQuizQuestion();
}

function renderQuizQuestion() {
    if (quizState.currentIdx >= quizState.pool.length) return finishQuiz();
    document.getElementById('quiz-explanation').classList.add('hidden');

    const optionsContainer = document.getElementById('quiz-q-options');
    if (optionsContainer) optionsContainer.classList.remove('hidden');

    const wordObj = quizState.pool[quizState.currentIdx];
    document.getElementById('quiz-q-word').innerText = wordObj.word;
    document.getElementById('quiz-q-ipa').innerText = wordObj.ipa || '';
    document.getElementById('quiz-q-type').innerText = wordObj.type || 'Vocabulary';
    const progBar = document.getElementById('quiz-progress-bar');
    if (progBar) progBar.style.width = ((quizState.currentIdx) / quizState.pool.length * 100) + '%';

    let options = [wordObj.mean];
    let distractors = vocabList.filter(v => v.word !== wordObj.word).map(v => v.mean);
    options = [...options, ...distractors.sort(() => 0.5 - Math.random()).slice(0, 3)].sort(() => 0.5 - Math.random());

    if (optionsContainer) {
        optionsContainer.innerHTML = options.map(opt => `
            <button onclick="handleQuizAnswer('${opt.replace(/'/g, "\\'")}', this)" 
                class="quiz-opt-btn w-full p-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 transition-all text-left hover:border-blue-500">
                ${opt}
            </button>`).join('');
    }
    if (appSettings.autoSpeak) speak(wordObj.word);
}

function handleQuizAnswer(selected, btn) {
    const wordObj = quizState.pool[quizState.currentIdx];
    const isCorrect = selected === wordObj.mean;
    if (isCorrect) quizState.score++;

    const optionsContainer = document.getElementById('quiz-q-options');
    if (optionsContainer) optionsContainer.classList.add('hidden');

    if (quizState.mode === 'learning') {
        const explain = document.getElementById('quiz-explanation');
        document.getElementById('explain-mean').innerText = wordObj.mean;
        document.getElementById('explain-example').innerText = `"${wordObj.example}"`;
        document.getElementById('explain-synonyms').innerText = wordObj.synonyms || 'N/A';
        document.getElementById('explain-antonyms').innerText = wordObj.antonyms || 'N/A';
        document.getElementById('explain-note').innerText = wordObj.note || 'Hãy cố gắng đặt câu với từ này nhé!';
        explain.classList.remove('hidden');
        quizState.currentIdx++;
    } else {
        quizState.currentIdx++;
        setTimeout(renderQuizQuestion, 800);
    }
}

function startTimer() {
    quizState.startTime = new Date();
    const timerEl = document.getElementById('quiz-timer');
    if (timerEl) timerEl.classList.remove('hidden');
    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    quizState.timerInterval = setInterval(() => {
        const diff = Math.floor((new Date() - quizState.startTime) / 1000);
        if (timerEl) timerEl.innerText = `${Math.floor(diff / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`;
    }, 1000);
}

function finishQuiz() {
    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    document.getElementById('quiz-active').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
    const timerEl = document.getElementById('quiz-timer');
    if (timerEl) timerEl.classList.add('hidden');

    const finalScore = Math.round((quizState.score / quizState.pool.length) * 100);
    const scoreEl = document.getElementById('result-score');
    if (scoreEl) scoreEl.innerText = finalScore;
    document.getElementById('result-summary').innerText = `Đúng ${quizState.score}/${quizState.pool.length} câu`;
    const emojiEl = document.getElementById('result-emoji');
    if (emojiEl) emojiEl.innerText = finalScore >= 80 ? '🏆' : (finalScore >= 50 ? '🥈' : '📚');
}
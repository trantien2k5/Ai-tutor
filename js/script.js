/* [CỤC: DATA_INITIALIZATION] */
let vocabList = JSON.parse(localStorage.getItem('my_vocab')) || [];
let voices = [];
let appSettings = JSON.parse(localStorage.getItem('app_settings')) || {
    dailyGoal: 10,
    ttsRate: 1.0,
    voiceName: '',
    darkMode: false,
    autoSpeak: false
};

let quizState = {
    pool: [],
    currentIdx: 0,
    score: 0,
    total: 20,
    mode: 'learning',
    startTime: null,
    timerInterval: null
};

/* [CỤC: NAV_LOGIC] */
function switchTab(tabId) {
    // Ẩn tất cả tab
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

    // Hiện tab mục tiêu
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.classList.remove('hidden');

    // Cập nhật trạng thái Active cho tất cả nút có class .tab-btn
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isCurrent = btn.getAttribute('data-tab') === tabId;

        // Reset màu cũ
        btn.classList.remove('text-blue-600', 'bg-blue-50', 'dark:bg-blue-900/20');
        btn.classList.add('text-slate-400');

        if (isCurrent) {
            btn.classList.add('text-blue-600');
            btn.classList.remove('text-slate-400');

            // Nếu là nút trên Sidebar (không nằm trong thẻ nav), thêm màu nền highlight
            if (!btn.closest('nav')) {
                btn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            }
        }
    });
}

/* [CỤC: AI_LOGIC] */
function generatePrompt() {
    const topic = document.getElementById('user-topic').value || 'General';
    const level = document.getElementById('user-level').value;
    const count = document.getElementById('user-count').value;

    // Nâng cấp prompt để lấy IPA, Từ đồng nghĩa và Ghi chú
    const prompt = `Act as an Oxford English Teacher. Create ${count} vocabulary words for "${topic}" (Level ${level}). 
Ensure diverse word types. Return ONLY a JSON array: 
[{"word": "...", "ipa": "/.../", "type": "...", "mean": "...", "synonyms": "...", "antonyms": "...", "example": "...", "note": "Mẹo nhớ..."}]`;

    const promptCode = document.getElementById('generated-prompt');
    if (promptCode) {
        promptCode.innerText = prompt;
        document.getElementById('prompt-output-area').classList.remove('hidden');
    }
}

function copyPrompt() {
    navigator.clipboard.writeText(document.getElementById('generated-prompt').innerText);
    alert('Đã copy prompt nâng cao!');
}

function processVocab() {
    const inputArea = document.getElementById('ai-input');
    const topicInput = document.getElementById('user-topic');
    if (!inputArea || !inputArea.value) return;
    try {
        let rawData = inputArea.value.trim();
        if (rawData.startsWith('```')) rawData = rawData.replace(/```json|```/g, '').trim();
        const newData = JSON.parse(rawData);
        const currentTopic = topicInput.value.trim() || 'General';
        if (Array.isArray(newData)) {
            const dataWithTopic = newData.map(item => ({ ...item, topic: currentTopic }));
            vocabList = [...dataWithTopic, ...vocabList];
            localStorage.setItem('my_vocab', JSON.stringify(vocabList));
            inputArea.value = '';
            renderLibrary();
            alert(`🎉 Đã nạp ${newData.length} từ vựng đầy đủ thông tin!`);
            switchTab('library');
        }
    } catch (e) { alert('❌ Lỗi: JSON không hợp lệ!'); }
}

/* [CỤC: LIBRARY_SUB_NAVIGATION] */
function toggleNotebook() {
    const topicView = document.getElementById('library-topics-view');
    const notebookView = document.getElementById('library-notebook-view');
    const isNotebookHidden = notebookView.classList.contains('hidden');

    if (isNotebookHidden) {
        topicView.classList.add('hidden');
        notebookView.classList.remove('hidden');
        renderNotebook();
    } else {
        topicView.classList.remove('hidden');
        notebookView.classList.add('hidden');
    }
}


function renderNotebook() {
    const container = document.getElementById('vocab-container');
    const searchInput = document.getElementById('library-search');
    if (!container) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filteredList = vocabList.filter(item =>
        item.word.toLowerCase().includes(searchTerm) || item.mean.toLowerCase().includes(searchTerm)
    );

    container.innerHTML = filteredList.map((item, idx) => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <div>
                <h4 class="font-black text-slate-800 dark:text-white text-sm">${item.word}</h4>
                <p class="text-[10px] text-slate-400 font-bold uppercase">${item.mean}</p>
            </div>
            <button onclick="speak('${item.word}')" class="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">🔊</button>
        </div>
    `).join('');
}

function closeFlashcards() {
    document.getElementById('flashcard-view').classList.add('hidden');
    document.getElementById('library-topics-view').classList.remove('hidden');
}

/* [CỤC: RENDER_LOGIC] */
function renderLibrary() {
    const container = document.getElementById('library-topics-view');
    if (!container) return;

    const topics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];
    
    if (topics.length === 0) {
        container.innerHTML = `<div class="col-span-full py-10 text-center opacity-50 font-bold">Chưa có chủ đề nào. Hãy dùng AI để thêm từ!</div>`;
        return;
    }

    container.innerHTML = topics.map(topic => {
        const count = vocabList.filter(v => (v.topic || 'Chung') === topic).length;
        return `
            <div onclick="startFlashcards('${topic}')" class="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border-2 border-slate-50 dark:border-slate-700 shadow-sm hover:border-blue-500 transition-all cursor-pointer group">
                <div class="text-2xl mb-2">📁</div>
                <h3 class="font-black text-slate-800 dark:text-white text-xs uppercase">${topic}</h3>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${count} từ</p>
            </div>`;
    }).join('');
}

function renderVocabList() {
    const container = document.getElementById('vocab-container');
    if (!container) return;

    const searchInput = document.getElementById('library-search');
    const filterSelect = document.getElementById('library-filter');
    
    // Cập nhật số lượng từ ở Dashboard
    const homeCount = document.getElementById('home-count');
    if (homeCount) homeCount.innerText = vocabList.length;

    const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
    const filterType = filterSelect ? filterSelect.value : 'all';
    const filteredList = vocabList.filter(item => {
        const matchesSearch = item.word.toLowerCase().includes(searchTerm) || item.mean.toLowerCase().includes(searchTerm);
        const matchesFilter = filterType === 'all' || (item.type && item.type.toLowerCase().includes(filterType));
        return matchesSearch && matchesFilter;
    });

    if (filteredList.length === 0) {
        container.innerHTML = `<div class="col-span-full py-20 text-center animate-pulse"><p class="text-4xl mb-4">🔍</p><p class="text-slate-400 font-bold">Không tìm thấy từ vựng nào.</p></div>`;
    } else {
        container.innerHTML = filteredList.map((item) => {
            const originalIndex = vocabList.findIndex(v => v.word === item.word && v.mean === item.mean);
            return `<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div class="flex justify-between items-start mb-3">
                    <div><h3 class="text-xl font-black text-slate-800">${item.word}</h3><span class="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">${item.type || 'n'}</span></div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="speak('${item.word}')" class="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-colors">🔊</button>
                        <button onclick="deleteVocab(${originalIndex})" class="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-colors">🗑️</button>
                    </div>
                </div>
                <p class="text-slate-600 font-bold text-sm mb-2">${item.mean}</p>
                <div class="bg-slate-50 p-3 rounded-xl"><p class="text-xs italic text-slate-500 leading-relaxed">"${item.example}"</p></div>
                <div class="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 w-0 group-hover:w-full"></div>
            </div>`;
        }).join('');
    }
    updateStats();
    updateQuizTopics();
}

function deleteVocab(index) {
    if (confirm('Xóa từ này khỏi thư viện?')) {
        vocabList.splice(index, 1);
        localStorage.setItem('my_vocab', JSON.stringify(vocabList));
        renderLibrary();
        renderVocabList();
        updateStats();
    }
}

/* [CỤC: PRACTICE_LOGIC] */
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
    if (filtered.length < 4) return alert("Cần ít nhất 4 từ để luyện tập!");

    quizState.pool = filtered.sort(() => 0.5 - Math.random()).slice(0, quizState.total);
    quizState.currentIdx = 0;
    quizState.score = 0;

    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-active').classList.remove('hidden');
    if (quizState.mode === 'exam') startTimer();
    renderQuizQuestion();
}

/* [CỤC: PRACTICE_LOGIC] */
function renderQuizQuestion() {
    if (quizState.currentIdx >= quizState.pool.length) return finishQuiz();
    document.getElementById('quiz-explanation').classList.add('hidden');

    // Hiện lại danh sách câu trả lời cho câu hỏi tiếp theo
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

/* [CỤC: PRACTICE_LOGIC] */
function handleQuizAnswer(selected, btn) {
    const wordObj = quizState.pool[quizState.currentIdx];
    const isCorrect = selected === wordObj.mean;
    if (isCorrect) quizState.score++;

    // Ẩn container chứa 4 đáp án để giao diện gọn hơn khi hiện kết quả
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

/* [CỤC: SETTINGS_LOGIC] */
function toggleDarkMode() {
    appSettings.darkMode = !appSettings.darkMode;
    applyTheme();
    saveSettings();
}

function applyTheme() {
    if (appSettings.darkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-slate-900');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('bg-slate-900');
    }
}

function saveSettings() {
    const goalInput = document.getElementById('setting-goal');
    const voiceSelect = document.getElementById('setting-voice');
    const autoSpeakCheck = document.getElementById('setting-auto-speak');

    if (goalInput) appSettings.dailyGoal = parseInt(goalInput.value) || 10;
    if (voiceSelect) appSettings.voiceName = voiceSelect.value;
    if (autoSpeakCheck) appSettings.autoSpeak = autoSpeakCheck.checked;

    localStorage.setItem('app_settings', JSON.stringify(appSettings));
    updateStats();
}

function loadSettingsUI() {
    const goalInput = document.getElementById('setting-goal');
    const autoSpeakCheck = document.getElementById('setting-auto-speak');
    if (goalInput) goalInput.value = appSettings.dailyGoal;
    if (autoSpeakCheck) autoSpeakCheck.checked = appSettings.autoSpeak;
    applyTheme();
}

function resetQuizStats() {
    if (confirm('Xóa toàn bộ điểm số và lịch sử thi?')) {
        quizScore = 0;
        if (typeof updateQuizScoreUI === "function") updateQuizScoreUI();
        alert('Đã reset điểm số!');
    }
}

function clearAllData() {
    if (confirm('Xóa sạch toàn bộ từ vựng?')) {
        localStorage.removeItem('my_vocab');
        vocabList = [];
        renderLibrary();
        alert('Đã xóa sạch!');
        switchTab('home');
    }
}

function exportData() {
    const blob = new Blob([JSON.stringify(vocabList, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vocab_backup_${new Date().toLocaleDateString()}.json`;
    link.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                vocabList = [...importedData, ...vocabList];
                localStorage.setItem('my_vocab', JSON.stringify(vocabList));
                renderLibrary();
                alert('Nhập dữ liệu thành công!');
            }
        } catch (err) { alert('Lỗi định dạng JSON!'); }
    };
    reader.readAsText(file);
}

/* [CỤC: FLASHCARD_CORE_LOGIC] */
let currentSessionWords = [];
let currentCardIndex = 0;

/* [CỤC: FLASHCARD_CORE_LOGIC] */
function startFlashcards(topic) {
    currentSessionWords = vocabList.filter(v => (v.topic || 'Chung') === topic);
    if (currentSessionWords.length === 0) return alert("Chủ đề này chưa có từ vựng!");

    currentCardIndex = 0;
    switchTab('library');

    const topicView = document.getElementById('library-topics-view');
    const notebookView = document.getElementById('library-notebook-view');
    const flashView = document.getElementById('flashcard-view');

    if (topicView) topicView.classList.add('hidden');
    if (notebookView) notebookView.classList.add('hidden');
    if (flashView) flashView.classList.remove('hidden');

    showCard();
}

function closeFlashcards() {
    const topicView = document.getElementById('library-topics-view');
    const flashView = document.getElementById('flashcard-view');
    
    if (flashView) flashView.classList.add('hidden');
    if (topicView) topicView.classList.remove('hidden');
}


/* [CỤC: RENDER_TOPIC_CARDS] */
function updateStats() {
    const container = document.getElementById('topic-list-container');
    if (!container) return;

    // Lấy danh sách chủ đề duy nhất
    const topics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];

    container.innerHTML = topics.map(topic => {
        const count = vocabList.filter(v => (v.topic || 'Chung') === topic).length;
        return `
            <div onclick="startFlashcards('${topic}')" 
                 class="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
                <div class="relative z-10">
                    <div class="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300">📁</div>
                    <h3 class="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight mb-1">${topic}</h3>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${count} từ vựng</p>
                    
                    <div class="mt-4 flex items-center gap-1 text-blue-600 font-black text-[9px] uppercase">
                        <span>Học ngay</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>
                </div>
                <div class="absolute -right-2 -bottom-2 w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </div>`;
    }).join('');

    // Cập nhật các thông số khác (nếu có các element tương ứng)
    const totalCountEl = document.getElementById('home-count');
    if (totalCountEl) totalCountEl.innerText = vocabList.length;
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    const voiceSelect = document.getElementById('setting-voice');
    if (!voiceSelect) return;
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    voiceSelect.innerHTML = enVoices.map(v => `<option value="${v.name}" ${v.name === appSettings.voiceName ? 'selected' : ''}>${v.name} (${v.lang})</option>`).join('');
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = voices.find(v => v.name === appSettings.voiceName);
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = 'en-US';
        utterance.rate = appSettings.ttsRate || 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

/* [CỤC: INITIALIZATION] */
window.onload = async () => {
    // 1. Nạp tất cả giao diện
    await Promise.all([
        loadComponent('tab-home', 'home.html'),
        loadComponent('tab-library', 'library.html'),
        loadComponent('tab-ai-gen', 'ai.html'),
        loadComponent('tab-practice', 'practice.html'),
        loadComponent('tab-settings', 'settings.html')
    ]);

    // 2. Khởi tạo dữ liệu
    loadSettingsUI();
    applyTheme();

    // 3. Render nội dung sau khi các tab đã sẵn sàng
    setTimeout(() => {
        renderLibrary();   // Hiển thị folder trong Thư viện 
        updateStats();     // Hiển thị folder ở Trang chủ
        renderVocabList(); // Hiển thị danh sách từ trong Sổ tay 
        updateQuizTopics();// Cập nhật chủ đề luyện tập
        loadVoices();
        switchTab('home');
    }, 200);
};

/* [CỤC: COMPONENT_LOADER] */
async function loadComponent(id, fileName) {
    try {
        const response = await fetch(`components/${fileName}`);
        const target = document.getElementById(id);
        if (response.ok && target) {
            const rawHtml = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHtml, 'text/html');
            const section = doc.querySelector('section');
            target.innerHTML = section ? section.innerHTML : rawHtml;
        }
    } catch (error) {
        console.error("Lỗi nạp component:", fileName, error);
    }
}

/* [CỤC: FLASHCARD_INTERACTION] */
function showCard() {
    const card = currentSessionWords[currentCardIndex];
    if (!card) return;

    document.getElementById('card-front-word').innerText = card.word;
    document.getElementById('card-front-ipa').innerText = card.ipa || '';
    document.getElementById('card-back-mean').innerText = card.mean;
    document.getElementById('card-back-example').innerText = `"${card.example}"`;
    document.getElementById('card-progress').innerText = `${currentCardIndex + 1} / ${currentSessionWords.length}`;
    document.getElementById('card-inner').classList.remove('rotate-y-180');
    if (appSettings.autoSpeak) speak(card.word);
}

function flipCard() {
    document.getElementById('card-inner').classList.toggle('rotate-y-180');
}

function nextCard() {
    if (currentCardIndex < currentSessionWords.length - 1) {
        currentCardIndex++;
        showCard();
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCard();
    }
}
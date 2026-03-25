/* =========================================
   PRACTICE & EXAM LOGIC
   ========================================= */

// Hàm Helper để set UI nút bấm cho gọn code (DRY principle)
function toggleButtonGroup(selector, activeClassList, inactiveClassList, clickedBtn) {
    document.querySelectorAll(selector).forEach(b => {
        b.classList.remove(...activeClassList);
        b.classList.add(...inactiveClassList);
    });
    clickedBtn.classList.remove(...inactiveClassList);
    clickedBtn.classList.add(...activeClassList);
}

function setQuizMode(mode, btn) {
    quizState.mode = mode;
    const activeClasses = ['border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-600', 'dark:text-blue-400'];
    const inactiveClasses = ['border-slate-100', 'dark:border-slate-700', 'text-slate-400', 'bg-transparent'];
    toggleButtonGroup('.q-mode-btn', activeClasses, inactiveClasses, btn);
}

function setQuizCount(num, btn) {
    quizState.total = num;
    const activeClasses = ['bg-white', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm', 'border', 'border-slate-100', 'dark:border-slate-600'];
    const inactiveClasses = ['text-slate-500', 'dark:text-slate-400', 'bg-transparent', 'border-transparent', 'shadow-none'];
    toggleButtonGroup('.q-count-btn', activeClasses, inactiveClasses, btn);
}

function updateQuizTopics() {
    const topicSelect = document.getElementById('quiz-topic-select');
    if (!topicSelect) return;
    
    const uniqueTopics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];
    
    // Sử dụng Semantic HTML <option>
    let optionsHTML = '<option value="all">🌐 Tất cả chủ đề (Trộn ngẫu nhiên)</option>';
    optionsHTML += uniqueTopics.map(t => `<option value="${t}">📂 Chủ đề: ${t}</option>`).join('');
    
    topicSelect.innerHTML = optionsHTML;
}

// THUẬT TOÁN SRS: Tính toán độ ưu tiên của từ vựng
function calculateSRSPriority(word) {
    let score = 0;
    const now = new Date().getTime();

    // 1. Ưu tiên cao nhất (100đ): Từ mới toanh, chưa từng làm bài test
    if (!word.lastReviewed || word.masteryLevel === undefined || word.masteryLevel === 0) {
        return 100 + Math.random(); 
    }

    const mastery = word.masteryLevel || 0;
    const hoursSinceReview = (now - new Date(word.lastReviewed).getTime()) / (1000 * 60 * 60);

    // 2. Ưu tiên cao (80đ): Những từ đã trả lời sai (mastery âm)
    if (mastery < 0) {
        score = 80 + hoursSinceReview; 
    } 
    // 3. Xử lý giãn cách thời gian cho từ đã thuộc
    else {
        // Mức 1: giãn 12h, Mức 2: giãn 24h, Mức 3: giãn 48h...
        const targetInterval = Math.pow(2, mastery - 1) * 12; 
        if (hoursSinceReview > targetInterval) {
            score = 50 + (hoursSinceReview - targetInterval); // Đã đến lúc phải ôn lại
        } else {
            score = 10 - mastery; // Chưa đến hạn ôn, độ ưu tiên rất thấp
        }
    }
    
    // Cộng thêm random nhỏ để các từ cùng mức điểm được đảo vị trí
    return score + Math.random(); 
}

function initNewQuiz() {
    const topic = document.getElementById('quiz-topic-select').value;
    let filtered = topic === 'all' ? [...vocabList] : vocabList.filter(v => (v.topic || 'Chung') === topic);
    
    if (filtered.length < 4) {
        return showToast("⚠️ Chủ đề này cần ít nhất 4 từ để tạo đề trắc nghiệm!", 'error');
    }

    // ĐOẠN NÂNG CẤP SRS: Sắp xếp bộ từ vựng theo điểm ưu tiên thay vì random mù quáng
    filtered.sort((a, b) => calculateSRSPriority(b) - calculateSRSPriority(a));

    quizState.pool = filtered.slice(0, quizState.total);
    quizState.currentIdx = 0;
    quizState.score = 0;
    quizState.wrongAnswers = []; 

    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-active').classList.remove('hidden');
    
    if (quizState.mode === 'exam') startTimer();
    renderQuizQuestion();
}

function renderQuizQuestion() {
    // Check end condition
    if (quizState.currentIdx >= quizState.pool.length) {
        return finishQuiz();
    }

    const wordObj = quizState.pool[quizState.currentIdx];
    
    // Reset giao diện Explanation
    document.getElementById('quiz-explanation').classList.add('hidden');
    const optionsContainer = document.getElementById('quiz-q-options');
    if (optionsContainer) optionsContainer.classList.remove('hidden');

    // Render text câu hỏi
    document.getElementById('quiz-q-word').innerText = wordObj.word;
    document.getElementById('quiz-q-ipa').innerText = wordObj.ipa || '/.../';
    document.getElementById('quiz-q-type').innerText = wordObj.type || 'v';
    
    // Cập nhật Progress Bar
    const progressPercent = (quizState.currentIdx / quizState.pool.length) * 100;
    document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('quiz-progress-text').innerText = `${quizState.currentIdx + 1}/${quizState.pool.length}`;

    // Tạo mảng đáp án: 1 Đúng + 3 Sai (Random từ thư viện)
    let options = [wordObj.mean];
    let distractors = vocabList.filter(v => v.word !== wordObj.word).map(v => v.mean);
    // Trộn và lấy 3 đáp án sai
    options = [...options, ...distractors.sort(() => 0.5 - Math.random()).slice(0, 3)].sort(() => 0.5 - Math.random());

    // Render Options Buttons
    if (optionsContainer) {
        optionsContainer.innerHTML = options.map(opt => {
            const escapedOpt = opt.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            return `
            <button onclick="handleQuizAnswer('${escapedOpt}', this)" 
                class="quiz-opt-btn w-full p-4 md:p-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm md:text-base text-slate-700 dark:text-slate-200 transition-all text-left hover:border-blue-500 hover:shadow-md focus:outline-none min-h-[80px]">
                ${opt}
            </button>`;
        }).join('');
    }

    if (appSettings.autoSpeak) speak(wordObj.word);
}

function handleQuizAnswer(selected, btn) {
    const wordObj = quizState.pool[quizState.currentIdx];
    const isCorrect = (selected === wordObj.mean);
    
    document.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
    
    // Khởi tạo các trường SRS nếu từ vựng cũ chưa có
    if (wordObj.masteryLevel === undefined) wordObj.masteryLevel = 0;
    wordObj.lastReviewed = new Date().toISOString(); // Đánh dấu thời gian vừa ôn tập xong

    if (isCorrect) {
        quizState.score++;
        wordObj.masteryLevel += 1; // Đúng -> Tăng mức độ thông thạo (sẽ lâu bị hỏi lại hơn)

        btn.classList.replace('border-slate-100', 'border-emerald-500');
        btn.classList.add('bg-emerald-50', 'text-emerald-700');
    } else {
        wordObj.masteryLevel = Math.max(-2, wordObj.masteryLevel - 1); // Sai -> Giảm thông thạo (sẽ bị hỏi lại sớm)
        
        quizState.wrongAnswers.push({
            word: wordObj.word,
            correct: wordObj.mean,
            wrongSelected: selected
        });
        
        btn.classList.replace('border-slate-100', 'border-red-500');
        btn.classList.add('bg-red-50', 'text-red-700');
        
        document.querySelectorAll('.quiz-opt-btn').forEach(b => {
            if (b.innerText.trim() === wordObj.mean) {
                b.classList.replace('border-slate-100', 'border-emerald-500');
                b.classList.add('border-dashed');
            }
        });
    }

    if (quizState.mode === 'learning') {
        setTimeout(() => {
            document.getElementById('quiz-q-options').classList.add('hidden');
            const explain = document.getElementById('quiz-explanation');
            
            document.getElementById('explain-mean').innerText = wordObj.mean;
            document.getElementById('explain-example').innerText = wordObj.example ? `"${wordObj.example}"` : "Không có ví dụ.";
            document.getElementById('explain-synonyms').innerText = wordObj.synonyms || 'N/A';
            document.getElementById('explain-antonyms').innerText = wordObj.antonyms || 'N/A';
            
            const noteBox = document.getElementById('explain-note-box');
            if(wordObj.note) {
                document.getElementById('explain-note').innerText = wordObj.note;
                noteBox.classList.remove('hidden');
            } else {
                noteBox.classList.add('hidden');
            }
            
            explain.classList.remove('hidden');
            quizState.currentIdx++;
        }, 600);
    } else {
        quizState.currentIdx++;
        setTimeout(renderQuizQuestion, 500);
    }
}

function startTimer() {
    const TIME_LIMIT = 60; // 60s Time Attack
    quizState.startTime = new Date();
    
    const timerContainer = document.getElementById('quiz-timer');
    const timerText = document.getElementById('timer-text');
    
    if (timerContainer) {
        timerContainer.classList.remove('hidden', 'bg-red-50', 'text-red-600', 'dark:bg-red-900/30', 'dark:text-red-400', 'animate-pulse');
        timerContainer.classList.add('bg-blue-50', 'text-blue-600', 'dark:bg-blue-900/30', 'dark:text-blue-400');
    }

    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    
    quizState.timerInterval = setInterval(() => {
        const passed = Math.floor((new Date() - quizState.startTime) / 1000);
        const remain = TIME_LIMIT - passed;
        
        if (remain <= 0) {
            clearInterval(quizState.timerInterval);
            if (timerText) timerText.innerText = "00:00";
            showToast("⏳ Hết giờ! Tự động nộp bài.", "error");
            finishQuiz();
            return;
        }

        // Cảnh báo đỏ nhấp nháy khi còn <= 10s
        if (remain <= 10 && timerContainer) {
            timerContainer.classList.remove('bg-blue-50', 'text-blue-600', 'dark:bg-blue-900/30', 'dark:text-blue-400');
            timerContainer.classList.add('bg-red-50', 'text-red-600', 'dark:bg-red-900/30', 'dark:text-red-400', 'animate-pulse');
        }

        if (timerText) {
            timerText.innerText = `${Math.floor(remain / 60).toString().padStart(2, '0')}:${(remain % 60).toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function finishQuiz() {
    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    
    document.getElementById('quiz-active').classList.add('hidden');
    const timerContainer = document.getElementById('quiz-timer');
    if (timerContainer) timerContainer.classList.add('hidden');

    const resultContainer = document.getElementById('quiz-result');
    resultContainer.classList.remove('hidden');

    const totalQ = quizState.pool.length;
    const finalScore = Math.round((quizState.score / totalQ) * 100);
    
    document.getElementById('result-score').innerText = finalScore;
    document.getElementById('result-summary').innerText = `Đúng ${quizState.score} / ${totalQ} câu`;
    
    const emojiEl = document.getElementById('result-emoji');
    if (emojiEl) emojiEl.innerText = finalScore === 100 ? '👑' : (finalScore >= 80 ? '🏆' : (finalScore >= 50 ? '🥈' : '📚'));

    const wrongAnsContainer = document.getElementById('wrong-answers-container');
    const wrongAnsList = document.getElementById('wrong-answers-list');
    
    if (quizState.wrongAnswers && quizState.wrongAnswers.length > 0) {
        wrongAnsContainer.classList.remove('hidden');
        wrongAnsList.innerHTML = quizState.wrongAnswers.map(err => `
            <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-red-200 dark:hover:border-red-900/50 transition-colors">
                <p class="font-black text-slate-800 dark:text-white text-base mb-2">${err.word}</p>
                <div class="space-y-1">
                    <p class="text-[11px] font-medium text-slate-400 dark:text-slate-500 line-through">❌ Đã chọn: ${err.wrongSelected}</p>
                    <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400">✅ Đáp án: ${err.correct}</p>
                </div>
            </div>
        `).join('');
    } else {
        wrongAnsContainer.classList.add('hidden');
    }

    // ĐOẠN THÊM MỚI: Lưu lại thông tin (masteryLevel, lastReviewed) vào dữ liệu sau khi thi xong
    if(typeof saveVocabToStorage === "function") {
        saveVocabToStorage();
    } else {
        localStorage.setItem('my_vocab', JSON.stringify(vocabList));
    }
}
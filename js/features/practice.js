// js/features/practice.js
import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';
import { AudioAPI } from '../shared/audio.js';

const PracticeModule = (function() {
    const CONFIG = {
        MIN_WORDS_REQUIRED: 4,
        DELAY_LEARNING_MODE: 600,
        SRS: {
            BASE_SCORE_NEW: 100,
            BASE_SCORE_NEGATIVE: 80,
            BASE_SCORE_OVERDUE: 50,
            MAX_SCORE_NORMAL: 10,
            INTERVAL_MULTIPLIER: 12
        }
    };

    const STYLES = {
        modeBtn: {
            active: ['border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-600', 'dark:text-blue-400'],
            inactive: ['border-slate-100', 'dark:border-slate-700', 'text-slate-400', 'bg-transparent']
        },
        countBtn: {
            active: ['bg-white', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm', 'border', 'border-slate-100', 'dark:border-slate-600'],
            inactive: ['text-slate-500', 'dark:text-slate-400', 'bg-transparent', 'border-transparent', 'shadow-none']
        },
        quizAns: {
            correct: ['border-emerald-500', 'bg-emerald-50', 'text-emerald-700', 'dark:bg-emerald-900/20', 'dark:text-emerald-400'],
            wrong: ['border-red-500', 'bg-red-50', 'text-red-700', 'dark:bg-red-900/20', 'dark:text-red-400'],
            missed: ['border-emerald-500', 'border-dashed', 'bg-emerald-50/50', 'dark:bg-emerald-900/10']
        },
        timer: {
            normal: ['bg-blue-50', 'text-blue-600', 'dark:bg-blue-900/30', 'dark:text-blue-400'],
            warning: ['bg-red-50', 'text-red-600', 'dark:bg-red-900/30', 'dark:text-red-400', 'animate-pulse']
        }
    };

    function calculateSRSPriority(word, currentTimeMs) {
        if (!word.lastReviewed || !word.masteryLevel) return CONFIG.SRS.BASE_SCORE_NEW + Math.random(); 
        const mastery = word.masteryLevel;
        const hoursSinceReview = (currentTimeMs - new Date(word.lastReviewed).getTime()) / (1000 * 60 * 60);

        if (mastery < 0) return CONFIG.SRS.BASE_SCORE_NEGATIVE + hoursSinceReview + Math.random(); 
        
        const targetInterval = Math.pow(2, mastery - 1) * CONFIG.SRS.INTERVAL_MULTIPLIER; 
        if (hoursSinceReview > targetInterval) return CONFIG.SRS.BASE_SCORE_OVERDUE + (hoursSinceReview - targetInterval) + Math.random(); 
        
        return CONFIG.SRS.MAX_SCORE_NORMAL - mastery + Math.random(); 
    }

    function generateOptions(correctMean, allVocab) {
        let distractors = allVocab
            .filter(v => v.mean !== correctMean)
            .map(v => v.mean)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
        return [correctMean, ...distractors].sort(() => 0.5 - Math.random());
    }

    function getUpdatedVocabList(vocabList, wordStr, isCorrect) {
        return vocabList.map(vocab => {
            if (vocab.word !== wordStr) return vocab;
            const currentMastery = vocab.masteryLevel || 0;
            const newMastery = isCorrect ? currentMastery + 1 : Math.max(-2, currentMastery - 1);
            return { ...vocab, masteryLevel: newMastery, lastReviewed: new Date().toISOString() };
        });
    }

    function swapClasses(element, removeClasses, addClasses) {
        if (!element) return;
        element.classList.remove(...removeClasses, 'border-slate-100'); 
        element.classList.add(...addClasses);
    }

    function toggleButtonGroup(selector, activeClassList, inactiveClassList, clickedBtn) {
        document.querySelectorAll(selector).forEach(b => {
            b.classList.remove(...activeClassList);
            b.classList.add(...inactiveClassList);
        });
        clickedBtn.classList.remove(...inactiveClassList);
        clickedBtn.classList.add(...activeClassList);
    }

    function renderActiveQuizView(quizState, wordObj, options, settings) {
        document.getElementById('quiz-setup').classList.add('hidden');
        document.getElementById('quiz-active').classList.remove('hidden');
        document.getElementById('quiz-explanation').classList.add('hidden');
        
        const optionsContainer = document.getElementById('quiz-q-options');
        optionsContainer.classList.remove('hidden');

        document.getElementById('quiz-q-word').innerText = wordObj.word;
        document.getElementById('quiz-q-ipa').innerText = wordObj.ipa || '/.../';
        document.getElementById('quiz-q-type').innerText = wordObj.type || 'v';
        
        const progressPercent = (quizState.currentIdx / quizState.pool.length) * 100;
        document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;
        document.getElementById('quiz-progress-text').innerText = `${quizState.currentIdx + 1}/${quizState.pool.length}`;

        optionsContainer.innerHTML = options.map(opt => {
            const escapedOpt = opt.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            return `
            <button data-action="answer-quiz" data-payload="${escapedOpt}" 
                class="quiz-opt-btn w-full p-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-base md:text-lg text-slate-700 dark:text-slate-200 transition-all text-left hover:border-blue-500 hover:shadow-md focus:outline-none min-h-[90px] leading-snug">
                ${opt}
            </button>`;
        }).join('');

        if (settings.autoSpeak) AudioAPI.speak(wordObj.word);
    }

    function renderExplanation(wordObj, settings) {
        document.getElementById('quiz-q-options').classList.add('hidden');
        const explain = document.getElementById('quiz-explanation');
        
        document.getElementById('explain-mean').innerText = wordObj.mean;
        document.getElementById('explain-example').innerText = (!settings.showExample) ? "Đã tắt hiển thị ví dụ." : (wordObj.example ? `"${wordObj.example}"` : "Không có ví dụ.");
        document.getElementById('explain-synonyms').innerText = (wordObj.synonyms && wordObj.synonyms !== 'None') ? wordObj.synonyms : 'N/A';
        document.getElementById('explain-antonyms').innerText = (wordObj.antonyms && wordObj.antonyms !== 'None') ? wordObj.antonyms : 'N/A';
        
        const noteBox = document.getElementById('explain-note-box');
        if(wordObj.note) {
            document.getElementById('explain-note').innerText = wordObj.note;
            noteBox.classList.remove('hidden');
        } else {
            noteBox.classList.add('hidden');
        }
        explain.classList.remove('hidden');
    }

    function setQuizMode(mode, btn) {
        AppState.updateQuiz({ mode: mode });
        toggleButtonGroup('.q-mode-btn', STYLES.modeBtn.active, STYLES.modeBtn.inactive, btn);
    }

    function setQuizCount(num, btn) {
        AppState.updateQuiz({ total: num });
        toggleButtonGroup('.q-count-btn', STYLES.countBtn.active, STYLES.countBtn.inactive, btn);
    }

    function updateQuizTopics() {
        const topicSelect = document.getElementById('quiz-topic-select');
        if (!topicSelect) return;
        
        const vocabList = AppState.getVocab();
        const uniqueTopics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];
        
        const optionsHTML = ['<option value="all">🌐 Tất cả chủ đề (Trộn ngẫu nhiên)</option>']
            .concat(uniqueTopics.map(t => `<option value="${t}">📂 Chủ đề: ${t}</option>`))
            .join('');
            
        topicSelect.innerHTML = optionsHTML;
    }

    function initNewQuiz() {
        const vocabList = AppState.getVocab();
        const quizState = AppState.getQuiz();
        const topicSelect = document.getElementById('quiz-topic-select');
        const topic = topicSelect && topicSelect.value ? topicSelect.value : 'all';
        
        const filteredVocab = topic === 'all' ? [...vocabList] : vocabList.filter(v => (v.topic || 'Chung') === topic);
        
        if (filteredVocab.length < CONFIG.MIN_WORDS_REQUIRED) {
            return showToast("⚠️ Cần ít nhất 4 từ để tạo đề trắc nghiệm!", 'error');
        }

        const currentTimeMs = new Date().getTime();
        filteredVocab.sort((a, b) => calculateSRSPriority(b, currentTimeMs) - calculateSRSPriority(a, currentTimeMs));

        AppState.updateQuiz({
            pool: filteredVocab.slice(0, quizState.total),
            currentIdx: 0,
            score: 0,
            wrongAnswers: []
        });

        if (AppState.getQuiz().mode === 'exam') startTimer();
        renderQuizQuestion();
    }

    function renderQuizQuestion() {
        const quizState = AppState.getQuiz();
        const settings = AppState.getSettings();
        const vocabList = AppState.getVocab();

        if (quizState.currentIdx >= quizState.pool.length) return finishQuiz();

        const wordObj = quizState.pool[quizState.currentIdx];
        const options = generateOptions(wordObj.mean, vocabList);

        renderActiveQuizView(quizState, wordObj, options, settings);
    }

    function handleQuizAnswer(selectedOption, btnElement) {
        const quizState = AppState.getQuiz();
        const settings = AppState.getSettings();
        const vocabList = AppState.getVocab();
        const wordObj = quizState.pool[quizState.currentIdx];

        const isCorrect = (selectedOption === wordObj.mean);
        document.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);

        const newVocabList = getUpdatedVocabList(vocabList, wordObj.word, isCorrect);
        AppState.setVocab(newVocabList);

        const newWrongAnswers = [...quizState.wrongAnswers];
        if (!isCorrect) {
            newWrongAnswers.push({
                word: wordObj.word,
                correct: wordObj.mean,
                wrongSelected: selectedOption
            });
        }
        AppState.updateQuiz({ score: isCorrect ? quizState.score + 1 : quizState.score, wrongAnswers: newWrongAnswers });

        if (isCorrect) {
            AudioAPI.playSound('success');
            swapClasses(btnElement, [], STYLES.quizAns.correct);
        } else {
            AudioAPI.playSound('error');
            swapClasses(btnElement, [], STYLES.quizAns.wrong);
            document.querySelectorAll('.quiz-opt-btn').forEach(b => {
                if (b.innerText.trim() === wordObj.mean) swapClasses(b, [], STYLES.quizAns.missed);
            });
        }

        if (quizState.mode === 'learning') {
            setTimeout(() => {
                renderExplanation(wordObj, settings);
                AppState.updateQuiz({ currentIdx: quizState.currentIdx + 1 });
            }, CONFIG.DELAY_LEARNING_MODE);
        } else {
            AppState.updateQuiz({ currentIdx: quizState.currentIdx + 1 });
            setTimeout(renderQuizQuestion, settings.autoNextDelay || 1000);
        }
    }

    function startTimer() {
        const quizState = AppState.getQuiz();
        const TIME_LIMIT = quizState.pool.length * 10; 
        
        const timerContainer = document.getElementById('quiz-timer');
        const timerText = document.getElementById('timer-text');
        
        if (timerContainer) {
            timerContainer.classList.remove('hidden', ...STYLES.timer.warning);
            timerContainer.classList.add(...STYLES.timer.normal);
        }

        if (quizState.timerInterval) clearInterval(quizState.timerInterval);
        
        const startTime = new Date();
        const timerInterval = setInterval(() => {
            const passed = Math.floor((new Date() - startTime) / 1000);
            const remain = TIME_LIMIT - passed;
            
            if (remain <= 0) {
                clearInterval(timerInterval);
                if (timerText) timerText.innerText = "00:00";
                showToast("⏳ Hết giờ! Tự động nộp bài.", "error");
                finishQuiz();
                return;
            }

            if (remain <= 10 && timerContainer) {
                timerContainer.classList.remove(...STYLES.timer.normal);
                timerContainer.classList.add(...STYLES.timer.warning);
            }

            if (timerText) {
                const mins = Math.floor(remain / 60).toString().padStart(2, '0');
                const secs = (remain % 60).toString().padStart(2, '0');
                timerText.innerText = `${mins}:${secs}`;
            }
        }, 1000);

        AppState.updateQuiz({ timerInterval: timerInterval, startTime: startTime });
    }

    function finishQuiz() {
        const quizState = AppState.getQuiz();
        if (quizState.timerInterval) clearInterval(quizState.timerInterval);
        
        document.getElementById('quiz-active').classList.add('hidden');
        const timerContainer = document.getElementById('quiz-timer');
        if (timerContainer) timerContainer.classList.add('hidden');

        const resultContainer = document.getElementById('quiz-result');
        resultContainer.classList.remove('hidden');

        const totalQ = quizState.pool.length;
        if (totalQ === 0) return;
        
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
                    <p class="font-black text-slate-800 dark:text-white text-base md:text-lg mb-2">${err.word}</p>
                    <div class="space-y-1.5">
                        <p class="text-[11px] md:text-xs font-medium text-slate-400 dark:text-slate-500 line-through">❌ Đã chọn: ${err.wrongSelected}</p>
                        <p class="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400">✅ Đáp án: ${err.correct}</p>
                    </div>
                </div>
            `).join('');
        } else {
            wrongAnsContainer.classList.add('hidden');
        }

        // Bắn sự kiện hoàn thành Quiz để HomeModule tự cộng Streak
        appEventBus.emit(EVENTS.QUIZ_FINISHED);
    }

    function exitQuiz() {
        const quizState = AppState.getQuiz();
        if (confirm('Bạn có chắc muốn dừng lại? Tiến độ bài thi này sẽ không được lưu.')) {
            if (quizState.timerInterval) clearInterval(quizState.timerInterval);
            document.getElementById('quiz-active').classList.add('hidden');
            const timerContainer = document.getElementById('quiz-timer');
            if (timerContainer) timerContainer.classList.add('hidden');
            document.getElementById('quiz-setup').classList.remove('hidden');
            document.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = false);
            showToast("Đã hủy bài thi", "error");
        }
    }

    const actions = {
        'set-quiz-mode': (payload, target) => setQuizMode(payload, target),
        'set-quiz-count': (payload, target) => setQuizCount(parseInt(payload, 10), target),
        'init-quiz': () => initNewQuiz(),
        'answer-quiz': (payload, target) => handleQuizAnswer(payload, target),
        'next-quiz-question': () => renderQuizQuestion(),
        'exit-quiz': () => exitQuiz()
    };

    return {
        init: initNewQuiz,
        updateTopics: updateQuizTopics,
        actions
    };
})();

export { PracticeModule };
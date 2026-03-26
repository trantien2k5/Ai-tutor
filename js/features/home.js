// js/features/home.js
import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';
import { AudioAPI } from '../shared/audio.js';

const HomeModule = (function() {
    function updateStats() {
        const container = document.getElementById('topic-list-container');
        if (!container) return;

        const vocabList = AppState.getVocab();
        const settings = AppState.getSettings();

        const topics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];
        const totalWords = vocabList.length;
        const dailyGoal = settings.dailyGoal || 10;
        const masteredWords = vocabList.filter(v => v.masteryLevel && v.masteryLevel > 0).length;

        const setHtml = (id, val) => { if (document.getElementById(id)) document.getElementById(id).innerText = val; };
        setHtml('stat-total-words', totalWords);
        setHtml('stat-total-topics', topics.length);
        setHtml('stat-mastered-words', masteredWords);
        setHtml('home-count', totalWords);
        setHtml('home-goal-text', `/ ${dailyGoal} từ mục tiêu`);

        const progressBar = document.getElementById('goal-progress-bar');
        if (progressBar) {
            const percent = Math.min((totalWords / dailyGoal) * 100, 100);
            setTimeout(() => { progressBar.style.width = percent + '%'; }, 100);
        }

        const hour = new Date().getHours();
        const greetingEl = document.getElementById('home-greeting-sub');
        const greetingTitle = document.getElementById('home-greeting');
        
        if (greetingEl && greetingTitle) {
            if (hour >= 5 && hour < 12) {
                greetingEl.innerText = "Chào buổi sáng ☀️";
                greetingTitle.innerText = "Bắt đầu ngày mới nào!";
            } else if (hour >= 12 && hour < 18) {
                greetingEl.innerText = "Chào buổi chiều 🌤️";
                greetingTitle.innerText = "Nạp thêm từ vựng nhé!";
            } else if (hour >= 18 && hour < 23) {
                greetingEl.innerText = "Chào buổi tối 🌙";
                greetingTitle.innerText = "Ôn tập trước khi ngủ!";
            } else {
                greetingEl.innerText = "Cú đêm chăm chỉ 🦉";
                greetingTitle.innerText = "Học xong nhớ ngủ sớm!";
            }
        }

        const tips = [
            "Học theo chủ đề giúp não bộ liên kết thông tin tốt hơn 40%.",
            "Ôn tập lại từ vựng ngay trước khi ngủ sẽ giúp chuyển vào trí nhớ dài hạn.",
            "Sử dụng AI Lab để tạo ngay 10 từ vựng cho chuyên ngành của bạn!",
            "Dùng chức năng Flashcard và đánh giá 'Quên/Đã thuộc' thật thà nhé.",
            "Đừng quên bật 'Tự động phát âm' để luyện phản xạ nghe tiếng Anh."
        ];
        const tipEl = document.getElementById('home-daily-tip');
        if (tipEl && !tipEl.dataset.loaded) {
            tipEl.innerText = tips[Math.floor(Math.random() * tips.length)];
            tipEl.dataset.loaded = "true"; 
        }

        if (topics.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-12 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 text-center shadow-sm">
                    <p class="text-5xl mb-4 opacity-40 drop-shadow-sm">📂</p>
                    <p class="text-slate-500 dark:text-slate-400 font-bold text-sm mb-5">Thư viện của bạn đang trống.</p>
                    <button onclick="appEventBus.emit('TAB_CHANGED', 'ai-gen')" class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors border border-blue-100 dark:border-blue-800/50 shadow-sm">Khám phá AI Lab →</button>
                </div>`;
            return;
        }

        container.innerHTML = topics.slice(0, 6).map((topic, index) => {
            const count = vocabList.filter(v => (v.topic || 'Chung') === topic).length;
            const colorPresets = [
                { bg: 'bg-blue-50 text-blue-500 border-blue-100', glow: 'from-blue-50 to-white' },
                { bg: 'bg-emerald-50 text-emerald-500 border-emerald-100', glow: 'from-emerald-50 to-white' },
                { bg: 'bg-indigo-50 text-indigo-500 border-indigo-100', glow: 'from-indigo-50 to-white' },
                { bg: 'bg-purple-50 text-purple-500 border-purple-100', glow: 'from-purple-50 to-white' },
                { bg: 'bg-rose-50 text-rose-500 border-rose-100', glow: 'from-rose-50 to-white' }
            ];
            const theme = colorPresets[index % colorPresets.length];

            return `
                <div data-action="start-flashcards" data-payload="${topic}" class="group relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 hover:border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px]">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.glow} dark:from-slate-700 dark:to-slate-800 rounded-full blur-2xl -z-10 transition-transform duration-500 group-hover:scale-150 opacity-60 -mr-10 -mt-10"></div>
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-10 h-10 ${theme.bg} dark:bg-slate-900/50 border dark:border-slate-700 rounded-[0.8rem] flex items-center justify-center text-xl group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-sm">📁</div>
                        <span class="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest group-hover:text-slate-600 transition-colors">${count} từ</span>
                    </div>
                    <div>
                        <h3 class="font-black text-slate-800 dark:text-white text-sm md:text-base uppercase tracking-tight truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title="${topic}">${topic}</h3>
                        <div class="mt-3 flex items-center justify-between">
                            <span class="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest group-hover:opacity-0 transition-opacity duration-300">Nhấn để học</span>
                            <span class="absolute bottom-5 left-5 text-[10px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0 duration-300">Bắt đầu →</span>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    function renderStreakUI() {
        const streakEl = document.getElementById('streak-count');
        if (!streakEl) return;
        
        const settings = AppState.getSettings();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let displayStreak = settings.streak || 0;
        if (settings.lastStudyDate !== today && settings.lastStudyDate !== yesterdayStr && settings.lastStudyDate !== null) {
            displayStreak = 0; 
            AppState.updateSettings({ streak: 0 }); // reset ngầm
        }
        streakEl.innerText = displayStreak;
    }

    function checkAndUpdateStreak() {
        const settings = AppState.getSettings();
        let currentStreak = settings.streak || 0;
        let lastDate = settings.lastStudyDate || null;
        const today = new Date().toISOString().split('T')[0];
        let streakMsg = "";

        if (lastDate !== today) {
            if (!lastDate || currentStreak === 0) {
                currentStreak = 1;
                streakMsg = "🔥 Khởi đầu tuyệt vời! Bạn đã có chuỗi 1 ngày.";
            } else {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastDate === yesterday.toISOString().split('T')[0]) {
                    currentStreak += 1;
                    streakMsg = `🔥 Cháy quá! Chuỗi ${currentStreak} ngày liên tiếp!`;
                } else {
                    currentStreak = 1;
                    streakMsg = "🔥 Bắt đầu lại chuỗi mới nhé. Đừng bỏ cuộc!";
                }
            }
            
            AppState.updateSettings({ streak: currentStreak, lastStudyDate: today });
            if (streakMsg) showToast(streakMsg, 'success');
            AudioAPI.playSound('success');
        }
    }

    // Lắng nghe sự kiện để tự động cập nhật
    appEventBus.on(EVENTS.VOCAB_UPDATED, updateStats);
    appEventBus.on(EVENTS.SETTINGS_UPDATED, () => {
        updateStats();
        renderStreakUI();
    });
    appEventBus.on(EVENTS.QUIZ_FINISHED, checkAndUpdateStreak);

    return { updateStats, renderStreakUI, checkAndUpdateStreak };
})();

export { HomeModule };
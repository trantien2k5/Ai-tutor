function updateStats() {
    const container = document.getElementById('topic-list-container');
    if (!container) return;

    const topics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];

    container.innerHTML = topics.map(topic => {
        const count = vocabList.filter(v => (v.topic || 'Chung') === topic).length;
        return `
            <div onclick="startFlashcards('${topic}')" class="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
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

    const totalCountEl = document.getElementById('home-count');
    const progressBar = document.getElementById('goal-progress-bar');
    if (totalCountEl) totalCountEl.innerText = vocabList.length;
    if (progressBar) {
        const percent = Math.min((vocabList.length / (appSettings.dailyGoal || 10)) * 100, 100);
        progressBar.style.width = percent + '%';
    }
}
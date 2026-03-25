function updateStats() {
    const container = document.getElementById('topic-list-container');
    if (!container) return;

    // Lấy dữ liệu thống kê
    const topics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];
    const totalWords = vocabList.length;
    const dailyGoal = appSettings.dailyGoal || 10;

    // 1. Cập nhật Thống kê Nhanh (Quick Stats)
    const statWordsEl = document.getElementById('stat-total-words');
    const statTopicsEl = document.getElementById('stat-total-topics');
    if (statWordsEl) statWordsEl.innerText = totalWords;
    if (statTopicsEl) statTopicsEl.innerText = topics.length;

    // 2. Cập nhật Banner Mục tiêu
    const homeCount = document.getElementById('home-count');
    const goalText = document.getElementById('home-goal-text');
    const progressBar = document.getElementById('goal-progress-bar');
    
    if (homeCount) homeCount.innerText = totalWords;
    if (goalText) goalText.innerText = `/ ${dailyGoal} từ`;
    if (progressBar) {
        const percent = Math.min((totalWords / dailyGoal) * 100, 100);
        // Delay nhẹ để tạo hiệu ứng thanh chạy mượt mà khi load trang
        setTimeout(() => { progressBar.style.width = percent + '%'; }, 300);
    }

    // 3. Hiển thị lời chào động theo thời gian
    const hour = new Date().getHours();
    const greetingEl = document.getElementById('home-greeting-sub');
    const greetingTitle = document.getElementById('home-greeting');
    if (greetingEl && greetingTitle) {
        if (hour < 12) {
            greetingEl.innerText = "Chào buổi sáng ☀️";
            greetingTitle.innerText = "Bắt đầu ngày mới nào!";
        } else if (hour < 18) {
            greetingEl.innerText = "Chào buổi chiều 🌤️";
            greetingTitle.innerText = "Nạp thêm từ vựng nhé!";
        } else {
            greetingEl.innerText = "Chào buổi tối 🌙";
            greetingTitle.innerText = "Ôn tập trước khi ngủ!";
        }
    }

    // 4. Random Mẹo học tập
    const tips = [
        "Học theo chủ đề giúp não bộ liên kết thông tin tốt hơn 40% so với học từ rời rạc.",
        "Ôn tập lại từ vựng ngay trước khi ngủ sẽ giúp trí nhớ ngắn hạn chuyển thành dài hạn.",
        "Hãy thử đọc to từ vựng thay vì chỉ nhìn bằng mắt, phản xạ nghe nói của bạn sẽ tăng đáng kể.",
        "Sử dụng AI Lab để tạo ngay 10 từ vựng cho chuyên ngành bạn đang làm việc nhé!"
    ];
    const tipEl = document.getElementById('home-daily-tip');
    if (tipEl && !tipEl.dataset.loaded) {
        tipEl.innerText = tips[Math.floor(Math.random() * tips.length)];
        tipEl.dataset.loaded = "true"; // Tránh đổi text liên tục mỗi khi re-render
    }

    // 5. Render Danh sách Chủ đề (Giao diện thẻ VIP)
    if (topics.length === 0) {
        container.innerHTML = `<div class="col-span-full py-10 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center"><p class="text-4xl mb-3 opacity-50">📂</p><p class="text-slate-500 dark:text-slate-400 font-bold text-sm">Chưa có chủ đề nào.</p><button onclick="switchTab('ai-gen')" class="mt-4 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600">Thêm ngay →</button></div>`;
        return;
    }

    container.innerHTML = topics.map((topic, index) => {
        const count = vocabList.filter(v => (v.topic || 'Chung') === topic).length;
        // Chuyển màu icon folder xen kẽ cho sinh động
        const colors = ['text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-purple-500'];
        const iconColor = colors[index % colors.length];

        return `
            <div onclick="startFlashcards('${topic}')" class="group relative overflow-hidden bg-white dark:bg-slate-800 p-5 lg:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-bl-[4rem] -z-10 transition-transform duration-500 group-hover:scale-125 opacity-50"></div>
                
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-2xl ${iconColor} group-hover:rotate-12 transition-transform duration-300">
                        📁
                    </div>
                    <span class="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">${count} từ</span>
                </div>
                
                <h3 class="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight mb-2 truncate" title="${topic}">${topic}</h3>
                
                <div class="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-4">
                    <span class="text-[10px] font-bold text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">Học ngay</span>
                    <div class="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white text-slate-400 transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
                    </div>
                </div>
            </div>`;
    }).join('');
}
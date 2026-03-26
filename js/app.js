/* =========================================
   APP INITIALIZATION & BOOTSTRAP
   ========================================= */

function refreshAllUI() {
    if (typeof renderLibrary === 'function') renderLibrary();
    if (typeof updateStats === 'function') updateStats();
    if (typeof renderVocabList === 'function') renderVocabList();
    if (typeof updateQuizTopics === 'function') updateQuizTopics();
}

window.onload = async () => {
    // 1. Nạp toàn bộ HTML Component trước
    await Promise.all([
        loadComponent('tab-home', 'home.html'),
        loadComponent('tab-library', 'library.html'),
        loadComponent('tab-ai-gen', 'ai.html'),
        loadComponent('tab-practice', 'practice.html'),
        loadComponent('tab-settings', 'settings.html')
    ]);

    // 2. Khởi chạy các cấu hình người dùng
    if (typeof loadSettingsUI === 'function') loadSettingsUI();
    if (typeof applyTheme === 'function') applyTheme();
    if (typeof loadVoices === 'function') loadVoices();
    
    // 3. Render dữ liệu
    refreshAllUI();
    
    // 4. KHỞI ĐỘNG ĐIỀU HƯỚNG THÔNG MINH
    // Đọc link xem người dùng đang ở tab nào trước khi F5, mở lại đúng tab đó!
    const initialTab = typeof getInitialTab === 'function' ? getInitialTab() : 'home';
    
    // Truyền false để không pushState thừa lần đầu tiên
    switchTab(initialTab, false);

    // 5. Cập nhật ngọn lửa Streak (Nếu bạn đã cài tính năng này)
    if (typeof renderStreakUI === "function") renderStreakUI();
};
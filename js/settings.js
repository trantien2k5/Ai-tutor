// js/settings.js

// Bật tắt chế độ ban đêm
function toggleDarkMode() {
    const settings = AppState.getSettings();
    AppState.updateSettings({ darkMode: !settings.darkMode });
    applyTheme();
}

// Cập nhật giao diện theo cài đặt Theme
function applyTheme() {
    const settings = AppState.getSettings();
    const htmlClass = document.documentElement.classList;
    const bodyClass = document.body.classList;
    const darkToggleThumb = document.getElementById('dark-mode-toggle-thumb');

    if (settings.darkMode) {
        htmlClass.add('dark');
        bodyClass.add('bg-slate-900');
        if (darkToggleThumb) darkToggleThumb.style.transform = 'translateX(100%)';
    } else {
        htmlClass.remove('dark');
        bodyClass.remove('bg-slate-900');
        if (darkToggleThumb) darkToggleThumb.style.transform = 'translateX(0)';
    }
}

// Cập nhật nhãn Tốc độ đọc
function updateRateLabel(value) {
    const label = document.getElementById('tts-rate-label');
    if (label) label.innerText = parseFloat(value).toFixed(1) + 'x';
}

// Reset lịch sử thi
function resetQuizStats() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ điểm số và lịch sử thi?')) {
        AppState.updateQuiz({ score: 0, wrongAnswers: [] });
        showToast('Đã xóa lịch sử thi!', 'success');
    }
}

// Xóa toàn bộ dữ liệu từ vựng
function clearAllData() {
    if (confirm('⚠️ NGUY HIỂM: Hành động này sẽ xóa sạch toàn bộ từ vựng và không thể khôi phục. Bạn có chắc chắn?')) {
        AppState.setVocab([]);
        if (typeof refreshAllUI === 'function') refreshAllUI();
        showToast('🗑️ Đã làm sạch toàn bộ dữ liệu', 'success');
        switchTab('home');
    }
}

// Lưu các cấu hình vào DB
function saveSettings() {
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : null;
    const getCheck = (id) => document.getElementById(id) ? document.getElementById(id).checked : null;

    AppState.updateSettings({
        dailyGoal: parseInt(getVal('setting-goal')) || 10,
        voiceName: getVal('setting-voice') || '',
        ttsRate: parseFloat(getVal('setting-tts-rate')) || 1.0,
        reduceMotion: getCheck('setting-reduce-motion'),
        fontSize: getVal('setting-font-size') || 'md',
        autoSpeak: getCheck('setting-auto-speak'),
        sfxEnabled: getCheck('setting-sfx'),
        showIPA: getCheck('setting-show-ipa'),
        showExample: getCheck('setting-show-example'),
        autoFlip: getVal('setting-auto-flip') || 'off',
        shuffleFlashcards: getCheck('setting-shuffle'),
        autoNextDelay: parseInt(getVal('setting-auto-next')) || 1000,
        aiLevel: getVal('setting-ai-level') || 'B1-B2',
        aiCount: getVal('setting-ai-count') || '10',
        reminderTime: getVal('setting-reminder-time') || ''
    });

    if (typeof updateStats === 'function') updateStats();
    
    if (AppState.getSettings().sfxEnabled && typeof playSound === 'function') playSound('success');
    showToast('💾 Đã lưu cài đặt');
}

// Khởi tạo giao diện cài đặt
function loadSettingsUI() {
    const settings = AppState.getSettings();
    const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val; };
    const setCheck = (id, val) => { if (document.getElementById(id)) document.getElementById(id).checked = val; };

    setVal('setting-goal', settings.dailyGoal);
    setVal('setting-tts-rate', settings.ttsRate);
    setVal('setting-font-size', settings.fontSize);
    setVal('setting-auto-flip', settings.autoFlip);
    setVal('setting-auto-next', settings.autoNextDelay);
    setVal('setting-ai-level', settings.aiLevel);
    setVal('setting-ai-count', settings.aiCount);
    setVal('setting-reminder-time', settings.reminderTime);
    
    setCheck('setting-auto-speak', settings.autoSpeak);
    setCheck('setting-sfx', settings.sfxEnabled);
    setCheck('setting-show-ipa', settings.showIPA);
    setCheck('setting-show-example', settings.showExample);
    setCheck('setting-shuffle', settings.shuffleFlashcards);
    setCheck('setting-reduce-motion', settings.reduceMotion);

    updateRateLabel(settings.ttsRate);
    applyTheme();
}
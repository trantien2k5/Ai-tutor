/* =========================================
   SETTINGS LOGIC
   ========================================= */

function toggleDarkMode() {
    appSettings.darkMode = !appSettings.darkMode;
    applyTheme();
    saveSettings();
}

function applyTheme() {
    const htmlClass = document.documentElement.classList;
    const bodyClass = document.body.classList;
    const darkToggleThumb = document.getElementById('dark-mode-toggle-thumb');

    if (appSettings.darkMode) {
        htmlClass.add('dark');
        bodyClass.add('bg-slate-900');
        if (darkToggleThumb) darkToggleThumb.style.transform = 'translateX(100%)';
    } else {
        htmlClass.remove('dark');
        bodyClass.remove('bg-slate-900');
        if (darkToggleThumb) darkToggleThumb.style.transform = 'translateX(0)';
    }
}

// Cập nhật nhãn Tốc độ đọc trực tiếp khi kéo thanh trượt
function updateRateLabel(value) {
    const label = document.getElementById('tts-rate-label');
    if (label) label.innerText = parseFloat(value).toFixed(1) + 'x';
}

/* =========================================
   DATA MANAGEMENT
   ========================================= */

function resetQuizStats() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ điểm số và lịch sử thi?')) {
        quizState.score = 0;
        quizState.wrongAnswers = [];
        showToast('Đã xóa lịch sử thi!', 'success');
    }
}

function clearAllData() {
    if (confirm('⚠️ NGUY HIỂM: Hành động này sẽ xóa sạch toàn bộ từ vựng và không thể khôi phục. Bạn có chắc chắn?')) {
        vocabList = [];
        
        if (typeof saveVocabToStorage === 'function') {
            saveVocabToStorage();
        } else {
            localStorage.setItem('my_vocab', JSON.stringify(vocabList));
        }
        
        if (typeof refreshAllUI === 'function') refreshAllUI();
        showToast('🗑️ Đã làm sạch toàn bộ dữ liệu', 'success');
        switchTab('home');
    }
}

function exportData() {
    if (vocabList.length === 0) {
        showToast('Thư viện đang trống, không có dữ liệu để xuất!', 'error');
        return;
    }
    
    try {
        const dataStr = JSON.stringify(vocabList, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        
        const dateStr = new Date().toISOString().split('T')[0];
        link.href = URL.createObjectURL(blob);
        link.download = `AI_Vocab_Backup_${dateStr}.json`;
        
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('📤 Xuất dữ liệu thành công!');
    } catch (error) {
        showToast('❌ Lỗi khi xuất dữ liệu', 'error');
        console.error("Export Error:", error);
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = ''; // Reset để import lại file cũ nếu muốn
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedData)) {
                throw new Error("Format không hợp lệ");
            }
            
            let newWordsCount = 0;
            const uniqueImports = importedData.filter(importItem => {
                const isExist = vocabList.some(v => v.word.toLowerCase() === importItem.word.toLowerCase());
                if (!isExist) newWordsCount++;
                return !isExist;
            });

            if (newWordsCount === 0) {
                showToast('⚠️ Dữ liệu này đã tồn tại trong thư viện!', 'error');
                return;
            }

            vocabList = [...uniqueImports, ...vocabList];
            
            if (typeof saveVocabToStorage === 'function') {
                saveVocabToStorage();
            } else {
                localStorage.setItem('my_vocab', JSON.stringify(vocabList));
            }

            if (typeof refreshAllUI === 'function') refreshAllUI();
            showToast(`📥 Nạp thành công ${newWordsCount} từ vựng mới!`);
            
        } catch (err) { 
            showToast('❌ File JSON không hợp lệ hoặc bị lỗi!', 'error');
            console.error("Import Error:", err);
        }
    };
    
    reader.onerror = () => {
        showToast('❌ Không thể đọc file', 'error');
    };

    reader.readAsText(file);
}

/* =========================================
   SETTINGS LOGIC (10+ FEATURES)
   ========================================= */

function updateRateLabel(value) {
    const label = document.getElementById('tts-rate-label');
    if (label) label.innerText = parseFloat(value).toFixed(1) + 'x';
}

// Logic xin quyền Push Notification khi user chọn giờ nhắc học
function toggleReminder() {
    const timeVal = document.getElementById('setting-reminder-time').value;
    if (timeVal) {
        if (Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    showToast(`🔔 Đã bật nhắc học lúc ${timeVal}`);
                    saveSettings();
                } else {
                    showToast(`❌ Bạn đã từ chối quyền gửi thông báo`, 'error');
                    document.getElementById('setting-reminder-time').value = ''; // Reset
                }
            });
        } else {
            showToast(`🔔 Đã cập nhật giờ nhắc học: ${timeVal}`);
            saveSettings();
        }
    }
}

function saveSettings() {
    // Thu thập tất cả DOM elements
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : null;
    const getCheck = (id) => document.getElementById(id) ? document.getElementById(id).checked : null;

    // Ghi đè vào object cấu hình
    appSettings = {
        ...appSettings,
        dailyGoal: parseInt(getVal('setting-goal')) || 10,
        voiceName: getVal('setting-voice') || '',
        ttsRate: parseFloat(getVal('setting-tts-rate')) || 1.0,
        
        // Cụm Giao diện & Âm thanh
        reduceMotion: getCheck('setting-reduce-motion'),
        fontSize: getVal('setting-font-size') || 'md',
        autoSpeak: getCheck('setting-auto-speak'),
        sfxEnabled: getCheck('setting-sfx'),
        
        // Cụm Flashcard
        showIPA: getCheck('setting-show-ipa'),
        showExample: getCheck('setting-show-example'),
        autoFlip: getVal('setting-auto-flip') || 'off',
        shuffleFlashcards: getCheck('setting-shuffle'),
        
        // Cụm Trắc nghiệm & AI
        autoNextDelay: parseInt(getVal('setting-auto-next')) || 1000,
        aiLevel: getVal('setting-ai-level') || 'B1-B2',
        aiCount: getVal('setting-ai-count') || '10',
        
        // Nhắc nhở
        reminderTime: getVal('setting-reminder-time') || ''
    };

    localStorage.setItem('app_settings', JSON.stringify(appSettings));
    if (typeof updateStats === 'function') updateStats();
    
    // Nếu bật sfx, cho kêu cái "Ting" để user biết
    if (appSettings.sfxEnabled && typeof playSound === 'function') playSound('success');
    
    showToast('💾 Đã lưu cài đặt');
}

function loadSettingsUI() {
    // Khởi tạo các giá trị mặc định cho 10 biến mới nếu app lần đầu chạy
    const defaults = {
        reduceMotion: false, fontSize: 'md', sfxEnabled: true, showIPA: true,
        showExample: true, autoFlip: 'off', autoNextDelay: 1000, 
        aiLevel: 'B1-B2', aiCount: '10', reminderTime: ''
    };
    appSettings = { ...defaults, ...appSettings };

    // Set value cho các input/select
    const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val; };
    const setCheck = (id, val) => { if (document.getElementById(id)) document.getElementById(id).checked = val; };

    setVal('setting-goal', appSettings.dailyGoal);
    setVal('setting-tts-rate', appSettings.ttsRate);
    setVal('setting-font-size', appSettings.fontSize);
    setVal('setting-auto-flip', appSettings.autoFlip);
    setVal('setting-auto-next', appSettings.autoNextDelay);
    setVal('setting-ai-level', appSettings.aiLevel);
    setVal('setting-ai-count', appSettings.aiCount);
    setVal('setting-reminder-time', appSettings.reminderTime);
    
    setCheck('setting-auto-speak', appSettings.autoSpeak);
    setCheck('setting-sfx', appSettings.sfxEnabled);
    setCheck('setting-show-ipa', appSettings.showIPA);
    setCheck('setting-show-example', appSettings.showExample);
    setCheck('setting-shuffle', appSettings.shuffleFlashcards);
    setCheck('setting-reduce-motion', appSettings.reduceMotion);

    updateRateLabel(appSettings.ttsRate);
    applyTheme();
}
// --- LOGIC GIAO DIỆN & CÀI ĐẶT ---

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

function saveSettings() {
    const goalInput = document.getElementById('setting-goal');
    const voiceSelect = document.getElementById('setting-voice');
    const autoSpeakCheck = document.getElementById('setting-auto-speak');

    // Validate Input từ User
    if (goalInput) {
        let goalVal = parseInt(goalInput.value);
        if (isNaN(goalVal) || goalVal < 1) goalVal = 10;
        appSettings.dailyGoal = goalVal;
    }
    
    if (voiceSelect) appSettings.voiceName = voiceSelect.value;
    if (autoSpeakCheck) appSettings.autoSpeak = autoSpeakCheck.checked;

    localStorage.setItem('app_settings', JSON.stringify(appSettings));
    if (typeof updateStats === 'function') updateStats();
    
    showToast('💾 Đã lưu cài đặt');
}

function loadSettingsUI() {
    const goalInput = document.getElementById('setting-goal');
    const autoSpeakCheck = document.getElementById('setting-auto-speak');
    
    if (goalInput) goalInput.value = appSettings.dailyGoal || 10;
    if (autoSpeakCheck) autoSpeakCheck.checked = !!appSettings.autoSpeak;
    
    applyTheme();
}

// --- LOGIC QUẢN LÝ DỮ LIỆU ---

function resetQuizStats() {
    // Dù quy tắc khuyên hạn chế alert/confirm, với các tác vụ xóa nguy hiểm vẫn nên dùng confirm hoặc Modal.
    if (confirm('Bạn có chắc muốn xóa toàn bộ điểm số và lịch sử thi?')) {
        quizState.score = 0;
        quizState.wrongAnswers = [];
        showToast('Đã xóa lịch sử thi!', 'success');
    }
}

function clearAllData() {
    if (confirm('⚠️ NGUY HIỂM: Hành động này sẽ xóa sạch toàn bộ từ vựng và không thể khôi phục. Bạn có chắc chắn?')) {
        vocabList = [];
        
        // Sử dụng hàm an toàn nếu có, ngược lại fallback về localStorage
        if (typeof saveVocabToStorage === 'function') {
            saveVocabToStorage();
        } else {
            localStorage.removeItem('my_vocab');
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
        
        // Đặt tên file rõ nghĩa, tránh magic number
        const dateStr = new Date().toISOString().split('T')[0];
        link.href = URL.createObjectURL(blob);
        link.download = `AI_Vocab_Backup_${dateStr}.json`;
        
        link.click();
        URL.revokeObjectURL(link.href); // Cleanup memory
        showToast('📤 Xuất dữ liệu thành công!');
    } catch (error) {
        showToast('❌ Lỗi khi xuất dữ liệu', 'error');
        console.error("Export Error:", error);
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset value để có thể import cùng 1 file nhiều lần nếu cần
    event.target.value = '';

    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Xử lý lỗi UI thân thiện: Kiểm tra cấu trúc data trước khi nạp
            if (!Array.isArray(importedData)) {
                throw new Error("Format không hợp lệ");
            }
            
            // Lọc ra các từ chưa tồn tại để tránh trùng lặp
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
    
    // Luôn xử lý lỗi quá trình đọc file
    reader.onerror = () => {
        showToast('❌ Không thể đọc file', 'error');
    };

    reader.readAsText(file);
}
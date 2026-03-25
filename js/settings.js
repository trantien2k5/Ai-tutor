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
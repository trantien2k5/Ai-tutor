// js/features/settings.js
import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';
import { AudioAPI } from '../shared/audio.js';

const SettingsModule = (function() {

    // --- LOGIC GIAO DIỆN (UI) ---
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

    function loadVoicesUI() {
        const voices = AudioAPI.initVoices();
        const voiceSelect = document.getElementById('setting-voice');
        if (!voiceSelect || voices.length === 0) return;
        
        const settings = AppState.getSettings();
        voiceSelect.innerHTML = voices.map(v => 
            `<option value="${v.name}" ${v.name === settings.voiceName ? 'selected' : ''}>${v.name} (${v.lang})</option>`
        ).join('');
    }

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
        loadVoicesUI();
    }

    function updateRateLabel(value) {
        const label = document.getElementById('tts-rate-label');
        if (label) label.innerText = parseFloat(value).toFixed(1) + 'x';
    }

    // --- LOGIC XỬ LÝ (BUSINESS) ---
    function toggleDarkMode() {
        const settings = AppState.getSettings();
        AppState.updateSettings({ darkMode: !settings.darkMode });
    }

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

        if (AppState.getSettings().sfxEnabled) AudioAPI.playSound('success');
        showToast('💾 Đã lưu cài đặt');
    }

    // --- QUẢN LÝ DỮ LIỆU ---
    function resetQuizStats() {
        if (confirm('Bạn có chắc muốn xóa toàn bộ điểm số và lịch sử thi?')) {
            AppState.updateQuiz({ score: 0, wrongAnswers: [] });
            showToast('Đã xóa lịch sử thi!', 'success');
        }
    }

    function clearAllData() {
        if (confirm('⚠️ NGUY HIỂM: Hành động này sẽ xóa sạch toàn bộ từ vựng. Bạn có chắc chắn?')) {
            AppState.setVocab([]); // AppState sẽ tự động emit sự kiện VOCAB_UPDATED
            showToast('🗑️ Đã làm sạch toàn bộ dữ liệu', 'success');
            // Tạm thời redirect thủ công, sau này sẽ do Router lo
            appEventBus.emit(EVENTS.TAB_CHANGED, 'home'); 
        }
    }

    function exportData() {
        const vocab = AppState.getVocab();
        if (vocab.length === 0) return showToast("Thư viện trống, không có gì để sao lưu!", "error");
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocab));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `aivocab_backup_${new Date().toISOString().slice(0,10)}.json`);
        dlAnchorElem.click();
        showToast("Đã tải xuống file sao lưu!");
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    AppState.setVocab(importedData);
                    showToast("Phục hồi dữ liệu thành công!");
                    appEventBus.emit(EVENTS.TAB_CHANGED, 'library');
                } else {
                    showToast("File không đúng định dạng!", "error");
                }
            } catch (err) {
                showToast("Lỗi đọc file backup!", "error");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; 
    }

    function toggleReminder() {
        const time = document.getElementById('setting-reminder-time').value;
        if (time) showToast(`Đã đặt nhắc nhở học vào lúc ${time}`);
    }

    // --- ĐĂNG KÝ LẮNG NGHE SỰ KIỆN (PUB/SUB) ---
    // Khi settings thay đổi, tự động áp dụng Theme mới ngay lập tức
    appEventBus.on(EVENTS.SETTINGS_UPDATED, applyTheme);

    return {
        initUI: loadSettingsUI,
        toggleDarkMode,
        saveSettings,
        updateRateLabel,
        resetQuizStats,
        clearAllData,
        exportData,
        importData,
        toggleReminder,
        applyTheme
    };
})();

// Gắn các hàm cần thiết vào window để các thuộc tính onclick="" trong HTML vẫn gọi được
window.toggleDarkMode = SettingsModule.toggleDarkMode;
window.saveSettings = SettingsModule.saveSettings;
window.updateRateLabel = SettingsModule.updateRateLabel;
window.resetQuizStats = SettingsModule.resetQuizStats;
window.clearAllData = SettingsModule.clearAllData;
window.exportData = SettingsModule.exportData;
window.importData = SettingsModule.importData;
window.toggleReminder = SettingsModule.toggleReminder;

export { SettingsModule };
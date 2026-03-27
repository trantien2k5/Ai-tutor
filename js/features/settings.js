import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';
import { AudioAPI } from '../shared/audio.js';

const SettingsModule = (function() {

    function applyTheme() {
        try {
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
        } catch (error) {
            console.error('[SettingsModule - applyTheme] Lỗi xử lý giao diện:', error);
        }
    }

    function loadVoicesUI() {
        try {
            const voices = AudioAPI.initVoices();
            const voiceSelect = document.getElementById('setting-voice');
            
            if (!voiceSelect) return;
            
            if (!voices || voices.length === 0) {
                voiceSelect.innerHTML = '<option value="">(Chưa tải được giọng đọc)</option>';
                return;
            }
            
            const settings = AppState.getSettings();
            voiceSelect.innerHTML = voices.map(v => 
                `<option value="${v.name}" ${v.name === settings.voiceName ? 'selected' : ''}>${v.name} (${v.lang})</option>`
            ).join('');
        } catch (error) {
            console.error('[SettingsModule - loadVoicesUI] Lỗi tải danh sách giọng đọc:', error);
        }
    }

    function loadSettingsUI() {
        try {
            const settings = AppState.getSettings();
            
            const setVal = (id, val) => { 
                const el = document.getElementById(id); 
                if (el) el.value = val !== undefined ? val : ''; 
            };
            
            const setCheck = (id, val) => { 
                const el = document.getElementById(id); 
                if (el) el.checked = !!val; 
            };

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
        } catch (error) {
            console.error('[SettingsModule - loadSettingsUI] Lỗi tải dữ liệu lên UI:', error);
            showToast('❌ Lỗi hiển thị dữ liệu cài đặt', 'error');
        }
    }

    function updateRateLabel(value) {
        try {
            const label = document.getElementById('tts-rate-label');
            if (label) label.innerText = parseFloat(value).toFixed(1) + 'x';
        } catch (error) {
            console.error('[SettingsModule - updateRateLabel] Lỗi cập nhật nhãn tốc độ:', error);
        }
    }

    function toggleDarkMode() {
        try {
            const settings = AppState.getSettings();
            AppState.updateSettings({ darkMode: !settings.darkMode });
        } catch (error) {
            console.error('[SettingsModule - toggleDarkMode] Lỗi đổi chế độ tối:', error);
            showToast('❌ Có lỗi khi đổi giao diện', 'error');
        }
    }

    function saveSettings() {
        try {
            const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : null;
            const getCheck = (id) => document.getElementById(id) ? document.getElementById(id).checked : false;

            AppState.updateSettings({
                dailyGoal: parseInt(getVal('setting-goal'), 10) || 10,
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
                autoNextDelay: parseInt(getVal('setting-auto-next'), 10) || 1000,
                aiLevel: getVal('setting-ai-level') || 'B1-B2',
                aiCount: getVal('setting-ai-count') || '10',
                reminderTime: getVal('setting-reminder-time') || ''
            });

            if (AppState.getSettings().sfxEnabled) {
                try { AudioAPI.playSound('success'); } catch(e) {}
            }
            
            showToast('💾 Đã lưu cài đặt');
        } catch (error) {
            console.error('[SettingsModule - saveSettings] Lỗi lưu cài đặt:', error);
            showToast('❌ Hệ thống gặp lỗi khi lưu cài đặt', 'error');
        }
    }

    function resetQuizStats() {
        try {
            if (confirm('Bạn có chắc muốn xóa toàn bộ điểm số và lịch sử thi?')) {
                AppState.updateQuiz({ score: 0, wrongAnswers: [], currentIdx: 0 });
                showToast('✅ Đã xóa lịch sử thi!', 'success');
            }
        } catch (error) {
            console.error('[SettingsModule - resetQuizStats] Lỗi xóa dữ liệu ôn tập:', error);
            showToast('❌ Lỗi không thể xóa lịch sử', 'error');
        }
    }

    function clearAllData() {
        try {
            if (confirm('⚠️ NGUY HIỂM: Hành động này sẽ xóa sạch toàn bộ từ vựng. Bạn có chắc chắn?')) {
                AppState.setVocab([]); 
                showToast('🗑️ Đã làm sạch toàn bộ dữ liệu', 'success');
                appEventBus.emit(EVENTS.TAB_CHANGED, 'home'); 
            }
        } catch (error) {
            console.error('[SettingsModule - clearAllData] Lỗi làm sạch thư viện:', error);
            showToast('❌ Lỗi hệ thống khi xóa dữ liệu', 'error');
        }
    }

    function exportData() {
        try {
            const vocab = AppState.getVocab();
            if (!vocab || vocab.length === 0) {
                showToast("⚠️ Thư viện trống, không có gì để sao lưu!", "error");
                return;
            }
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocab));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `aivocab_backup_${new Date().toISOString().slice(0,10)}.json`);
            
            document.body.appendChild(dlAnchorElem);
            dlAnchorElem.click();
            document.body.removeChild(dlAnchorElem);
            
            showToast("✅ Đã tải xuống file sao lưu!");
        } catch (error) {
            console.error('[SettingsModule - exportData] Lỗi xuất file Backup:', error);
            showToast("❌ Quá trình xuất dữ liệu thất bại", "error");
        }
    }

    function importData(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (Array.isArray(importedData)) {
                        AppState.setVocab(importedData);
                        showToast("✅ Phục hồi dữ liệu thành công!");
                        appEventBus.emit(EVENTS.TAB_CHANGED, 'library');
                    } else {
                        throw new Error("Dữ liệu JSON không khớp định dạng mảng từ vựng.");
                    }
                } catch (err) {
                    console.error('[SettingsModule - importData] Lỗi phân tích JSON:', err);
                    showToast("❌ File không hợp lệ hoặc bị hỏng!", "error");
                }
            };
            
            reader.onerror = function() {
                console.error('[SettingsModule - importData] Lỗi đọc luồng file.');
                showToast("❌ Không thể đọc file này!", "error");
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('[SettingsModule - importData] Lỗi xử lý chọn file:', error);
            showToast("❌ Có lỗi xảy ra khi nạp file", "error");
        } finally {
            if (event.target) event.target.value = ''; 
        }
    }

    function toggleReminder() {
        try {
            const timeEl = document.getElementById('setting-reminder-time');
            if (!timeEl) return;
            
            const time = timeEl.value;
            if (time) {
                showToast(`⏰ Đã đặt nhắc nhở học vào lúc ${time}`);
            }
        } catch (error) {
            console.error('[SettingsModule - toggleReminder] Lỗi cấu hình nhắc nhở:', error);
            showToast("❌ Lỗi thiết lập hẹn giờ", "error");
        }
    }

    try {
        appEventBus.on(EVENTS.SETTINGS_UPDATED, applyTheme);

        document.addEventListener('input', (e) => {
            if (e.target.id === 'setting-tts-rate') {
                updateRateLabel(e.target.value);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.closest('[data-action="import-data"]')) {
                importData(e);
            }
        });
    } catch (error) {
        console.error('[SettingsModule - Initialization] Lỗi gán sự kiện hệ thống:', error);
    }

    const actions = {
        'toggle-dark-mode': () => toggleDarkMode(),
        'save-settings': () => saveSettings(),
        'reset-quiz-stats': () => resetQuizStats(),
        'clear-all-data': () => clearAllData(),
        'export-data': () => exportData(),
        'toggle-reminder': () => toggleReminder()
    };

    return {
        initUI: loadSettingsUI,
        applyTheme,
        actions
    };
})();

export { SettingsModule };
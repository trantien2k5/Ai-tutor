// js/core/state.js
import { StorageAPI } from './storage.js';
import { appEventBus, EVENTS } from './eventBus.js';

class AppStateManager {
    constructor() {
        // Khởi tạo state từ bộ nhớ
        this.vocabList = StorageAPI.getVocab();
        this.appSettings = StorageAPI.getSettings();
        this.quizState = {
            pool: [],
            currentIdx: 0,
            score: 0,
            wrongAnswers: [],
            mode: 'exam',
            total: 10,
            timerInterval: null,
            startTime: null
        };
    }

    // --- API TỪ VỰNG ---
    getVocab() {
        return this.vocabList;
    }
    
    setVocab(newData) {
        this.vocabList = newData;
        StorageAPI.saveVocab(this.vocabList);
        // 🔥 ĐIỂM SÁNG: Phát tín hiệu thay vì gọi hàm trực tiếp
        appEventBus.emit(EVENTS.VOCAB_UPDATED, this.vocabList);
    }

    // --- API CÀI ĐẶT ---
    getSettings() {
        return this.appSettings;
    }
    
    updateSettings(updates) {
        this.appSettings = { ...this.appSettings, ...updates };
        StorageAPI.saveSettings(this.appSettings);
        // 🔥 ĐIỂM SÁNG: Báo cho UI biết để đổi Theme, đổi mục tiêu...
        appEventBus.emit(EVENTS.SETTINGS_UPDATED, this.appSettings);
    }

    // --- API BÀI THI (QUIZ) ---
    getQuiz() {
        return this.quizState;
    }
    
    updateQuiz(updates) {
        this.quizState = { ...this.quizState, ...updates };
    }
}

// Xuất ra một bản thể duy nhất (Singleton)
export const AppState = new AppStateManager();
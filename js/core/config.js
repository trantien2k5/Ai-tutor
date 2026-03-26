// js/core/config.js

export const APP_CONFIG = {
    VERSION: '2.0.0', // Cập nhật version kiến trúc mới
    
    STORAGE_KEYS: {
        VOCAB: 'my_vocab',
        SETTINGS: 'app_settings'
    },
    
    DEFAULT_SETTINGS: {
        darkMode: false,
        dailyGoal: 10,
        ttsRate: 1.0,
        reduceMotion: false,
        fontSize: 'md',
        autoSpeak: false,
        sfxEnabled: true,
        showIPA: true,
        showExample: true,
        autoFlip: 'off',
        autoNextDelay: 1000,
        aiLevel: 'B1-B2',
        aiCount: '10',
        reminderTime: '',
        streak: 0,
        lastStudyDate: null
    },

    QUIZ: {
        SECONDS_PER_QUESTION: 10,
        PASS_SCORE_PERCENT: 50,
        MIN_WORDS_REQUIRED: 4
    },

    SRS: {
        MAX_PENALTY: -2,
        INTERVAL_MULTIPLIER: 12
    }
};
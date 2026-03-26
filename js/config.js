/* =========================================
   APP CONFIGURATIONS (Cấu hình hệ thống)
   Mục đích: Gom toàn bộ các hằng số, thông số mặc định vào một chỗ.
   ========================================= */

const APP_CONFIG = {
    VERSION: '1.1.0',
    
    // Từ khóa để lưu trong LocalStorage (Tránh gõ sai chính tả ở các file khác)
    STORAGE_KEYS: {
        VOCAB: 'my_vocab',
        SETTINGS: 'app_settings'
    },
    
    // Cấu hình mặc định cho người dùng mới vào web lần đầu
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

    // Luật chơi của phần Luyện tập & Flashcard
    QUIZ: {
        SECONDS_PER_QUESTION: 10, // 10 giây cho 1 câu trắc nghiệm
        PASS_SCORE_PERCENT: 50,   // Dưới 50% là rớt
        MIN_WORDS_REQUIRED: 4     // Cần ít nhất 4 từ để tạo 4 đáp án (A, B, C, D)
    },

    // Thuật toán Spaced Repetition (SRS)
    SRS: {
        MAX_PENALTY: -2,          // Điểm thông thạo thấp nhất (Tránh bị trừ vô cực)
        INTERVAL_MULTIPLIER: 12   // Hệ số giãn cách giờ ôn tập
    }
};
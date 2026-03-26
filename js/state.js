// Quản lý trạng thái toàn cục (State Management)
const AppState = (function() {
    let vocabList = StorageAPI.getVocab();
    let appSettings = StorageAPI.getSettings();
    let quizState = {
        pool: [],
        currentIdx: 0,
        score: 0,
        wrongAnswers: [],
        mode: 'exam',
        total: 10,
        timerInterval: null,
        startTime: null
    };

    return {
        // Lấy danh sách từ vựng hiện tại
        getVocab: () => vocabList,
        
        // Cập nhật và tự động lưu danh sách từ vựng mới
        setVocab: (data) => {
            vocabList = data;
            StorageAPI.saveVocab(vocabList);
        },

        // Lấy cấu hình ứng dụng
        getSettings: () => appSettings,
        
        // Ghi đè và tự động lưu cấu hình
        updateSettings: (updates) => {
            appSettings = { ...appSettings, ...updates };
            StorageAPI.saveSettings(appSettings);
        },

        // Lấy trạng thái bài thi
        getQuiz: () => quizState,
        
        // Cập nhật trạng thái bài thi
        updateQuiz: (updates) => {
            quizState = { ...quizState, ...updates };
        }
    };
})();
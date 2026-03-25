/* Các biến Global State */
let vocabList = JSON.parse(localStorage.getItem('my_vocab')) || [];
let voices = [];
let appSettings = JSON.parse(localStorage.getItem('app_settings')) || {
    dailyGoal: 10,
    ttsRate: 1.0,
    voiceName: '',
    darkMode: false,
    autoSpeak: false
};

let quizState = {
    pool: [],
    currentIdx: 0,
    score: 0,
    total: 20,
    mode: 'learning',
    startTime: null,
    timerInterval: null
};

let currentSessionWords = [];
let currentCardIndex = 0;
let searchTimeout;
let notebookRenderLimit = 50;

// Hàm lưu dữ liệu an toàn, chống crash khi quá tải 5MB
function saveVocabToStorage() {
    try {
        localStorage.setItem('my_vocab', JSON.stringify(vocabList));
        return true;
    } catch (e) {
        // Lỗi 22 trên Firefox, 1014 trên Safari, name = QuotaExceededError trên Chrome
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
            alert('⚠️ BỘ NHỚ TRÌNH DUYỆT ĐÃ ĐẦY! Không thể lưu thêm từ vựng. Vui lòng Xuất Dữ Liệu (Backup) và Xóa bớt các chủ đề cũ.');
            // Trả lại mảng về trạng thái cũ để không hiển thị ảo trên UI
            vocabList.pop(); 
            return false;
        } else {
            console.error('Lỗi không xác định khi lưu dữ liệu:', e);
            return false;
        }
    }
}
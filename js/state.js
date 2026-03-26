/* =========================================
   GLOBAL STATE (Quản lý Trạng thái Ứng dụng)
   ========================================= */

// 1. Tự động lấy dữ liệu từ Storage đẩy lên RAM ngay khi web tải xong
let vocabList = StorageAPI.getVocab();
let appSettings = StorageAPI.getSettings();

// 2. State bài thi (Dữ liệu tạm thời, F5 là mất, không cần lưu ổ cứng)
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

// 3. CÁC HÀM TIỆN ÍCH (Giúp các file cũ không bị báo lỗi)
// Thay vì phải đi sửa localStorage ở hàng chục file, ta chỉ cần gọi 2 hàm này:
function saveVocabToStorage() {
    StorageAPI.saveVocab(vocabList);
}

function saveSettingsToStorage() {
    StorageAPI.saveSettings(appSettings);
}
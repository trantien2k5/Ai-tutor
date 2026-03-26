/* =========================================
   STORAGE LAYER (Quản lý Database)
   Mục đích: Tách biệt hoàn toàn logic đọc/ghi dữ liệu. Sau này muốn đổi 
   sang Firebase hoặc Backend API thì chỉ cần sửa DUY NHẤT file này.
   ========================================= */

const StorageAPI = {
    // --- QUẢN LÝ TỪ VỰNG ---
    getVocab: () => {
        try {
            const data = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.VOCAB);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Lỗi đọc dữ liệu từ vựng:", e);
            return [];
        }
    },

    saveVocab: (data) => {
        try {
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.VOCAB, JSON.stringify(data));
        } catch (e) {
            console.error("Lỗi lưu dữ liệu từ vựng:", e);
            if (typeof showToast === 'function') showToast("Lỗi bộ nhớ: Không thể lưu dữ liệu!", "error");
        }
    },

    clearVocab: () => {
        try {
            localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.VOCAB);
        } catch (e) {
            console.error("Lỗi xóa từ vựng:", e);
        }
    },

    // --- QUẢN LÝ CÀI ĐẶT & STREAK ---
    getSettings: () => {
        try {
            const data = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SETTINGS);
            // Gộp cài đặt mặc định với cài đặt đã lưu (tránh lỗi khi thêm tính năng mới)
            return data ? { ...APP_CONFIG.DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...APP_CONFIG.DEFAULT_SETTINGS };
        } catch (e) {
            console.error("Lỗi đọc cấu hình:", e);
            return { ...APP_CONFIG.DEFAULT_SETTINGS };
        }
    },

    saveSettings: (settings) => {
        try {
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error("Lỗi lưu cấu hình:", e);
        }
    }
};
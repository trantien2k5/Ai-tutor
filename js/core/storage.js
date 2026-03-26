// js/core/storage.js
import { APP_CONFIG } from './config.js';

export const StorageAPI = {
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
            // Lưu ý: Không gọi alert hay showToast trực tiếp ở đây nữa
        }
    },

    clearVocab: () => {
        try {
            localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.VOCAB);
        } catch (e) {
            console.error("Lỗi xóa từ vựng:", e);
        }
    },

    // --- QUẢN LÝ CÀI ĐẶT ---
    getSettings: () => {
        try {
            const data = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SETTINGS);
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
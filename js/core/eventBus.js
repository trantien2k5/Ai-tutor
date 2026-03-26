// js/core/eventBus.js

class EventBus {
    constructor() {
        this.listeners = {};
    }

    // Đăng ký lắng nghe một sự kiện
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    // Hủy đăng ký lắng nghe
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    // Cập nhật hàm emit trong js/core/eventBus.js
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            // Thêm try-catch để khoanh vùng lỗi của từng Subscriber
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventBus] 🔥 Lỗi ở một module khi nghe sự kiện '${event}':`, error);
                // Lỗi ở module này sẽ bị nuốt chửng, không làm chết các module khác đang xếp hàng chờ nghe
            }
        });
    }
}

// Xuất ra một instance duy nhất dùng chung cho toàn app (Singleton pattern)
export const appEventBus = new EventBus();

// Khai báo sẵn các tên sự kiện để tránh gõ sai chính tả (Typo)
export const EVENTS = {
    VOCAB_UPDATED: 'VOCAB_UPDATED',
    SETTINGS_UPDATED: 'SETTINGS_UPDATED',
    QUIZ_FINISHED: 'QUIZ_FINISHED',
    THEME_CHANGED: 'THEME_CHANGED',
    TAB_CHANGED: 'TAB_CHANGED'
};
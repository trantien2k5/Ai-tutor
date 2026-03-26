// js/shared/ui-helpers.js

/**
 * Hiển thị thông báo góc trên màn hình
 * @param {string} message - Nội dung thông báo
 * @param {string} type - 'success' hoặc 'error'
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-slate-900/90 dark:bg-blue-600/90' : 'bg-red-600/90';
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md font-bold text-xs uppercase tracking-widest toast-in pointer-events-auto`;
    toast.innerHTML = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.replace('toast-in', 'toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
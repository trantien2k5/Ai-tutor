/* =========================================
   NAVIGATION & ROUTING LOGIC
   ========================================= */

function switchTab(tabId, pushHistory = true) {
    // 1. Ẩn tất cả tab và "Gỡ" hiệu ứng cũ
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.add('hidden');
        c.classList.remove('animate-in', 'fade-in', 'slide-in-from-bottom-4');
    });

    // 2. Hiện tab mục tiêu và Kích hoạt hiệu ứng mượt mà
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.remove('hidden');
        void targetTab.offsetWidth; 
        targetTab.classList.add('animate-in', 'fade-in', 'slide-in-from-bottom-4');
    }

    // 3. Cập nhật giao diện thanh menu
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isCurrent = btn.getAttribute('data-tab') === tabId;
        
        btn.classList.remove('text-blue-600', 'bg-blue-50', 'dark:bg-blue-900/20');
        btn.classList.add('text-slate-400');

        if (isCurrent) {
            btn.classList.add('text-blue-600');
            btn.classList.remove('text-slate-400');
            if (!btn.closest('nav')) {
                btn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            }
        }
    });

    // 4. Luôn cuộn mượt về đầu trang khi qua tab mới
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 5. Tích hợp Lịch sử trình duyệt
    if (pushHistory) {
        const url = new URL(window.location);
        url.searchParams.set('tab', tabId); 
        window.history.pushState({ tab: tabId }, '', url);
    }
}

// 6. Lắng nghe sự kiện người dùng bấm nút Back / Forward
window.addEventListener('popstate', (event) => {
    const tabId = event.state && event.state.tab ? event.state.tab : 'home';
    switchTab(tabId, false);
});

// 7. Hỗ trợ đọc URL khi mới mở web
function getInitialTab() {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'home';
}

// 8. HÀM BỊ THIẾU ĐÃ ĐƯỢC BỔ SUNG: Nạp HTML component
async function loadComponent(id, fileName) {
    try {
        const response = await fetch(`components/${fileName}`);
        const target = document.getElementById(id);
        if (response.ok && target) {
            const rawHtml = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHtml, 'text/html');
            const section = doc.querySelector('section');
            target.innerHTML = section ? section.innerHTML : rawHtml;
        }
    } catch (error) {
        console.error("Lỗi nạp component:", fileName, error);
    }
}
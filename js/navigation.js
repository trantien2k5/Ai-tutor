function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.classList.remove('hidden');

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
}

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
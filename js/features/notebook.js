import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';

const NotebookModule = (function() {
    let searchTimeout = null;
    let observer = null;
    let currentFilteredList = [];
    let currentRenderLimit = 0;
    let currentViewMode = 'list';
    const CHUNK_SIZE = 30;

    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag));
    }

    function handleSearchInput() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { renderVocabList(true); }, 300);
    }

    function setLibraryViewMode(mode) {
        currentViewMode = mode;
        const btnList = document.getElementById('view-btn-list');
        const btnGrid = document.getElementById('view-btn-grid');
        const activeClass = ['bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-blue-500'];
        const inactiveClass = ['text-slate-400'];

        if (mode === 'list') {
            if (btnList) { btnList.classList.add(...activeClass); btnList.classList.remove(...inactiveClass); }
            if (btnGrid) { btnGrid.classList.remove(...activeClass); btnGrid.classList.add(...inactiveClass); }
        } else {
            if (btnGrid) { btnGrid.classList.add(...activeClass); btnGrid.classList.remove(...inactiveClass); }
            if (btnList) { btnList.classList.remove(...activeClass); btnList.classList.add(...inactiveClass); }
        }
        renderVocabList(true);
    }

    function initIntersectionObserver() {
        if (observer) observer.disconnect();
        const sentinel = document.getElementById('infinite-scroll-sentinel');
        if (!sentinel) return;

        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && currentRenderLimit < currentFilteredList.length) {
                renderNextChunk();
            }
        }, { rootMargin: '200px' });
        
        observer.observe(sentinel);
    }

    function applyFiltersAndSort() {
        const vocabList = AppState.getVocab() || [];
        const searchInput = document.getElementById('library-search');
        const topicSelect = document.getElementById('library-topic-filter');
        const filterSelect = document.getElementById('library-filter');
        const sortSelect = document.getElementById('library-sort');

        const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
        const topicFilter = (topicSelect && topicSelect.value) ? topicSelect.value : 'all';
        const filterType = (filterSelect && filterSelect.value) ? filterSelect.value : 'all';
        const sortType = (sortSelect && sortSelect.value) ? sortSelect.value : 'newest';
        
        let result = vocabList.filter(item => {
            const wordMatch = (item.word || '').toLowerCase().includes(searchTerm);
            const meanMatch = (item.mean || '').toLowerCase().includes(searchTerm);
            const exampleMatch = (item.example || '').toLowerCase().includes(searchTerm);
            
            const matchesSearch = wordMatch || meanMatch || exampleMatch;
            // Đã xóa bỏ escapeHTML hoàn toàn ở đây để khớp chữ chuẩn
            const matchesTopic = topicFilter === 'all' || (item.topic || 'Chung') === topicFilter;
            const matchesFilter = filterType === 'all' || ((item.type || 'n') === filterType);
            
            return matchesSearch && matchesTopic && matchesFilter;
        });

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            const masteryA = a.masteryLevel || 0;
            const masteryB = b.masteryLevel || 0;

            switch (sortType) {
                case 'oldest': return dateA - dateB;
                case 'az': return (a.word || '').localeCompare(b.word || '');
                case 'za': return (b.word || '').localeCompare(a.word || '');
                case 'mastery_asc': return masteryA - masteryB;
                case 'mastery_desc': return masteryB - masteryA;
                case 'newest':
                default: return dateB - dateA;
            }
        });

        return result;
    }

    function renderVocabList(reset = true) {
        try {
            const container = document.getElementById('vocab-container');
            const sentinel = document.getElementById('infinite-scroll-sentinel');
            if (!container) return;

            if (reset) {
                currentFilteredList = applyFiltersAndSort();
                currentRenderLimit = 0;
                container.innerHTML = ''; 

                container.className = currentViewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                    : 'flex flex-col gap-4';

                if (currentFilteredList.length === 0) {
                    container.innerHTML = `
                        <div class="col-span-full py-20 text-center animate-pulse">
                            <p class="text-5xl mb-4 opacity-50" aria-hidden="true">🔍</p>
                            <p class="text-slate-500 dark:text-slate-400 font-bold">Không tìm thấy từ vựng nào.</p>
                        </div>`;
                    if (sentinel) sentinel.classList.add('hidden');
                    return;
                }

                if (sentinel) sentinel.classList.remove('hidden');
                initIntersectionObserver();
            }

            renderNextChunk();
        } catch (error) {
            console.error('Lỗi khi render danh sách Sổ tay:', error);
        }
    }

    function renderNextChunk() {
        const container = document.getElementById('vocab-container');
        if (!container) return;

        const nextItems = currentFilteredList.slice(currentRenderLimit, currentRenderLimit + CHUNK_SIZE);
        if (nextItems.length === 0) return;

        const vocabList = AppState.getVocab();
        
        const htmlStr = nextItems.map((item) => {
            const safeWord = escapeHTML(item.word || 'N/A');
            const safeMean = escapeHTML(item.mean || 'Chưa có nghĩa');
            const safeIpa = escapeHTML(item.ipa || '/.../');
            const safeExample = escapeHTML(item.example || 'Chưa có ví dụ minh họa.');
            const safeType = escapeHTML(item.type || 'n');

            const originalIndex = vocabList.findIndex(v => v.word === item.word && v.mean === item.mean);
            
            let typeColor = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
            if(safeType === 'v') typeColor = 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50';
            else if(safeType === 'adj') typeColor = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50';
            else if(safeType === 'adv') typeColor = 'bg-purple-50 text-purple-500 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50';
            else typeColor = 'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50';

            const wordIcon = item.wordIcon || '📝'; 
            let masteryIcon = '📚';
            if ((item.masteryLevel || 0) >= 3) masteryIcon = '✅';
            if ((item.masteryLevel || 0) < 0) masteryIcon = '⚠️';

            const layoutClasses = currentViewMode === 'grid' ? 'flex-col items-start gap-4' : 'flex-row items-start gap-5';
            const exampleClasses = currentViewMode === 'grid' ? 'mt-auto pt-4' : 'mb-0';

            return `
            <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex ${layoutClasses}">
                <div class="w-16 h-16 md:w-20 md:h-20 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-4xl md:text-5xl group-hover:rotate-12 transition-transform duration-300 flex-shrink-0 relative" aria-hidden="true">
                    ${wordIcon}
                    <span class="absolute -bottom-2 -right-2 text-xs md:text-sm bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">${masteryIcon}</span>
                </div>

                <div class="flex-1 w-full flex flex-col h-full">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight truncate">${safeWord}</h3>
                        <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${typeColor}">${safeType}</span>
                    </div>
                    <p class="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 mb-2 tracking-wider">${safeIpa}</p>
                    <p class="text-slate-700 dark:text-slate-200 font-bold text-sm md:text-base mb-3 pr-20 leading-snug line-clamp-2">${safeMean}</p>
                    
                    <div class="bg-slate-50 dark:bg-slate-900/50 p-3 md:p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 relative ${exampleClasses}">
                        <span class="absolute top-1 right-2 md:top-2 md:right-3 text-2xl md:text-3xl font-serif text-slate-200 dark:text-slate-700 leading-none" aria-hidden="true">"</span>
                        <p class="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed font-medium relative z-10 line-clamp-2">${safeExample}</p>
                    </div>
                </div>

                <div class="absolute top-4 right-4 md:top-5 md:right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 transform translate-x-4 group-hover:translate-x-0">
                    <button data-action="speak" data-payload="${safeWord}" aria-label="Phát âm" class="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-blue-50 hover:bg-blue-500 text-blue-500 hover:text-white dark:bg-blue-900/30 rounded-xl transition-colors shadow-sm"><span aria-hidden="true">🔊</span></button>
                    <button data-action="delete-vocab" data-payload="${originalIndex}" aria-label="Xóa từ" class="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-400 hover:text-white dark:bg-red-900/30 rounded-xl transition-colors shadow-sm"><span aria-hidden="true">🗑️</span></button>
                </div>
            </div>`;
        }).join('');

        container.insertAdjacentHTML('beforeend', htmlStr);
        currentRenderLimit += CHUNK_SIZE;

        const sentinel = document.getElementById('infinite-scroll-sentinel');
        if (currentRenderLimit >= currentFilteredList.length && sentinel) {
            sentinel.classList.add('hidden');
        }
    }

    function deleteVocab(index) {
        if (confirm('Xóa từ này khỏi sổ tay?')) {
            const currentVocab = [...AppState.getVocab()];
            currentVocab.splice(index, 1);
            AppState.setVocab(currentVocab);
        }
    }

    document.addEventListener('input', (e) => {
        if (e.target.id === 'library-search') handleSearchInput();
    });

    document.addEventListener('change', (e) => {
        if (['library-topic-filter', 'library-filter', 'library-sort'].includes(e.target.id)) {
            renderVocabList(true);
        }
    });

    appEventBus.on(EVENTS.VOCAB_UPDATED, () => {
        const notebookView = document.getElementById('library-notebook-view');
        if (notebookView && !notebookView.classList.contains('hidden')) {
            renderVocabList(true);
        }
    });

    const actions = {
        'set-lib-view-mode': (payload) => setLibraryViewMode(payload),
        'delete-vocab': (payload) => deleteVocab(parseInt(payload, 10))
    };

    return { renderVocabList, actions };
})();

export { NotebookModule };
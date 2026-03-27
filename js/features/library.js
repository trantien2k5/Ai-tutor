import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';

const LibraryModule = (function() {
    let searchTimeout = null;
    let observer = null;
    let currentFilteredList = [];
    let currentRenderLimit = 0;
    let currentViewMode = 'list';
    const CHUNK_SIZE = 30;

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
            btnList.classList.add(...activeClass);
            btnList.classList.remove(...inactiveClass);
            btnGrid.classList.remove(...activeClass);
            btnGrid.classList.add(...inactiveClass);
        } else {
            btnGrid.classList.add(...activeClass);
            btnGrid.classList.remove(...inactiveClass);
            btnList.classList.remove(...activeClass);
            btnList.classList.add(...inactiveClass);
        }
        renderVocabList(true);
    }

    function switchLibView(view, targetTopic = null) {
        const topicsView = document.getElementById('library-topics-view');
        const notebookView = document.getElementById('library-notebook-view');
        const btnOpenNotebook = document.getElementById('btn-open-notebook');
        const btnBackTopics = document.getElementById('btn-back-topics');
        const libTitle = document.getElementById('lib-title');
        const libSubtitle = document.getElementById('lib-subtitle');

        if (view === 'topics') {
            if (topicsView) topicsView.classList.remove('hidden');
            if (notebookView) notebookView.classList.add('hidden');
            if (btnOpenNotebook) btnOpenNotebook.classList.remove('hidden');
            if (btnBackTopics) btnBackTopics.classList.add('hidden');
            if (libTitle) libTitle.innerText = 'Thư viện Chủ đề';
            if (libSubtitle) libSubtitle.innerText = 'Quản lý các bộ từ vựng của bạn';
        } else {
            if (topicsView) topicsView.classList.add('hidden');
            if (notebookView) notebookView.classList.remove('hidden');
            if (btnOpenNotebook) btnOpenNotebook.classList.add('hidden');
            if (btnBackTopics) btnBackTopics.classList.remove('hidden');
            if (libTitle) libTitle.innerText = 'Sổ tay Tổng hợp';
            if (libSubtitle) libSubtitle.innerText = 'Tra cứu toàn bộ từ vựng';
            
            const topicFilter = document.getElementById('library-topic-filter');
            if (topicFilter) {
                topicFilter.value = targetTopic || 'all';
            }
            renderVocabList(true);
        }
    }

    function renderLibrary() {
        const container = document.getElementById('library-topics-view');
        const topicFilterSelect = document.getElementById('library-topic-filter');
        if (!container) return;
        
        const vocabList = AppState.getVocab();
        const topics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];
        
        if (topicFilterSelect) {
            topicFilterSelect.innerHTML = '<option value="all">🌐 Tất cả chủ đề</option>' + 
                topics.map(t => `<option value="${t}">${t}</option>`).join('');
        }

        if (topics.length === 0) {
            container.innerHTML = `
            <div class="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                <p class="text-5xl mb-4 opacity-50">📭</p>
                <h3 class="text-lg font-black text-slate-700 dark:text-slate-200">Thư viện trống</h3>
                <p class="text-sm font-medium text-slate-400 mt-2">Hãy dùng AI để tạo ngay bộ từ vựng đầu tiên!</p>
                <button onclick="appEventBus.emit('TAB_CHANGED', 'ai-gen')" class="mt-6 bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors shadow-sm">Tạo từ mới ✨</button>
            </div>`;
            return;
        }

        container.innerHTML = topics.map((topic) => {
            const count = vocabList.filter(v => (v.topic || 'Chung') === topic).length;
            let icon = '🔖';
            let name = topic;

            const firstSpaceIndex = topic.indexOf(' ');
            if (firstSpaceIndex !== -1 && firstSpaceIndex <= 4) { 
                icon = topic.substring(0, firstSpaceIndex).trim();
                name = topic.substring(firstSpaceIndex + 1).trim();
            } else {
                name = topic.replace(/^📁\s*/, '');
            }

            return `
            <div class="group relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px]" onclick="switchLibView('notebook', '${topic}')">
                <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-full blur-2xl -z-10 transition-transform duration-500 group-hover:scale-150 opacity-60 -mr-10 -mt-10"></div>
                
                <div class="flex justify-between items-start mb-4">
                    <div class="w-14 h-14 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-sm">${icon}</div>
                    <div class="flex gap-1">
                        <button onclick="event.stopPropagation(); window.addMoreWordsToTopic('${topic}')" class="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100">➕</button>
                        <button onclick="event.stopPropagation(); deleteTopic('${topic}')" class="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100">🗑️</button>
                    </div>
                </div>
                
                <div>
                    <h3 class="font-black text-slate-800 dark:text-white text-lg tracking-tight truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title="${name}">${name}</h3>
                    <div class="mt-3 flex items-center justify-between">
                        <span class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-slate-100 dark:border-slate-700/50">${count} từ</span>
                        <button onclick="event.stopPropagation(); document.querySelector('[data-action=start-flashcards][data-payload=\\'${topic}\\']').click()" data-action="start-flashcards" data-payload="${topic}" class="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg hover:bg-blue-500 hover:text-white transition-colors">Ôn tập →</button>
                    </div>
                </div>
            </div>`;
        }).join('');
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
        const vocabList = AppState.getVocab();
        const searchInput = document.getElementById('library-search');
        const topicSelect = document.getElementById('library-topic-filter');
        const filterSelect = document.getElementById('library-filter');
        const sortSelect = document.getElementById('library-sort');

        const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
        const topicFilter = (topicSelect && topicSelect.value) ? topicSelect.value : 'all';
        const filterType = filterSelect ? filterSelect.value : 'all';
        const sortType = sortSelect ? sortSelect.value : 'newest';
        
        let result = vocabList.filter(item => {
            const matchesSearch = item.word.toLowerCase().includes(searchTerm) || item.mean.toLowerCase().includes(searchTerm) || (item.example && item.example.toLowerCase().includes(searchTerm));
            const matchesTopic = topicFilter === 'all' || (item.topic === topicFilter);
            const matchesFilter = filterType === 'all' || (item.type === filterType);
            return matchesSearch && matchesTopic && matchesFilter;
        });

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            const masteryA = a.masteryLevel || 0;
            const masteryB = b.masteryLevel || 0;

            switch (sortType) {
                case 'oldest': return dateA - dateB;
                case 'az': return a.word.localeCompare(b.word);
                case 'za': return b.word.localeCompare(a.word);
                case 'mastery_asc': return masteryA - masteryB;
                case 'mastery_desc': return masteryB - masteryA;
                case 'newest':
                default:
                    return dateB - dateA;
            }
        });

        return result;
    }

    function renderVocabList(reset = true) {
        const container = document.getElementById('vocab-container');
        const sentinel = document.getElementById('infinite-scroll-sentinel');
        if (!container) return;

        if (reset) {
            currentFilteredList = applyFiltersAndSort();
            currentRenderLimit = 0;
            container.innerHTML = ''; 

            if (currentViewMode === 'grid') {
                container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
            } else {
                container.className = 'flex flex-col gap-4';
            }

            if (currentFilteredList.length === 0) {
                container.innerHTML = `<div class="col-span-full py-20 text-center animate-pulse"><p class="text-5xl mb-4 opacity-50">🔍</p><p class="text-slate-500 dark:text-slate-400 font-bold">Không tìm thấy từ vựng nào.</p></div>`;
                if (sentinel) sentinel.classList.add('hidden');
                return;
            }

            if (sentinel) sentinel.classList.remove('hidden');
            initIntersectionObserver();
        }

        renderNextChunk();
    }

    function renderNextChunk() {
        const container = document.getElementById('vocab-container');
        if (!container) return;

        const nextItems = currentFilteredList.slice(currentRenderLimit, currentRenderLimit + CHUNK_SIZE);
        if (nextItems.length === 0) return;

        const vocabList = AppState.getVocab();
        
        const htmlStr = nextItems.map((item) => {
            const originalIndex = vocabList.findIndex(v => v.word === item.word && v.mean === item.mean);
            let typeColor = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
            if(item.type === 'v') typeColor = 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50';
            else if(item.type === 'adj') typeColor = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50';
            else if(item.type === 'adv') typeColor = 'bg-purple-50 text-purple-500 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50';
            else typeColor = 'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50';

            const safeWord = item.word.replace(/"/g, '&quot;');
            const wordIcon = item.wordIcon || '📝'; 
            
            let masteryIcon = '📚';
            if ((item.masteryLevel || 0) >= 3) masteryIcon = '✅';
            if ((item.masteryLevel || 0) < 0) masteryIcon = '⚠️';

            const layoutClasses = currentViewMode === 'grid' 
                ? 'flex-col items-start gap-4' 
                : 'flex-row items-start gap-5';

            const exampleClasses = currentViewMode === 'grid'
                ? 'mt-auto pt-4'
                : 'mb-0';

            return `
            <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex ${layoutClasses}">
                <div class="w-16 h-16 md:w-20 md:h-20 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-4xl md:text-5xl group-hover:rotate-12 transition-transform duration-300 flex-shrink-0 relative">
                    ${wordIcon}
                    <span class="absolute -bottom-2 -right-2 text-xs md:text-sm bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">${masteryIcon}</span>
                </div>

                <div class="flex-1 w-full flex flex-col h-full">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight truncate">${item.word}</h3>
                        <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${typeColor}">${item.type || 'n'}</span>
                    </div>
                    <p class="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 mb-2 tracking-wider">${item.ipa || '/.../'}</p>
                    <p class="text-slate-700 dark:text-slate-200 font-bold text-sm md:text-base mb-3 pr-20 leading-snug line-clamp-2">${item.mean}</p>
                    
                    <div class="bg-slate-50 dark:bg-slate-900/50 p-3 md:p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 relative ${exampleClasses}">
                        <span class="absolute top-1 right-2 md:top-2 md:right-3 text-2xl md:text-3xl font-serif text-slate-200 dark:text-slate-700 leading-none">"</span>
                        <p class="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed font-medium relative z-10 line-clamp-2">${item.example || 'Chưa có ví dụ minh họa.'}</p>
                    </div>
                </div>

                <div class="absolute top-4 right-4 md:top-5 md:right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 transform translate-x-4 group-hover:translate-x-0">
                    <button data-action="speak" data-payload="${safeWord}" class="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-blue-50 hover:bg-blue-500 text-blue-500 hover:text-white dark:bg-blue-900/30 rounded-xl transition-colors shadow-sm">🔊</button>
                    <button onclick="deleteVocab(${originalIndex})" class="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-400 hover:text-white dark:bg-red-900/30 rounded-xl transition-colors shadow-sm">🗑️</button>
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

    function deleteTopic(topic) {
        if (confirm(`Bạn có chắc muốn xóa toàn bộ chủ đề "${topic}"?`)) {
            const newVocab = AppState.getVocab().filter(v => (v.topic || 'Chung') !== topic);
            AppState.setVocab(newVocab);
            showToast(`Đã xóa chủ đề: ${topic}`);
        }
    }

    function deleteVocab(index) {
        if (confirm('Xóa từ này khỏi sổ tay?')) {
            const currentVocab = [...AppState.getVocab()];
            currentVocab.splice(index, 1);
            AppState.setVocab(currentVocab);
        }
    }

    appEventBus.on(EVENTS.VOCAB_UPDATED, () => {
        renderLibrary();
        renderVocabList(true);
    });

    return {
        renderLibrary,
        renderVocabList,
        switchLibView,
        setLibraryViewMode,
        deleteTopic,
        deleteVocab,
        handleSearchInput
    };
})();

window.handleSearchInput = LibraryModule.handleSearchInput;
window.switchLibView = LibraryModule.switchLibView;
window.setLibraryViewMode = LibraryModule.setLibraryViewMode;
window.deleteTopic = LibraryModule.deleteTopic;
window.deleteVocab = LibraryModule.deleteVocab;

export { LibraryModule };
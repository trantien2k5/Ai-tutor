import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { NotebookModule } from './notebook.js';

const LibraryModule = (function() {
    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag));
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
            if (topicFilter && targetTopic) {
                // Gán đúng chuỗi chưa bị mã hóa vào dropdown
                topicFilter.value = targetTopic;
                if (!topicFilter.value) topicFilter.value = 'all'; // Fallback nếu không khớp
            }
            NotebookModule.renderVocabList(true);
        }
    }

    function renderLibrary() {
        const container = document.getElementById('library-topics-view');
        const topicFilterSelect = document.getElementById('library-topic-filter');
        if (!container) return;
        
        const vocabList = AppState.getVocab();
        const topics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];
        
        if (topicFilterSelect) {
            // SỬA LỖI VALUE DROPDOWN: Chỉ escape text hiển thị, không escape thuộc tính value
            topicFilterSelect.innerHTML = '<option value="all">🌐 Tất cả chủ đề</option>' + 
                topics.map(t => `<option value="${t.replace(/"/g, '&quot;')}">${escapeHTML(t)}</option>`).join('');
        }

        if (topics.length === 0) {
            container.innerHTML = `
            <div class="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                <p class="text-5xl mb-4 opacity-50" aria-hidden="true">📭</p>
                <h3 class="text-lg font-black text-slate-700 dark:text-slate-200">Thư viện trống</h3>
                <p class="text-sm font-medium text-slate-400 mt-2">Hãy dùng AI để tạo ngay bộ từ vựng đầu tiên!</p>
                <button data-action="switch-tab" data-payload="ai-gen" class="mt-6 bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors shadow-sm">Tạo từ mới ✨</button>
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

            // Dùng encodeURIComponent để đóng gói payload an toàn tuyệt đối
            const safePayload = encodeURIComponent(topic);

            return `
            <div data-action="start-flashcards" data-payload="${safePayload}" class="group relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px]">
                <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-full blur-2xl -z-10 transition-transform duration-500 group-hover:scale-150 opacity-60 -mr-10 -mt-10"></div>
                
                <div class="flex justify-between items-start mb-4">
                    <div class="w-14 h-14 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-sm" aria-hidden="true">${icon}</div>
                    <div class="flex gap-1 relative z-20">
                        <button data-action="switch-lib-view-topic" data-payload="${safePayload}" aria-label="Xem danh sách" class="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"><span aria-hidden="true">👁️</span></button>
                        <button data-action="add-more-words" data-payload="${safePayload}" aria-label="Thêm từ" class="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"><span aria-hidden="true">➕</span></button>
                        <button data-action="delete-topic" data-payload="${safePayload}" aria-label="Xóa chủ đề" class="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"><span aria-hidden="true">🗑️</span></button>
                    </div>
                </div>
                
                <div>
                    <h3 class="font-black text-slate-800 dark:text-white text-lg tracking-tight truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title="${escapeHTML(name)}">${escapeHTML(name)}</h3>
                    <div class="mt-3 flex items-center justify-between">
                        <span class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-slate-100 dark:border-slate-700/50">${count} từ</span>
                        <span class="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors group-hover:bg-blue-500 group-hover:text-white flex items-center gap-1">Học ngay <span aria-hidden="true">→</span></span>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    function deleteTopic(topic) {
        if (confirm(`Bạn có chắc muốn xóa toàn bộ chủ đề "${topic}"?`)) {
            const newVocab = AppState.getVocab().filter(v => (v.topic || 'Chung') !== topic);
            AppState.setVocab(newVocab);
        }
    }

    appEventBus.on(EVENTS.VOCAB_UPDATED, () => {
        const topicsView = document.getElementById('library-topics-view');
        if (topicsView && !topicsView.classList.contains('hidden')) {
            renderLibrary();
        }
    });

    const actions = {
        'switch-lib-view': (payload) => switchLibView(payload),
        'switch-lib-view-topic': (payload, target, e) => {
            if (e) e.stopPropagation();
            switchLibView('notebook', decodeURIComponent(payload));
        },
        'delete-topic': (payload, target, e) => {
            if (e) e.stopPropagation();
            deleteTopic(decodeURIComponent(payload));
        },
        'add-more-words': (payload, target, e) => {
            if (e) e.stopPropagation();
            if (window.addMoreWordsToTopic) window.addMoreWordsToTopic(decodeURIComponent(payload));
        }
    };

    return { renderLibrary, actions };
})();

export { LibraryModule };
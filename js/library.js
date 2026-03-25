function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { renderVocabList(true); }, 300);
}

function switchLibView(view) {
    const topicsView = document.getElementById('library-topics-view');
    const notebookView = document.getElementById('library-notebook-view');
    const btnTopics = document.getElementById('btn-view-topics');
    const btnNotebook = document.getElementById('btn-view-notebook');
    
    // Class UI xịn xò cho nút Active / Inactive
    const activeClass = "flex-1 py-3 rounded-xl text-[11px] font-black uppercase transition-all bg-white dark:bg-slate-700 text-blue-600 shadow-sm tracking-widest";
    const inactiveClass = "flex-1 py-3 rounded-xl text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase transition-all hover:text-slate-700 dark:hover:text-slate-200 tracking-widest bg-transparent shadow-none";

    if (view === 'topics') {
        topicsView.classList.remove('hidden');
        notebookView.classList.add('hidden');
        btnTopics.className = activeClass;
        btnNotebook.className = inactiveClass;
    } else {
        topicsView.classList.add('hidden');
        notebookView.classList.remove('hidden');
        btnNotebook.className = activeClass;
        btnTopics.className = inactiveClass;
        renderVocabList();
    }
}

function renderLibrary() {
    const container = document.getElementById('library-topics-view');
    if (!container) return;
    
    const topics = [...new Set(vocabList.map(v => v.topic || 'Chung'))];
    
    if (topics.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                <p class="text-5xl mb-4 opacity-50">📭</p>
                <h3 class="text-lg font-black text-slate-700 dark:text-slate-200">Thư viện trống</h3>
                <p class="text-sm font-medium text-slate-400 mt-2">Hãy dùng AI để tạo ngay bộ từ vựng đầu tiên!</p>
                <button onclick="switchTab('ai-gen')" class="mt-6 bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors">Tạo từ mới ✨</button>
            </div>`;
        return;
    }

    container.innerHTML = topics.map((topic, index) => {
        const count = vocabList.filter(v => (v.topic || 'Chung') === topic).length;
        const colors = ['text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-purple-500', 'text-rose-500'];
        const iconColor = colors[index % colors.length];

        return `
            <div class="group relative overflow-hidden bg-white dark:bg-slate-800 p-5 lg:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onclick="startFlashcards('${topic}')">
                <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-bl-[4rem] -z-10 transition-transform duration-500 group-hover:scale-125 opacity-50"></div>
                
                <button onclick="event.stopPropagation(); deleteTopic('${topic}')" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-300 z-10 shadow-sm transform -translate-y-2 group-hover:translate-y-0">
                    🗑️
                </button>

                <div class="flex justify-between items-start mb-5">
                    <div class="w-12 h-12 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-2xl ${iconColor} group-hover:rotate-12 transition-transform duration-300">📁</div>
                </div>
                
                <h3 class="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight mb-2 truncate pr-6" title="${topic}">${topic}</h3>
                
                <div class="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-4">
                    <span class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-100 dark:border-slate-700/50">${count} từ</span>
                    <span class="text-[10px] font-bold text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Ôn tập →</span>
                </div>
            </div>`;
    }).join('');
}

function renderVocabList(resetLimit = true) {
    const container = document.getElementById('vocab-container');
    if (!container) return;
    if (resetLimit) notebookRenderLimit = 50;

    const searchInput = document.getElementById('library-search');
    const filterSelect = document.getElementById('library-filter');
    const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
    const filterType = filterSelect ? filterSelect.value : 'all';
    
    const filteredList = vocabList.filter(item => {
        const matchesSearch = item.word.toLowerCase().includes(searchTerm) || item.mean.toLowerCase().includes(searchTerm) || (item.example && item.example.toLowerCase().includes(searchTerm));
        const matchesFilter = filterType === 'all' || (item.type && item.type.toLowerCase().includes(filterType));
        return matchesSearch && matchesFilter;
    });

    if (filteredList.length === 0) {
        container.innerHTML = `<div class="col-span-full py-20 text-center animate-pulse"><p class="text-5xl mb-4 opacity-50">🔍</p><p class="text-slate-500 dark:text-slate-400 font-bold">Không tìm thấy từ vựng nào.</p></div>`;
    } else {
        const itemsToRender = filteredList.slice(0, notebookRenderLimit);
        let htmlStr = itemsToRender.map((item) => {
            const originalIndex = vocabList.findIndex(v => v.word === item.word && v.mean === item.mean);
            
            // Tự động tô màu nhãn dựa vào loại từ
            let typeColor = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
            if(item.type === 'v') typeColor = 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50';
            else if(item.type === 'adj') typeColor = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50';
            else if(item.type === 'adv') typeColor = 'bg-purple-50 text-purple-500 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50';
            else typeColor = 'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50';

            return `
            <div class="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col">
                
                <div class="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 transform translate-x-4 group-hover:translate-x-0">
                    <button onclick="speak('${item.word.replace(/'/g, "\\'")}')" class="w-9 h-9 flex items-center justify-center bg-blue-50 hover:bg-blue-500 text-blue-500 hover:text-white dark:bg-blue-900/30 rounded-xl transition-colors shadow-sm">🔊</button>
                    <button onclick="deleteVocab(${originalIndex})" class="w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-400 hover:text-white dark:bg-red-900/30 rounded-xl transition-colors shadow-sm">🗑️</button>
                </div>

                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">${item.word}</h3>
                        <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${typeColor}">${item.type || 'n'}</span>
                    </div>
                    <p class="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 mb-3 tracking-wider">${item.ipa || '/.../'}</p>
                    
                    <p class="text-slate-700 dark:text-slate-200 font-bold text-sm md:text-base mb-4 pr-16 leading-snug">${item.mean}</p>
                    
                    <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 relative">
                        <span class="absolute top-2 right-3 text-3xl font-serif text-slate-200 dark:text-slate-700 leading-none">"</span>
                        <p class="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed font-medium relative z-10">${item.example || 'Chưa có ví dụ minh họa.'}</p>
                    </div>
                    
                    ${(item.synonyms && item.synonyms !== 'N/A' && item.synonyms !== 'None') ? 
                        `<div class="mt-4 flex items-center gap-2">
                            <span class="text-[9px] font-black bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100 dark:border-emerald-800/50 px-2 py-1 rounded-md uppercase tracking-widest whitespace-nowrap">Đồng nghĩa</span>
                            <span class="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">${item.synonyms}</span>
                        </div>` : ''
                    }
                </div>
                
                <div class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500 w-0 group-hover:w-full"></div>
            </div>`;
        }).join('');

        if (filteredList.length > notebookRenderLimit) {
            htmlStr += `<div class="col-span-full flex justify-center mt-6 mb-4"><button onclick="loadMoreVocab()" class="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 font-black text-[10px] uppercase px-8 py-4 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all tracking-widest shadow-sm hover:shadow-md">👇 Xem thêm ${filteredList.length - notebookRenderLimit} từ vựng</button></div>`;
        }
        container.innerHTML = htmlStr;
    }
}

function loadMoreVocab() {
    notebookRenderLimit += 50;
    renderVocabList(false);
}

function deleteTopic(topic) {
    if (confirm(`Bạn có chắc muốn xóa toàn bộ chủ đề "${topic}"?`)) {
        vocabList = vocabList.filter(v => (v.topic || 'Chung') !== topic);
        if(typeof saveVocabToStorage === "function") {
             saveVocabToStorage();
        } else {
             localStorage.setItem('my_vocab', JSON.stringify(vocabList));
        }
        renderLibrary();
        updateStats();
        updateQuizTopics();
        if (typeof showToast === "function") showToast(`Đã xóa chủ đề: ${topic}`);
    }
}

function deleteVocab(index) {
    if (confirm('Xóa từ này khỏi sổ tay?')) {
        vocabList.splice(index, 1);
        if(typeof saveVocabToStorage === "function") {
             saveVocabToStorage();
        } else {
             localStorage.setItem('my_vocab', JSON.stringify(vocabList));
        }
        refreshAllUI();
    }
}
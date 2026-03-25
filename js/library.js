function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { renderVocabList(true); }, 300);
}

function switchLibView(view) {
    const topicsView = document.getElementById('library-topics-view');
    const notebookView = document.getElementById('library-notebook-view');
    const btnTopics = document.getElementById('btn-view-topics');
    const btnNotebook = document.getElementById('btn-view-notebook');
    const activeClass = "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all bg-white dark:bg-slate-700 text-blue-600 shadow-sm tracking-widest";
    const inactiveClass = "flex-1 py-3 rounded-xl text-[10px] font-black text-slate-400 uppercase transition-all hover:text-slate-600 dark:hover:text-slate-300 tracking-widest bg-transparent shadow-none";

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
        container.innerHTML = `<div class="col-span-full py-10 text-center opacity-50 font-bold">Chưa có chủ đề nào. Hãy dùng AI để thêm từ!</div>`;
        return;
    }
    container.innerHTML = topics.map(topic => {
        const count = vocabList.filter(v => (v.topic || 'Chung') === topic).length;
        return `
            <div onclick="startFlashcards('${topic}')" class="relative bg-white dark:bg-slate-800 p-6 rounded-[2rem] border-2 border-slate-50 dark:border-slate-700 shadow-sm hover:border-blue-500 transition-all cursor-pointer group">
                <button onclick="event.stopPropagation(); deleteTopic('${topic}')" class="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10">
                    <i class="fas fa-trash-alt text-[10px]"></i>
                </button>
                <div class="text-2xl mb-2">📁</div>
                <h3 class="font-black text-slate-800 dark:text-white text-xs uppercase">${topic}</h3>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${count} từ</p>
            </div>`;
    }).join('');
}

function renderVocabList(resetLimit = true) {
    const container = document.getElementById('vocab-container');
    if (!container) return;
    if (resetLimit) notebookRenderLimit = 50;

    const searchInput = document.getElementById('library-search');
    const filterSelect = document.getElementById('library-filter');
    const homeCount = document.getElementById('home-count');
    if (homeCount) homeCount.innerText = vocabList.length;

    const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
    const filterType = filterSelect ? filterSelect.value : 'all';
    
    const filteredList = vocabList.filter(item => {
        const matchesSearch = item.word.toLowerCase().includes(searchTerm) || item.mean.toLowerCase().includes(searchTerm);
        const matchesFilter = filterType === 'all' || (item.type && item.type.toLowerCase().includes(filterType));
        return matchesSearch && matchesFilter;
    });

    if (filteredList.length === 0) {
        container.innerHTML = `<div class="col-span-full py-20 text-center animate-pulse"><p class="text-4xl mb-4">🔍</p><p class="text-slate-400 font-bold">Không tìm thấy từ vựng nào.</p></div>`;
    } else {
        const itemsToRender = filteredList.slice(0, notebookRenderLimit);
        let htmlStr = itemsToRender.map((item) => {
            const originalIndex = vocabList.findIndex(v => v.word === item.word && v.mean === item.mean);
            return `<div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div class="flex justify-between items-start mb-3">
                    <div><h3 class="text-xl font-black text-slate-800 dark:text-white">${item.word}</h3><span class="text-[10px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">${item.type || 'n'}</span></div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="speak('${item.word}')" class="p-2 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-500 rounded-xl transition-colors">🔊</button>
                        <button onclick="deleteVocab(${originalIndex})" class="p-2 hover:bg-red-50 dark:hover:bg-slate-700 text-red-400 rounded-xl transition-colors">🗑️</button>
                    </div>
                </div>
                <p class="text-slate-600 dark:text-slate-300 font-bold text-sm mb-2">${item.mean}</p>
                <div class="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl"><p class="text-xs italic text-slate-500 dark:text-slate-400 leading-relaxed">"${item.example}"</p></div>
                <div class="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 w-0 group-hover:w-full"></div>
            </div>`;
        }).join('');

        if (filteredList.length > notebookRenderLimit) {
            htmlStr += `<div class="col-span-full flex justify-center mt-4 mb-4"><button onclick="loadMoreVocab()" class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase px-6 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all tracking-widest shadow-sm">👇 Xem thêm ${filteredList.length - notebookRenderLimit} từ</button></div>`;
        }
        container.innerHTML = htmlStr;
    }
    updateStats();
    updateQuizTopics();
}

function loadMoreVocab() {
    notebookRenderLimit += 50;
    renderVocabList(false);
}

function deleteTopic(topic) {
    if (confirm(`Bạn có chắc muốn xóa toàn bộ chủ đề "${topic}"?`)) {
        vocabList = vocabList.filter(v => (v.topic || 'Chung') !== topic);
        localStorage.setItem('my_vocab', JSON.stringify(vocabList));
        renderLibrary();
        updateStats();
        updateQuizTopics();
        if (typeof showToast === "function") showToast(`Đã xóa chủ đề: ${topic}`);
    }
}

function deleteVocab(index) {
    if (confirm('Xóa từ này khỏi thư viện?')) {
        vocabList.splice(index, 1);
        localStorage.setItem('my_vocab', JSON.stringify(vocabList));
        refreshAllUI();
    }
}
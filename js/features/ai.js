import { AppState } from '../core/state.js';
import { showToast } from '../shared/ui-helpers.js';
import { AudioAPI } from '../shared/audio.js';

const AIModule = (function() {
    let suggestedWords = [];

    function generatePromptTemplate(topic) {
        return `Tạo 10 từ vựng tiếng Anh thiết thực thuộc chủ đề "${topic}". 
Trả về CHỈ MỘT mảng JSON theo đúng định dạng sau, không kèm theo bất kỳ văn bản giải thích hay markdown code block nào khác:
[
  {
    "word": "từ tiếng anh",
    "wordIcon": "1 emoji phù hợp",
    "ipa": "/phiên âm/",
    "mean": "nghĩa tiếng việt",
    "example": "Một câu ví dụ ngắn gọn"
  }
]`;
    }

    function handleGenerateClick() {
        const inputEl = document.getElementById('ai-topic-input');
        const topic = inputEl ? inputEl.value.trim() : '';

        if (!topic) {
            showToast('⚠️ Vui lòng nhập chủ đề bạn muốn học!', 'error');
            return;
        }

        const prompt = generatePromptTemplate(topic);
        navigator.clipboard.writeText(prompt).then(() => {
            showToast('📋 Đã copy lệnh! Hãy dán vào ChatGPT và lấy kết quả.');
            injectPasteArea();
        }).catch(() => showToast('❌ Lỗi copy, vui lòng thử lại!', 'error'));
    }

    function injectPasteArea() {
        let pasteArea = document.getElementById('ai-paste-area');
        if (pasteArea) return;

        const container = document.querySelector('#tab-ai-gen header .max-w-xl');
        if (!container) return;

        pasteArea = document.createElement('div');
        pasteArea.id = 'ai-paste-area';
        pasteArea.className = 'mt-5 flex gap-3 animate-in fade-in slide-in-from-top-2';
        pasteArea.innerHTML = `
            <textarea id="ai-json-input" placeholder="Dán đoạn mã JSON kết quả từ AI vào đây..." class="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 text-sm font-mono h-12 resize-none outline-none"></textarea>
            <button id="process-json-btn" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 whitespace-nowrap shadow-md">
                Xử lý
            </button>
        `;
        container.appendChild(pasteArea);
    }

    function processPastedJSON() {
        const jsonInput = document.getElementById('ai-json-input');
        if (!jsonInput || !jsonInput.value.trim()) return;

        try {
            const rawData = jsonInput.value.trim().replace(/^```(json)?|```$/gi, '');
            const match = rawData.match(/\[[\s\S]*\]/);
            const parsed = JSON.parse(match ? match[0] : rawData);

            suggestedWords = Array.isArray(parsed) ? parsed : [];

            if (suggestedWords.length === 0) {
                showToast('❌ JSON không chứa mảng từ vựng hợp lệ.', 'error');
                return;
            }

            renderSuggestions();
            showToast('✨ Đã tải danh sách từ vựng gợi ý!');
            jsonInput.value = '';
        } catch (e) {
            showToast('❌ Định dạng JSON bị lỗi! Hãy kiểm tra lại.', 'error');
            console.error(e);
        }
    }

    function createSuggestionCardHTML(item, index) {
        const safeWord = item.word.replace(/"/g, '&quot;');
        return `
        <article class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4 transition-all hover:shadow-md" id="ai-card-${index}">
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl rounded-xl" aria-hidden="true">
                    ${item.wordIcon || '📝'}
                </div>
                <div class="flex-1">
                    <h4 class="text-xl font-black text-slate-800 dark:text-white">${safeWord}</h4>
                    <p class="text-slate-400 dark:text-slate-500 font-mono text-sm">${item.ipa || '/.../'}</p>
                </div>
            </div>

            <div class="space-y-2">
                <p class="text-slate-700 dark:text-slate-300 font-bold">${item.mean}</p>
                <p class="text-slate-600 dark:text-slate-400 text-sm italic">"${item.example || ''}"</p>
            </div>

            <div class="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <button data-action="speak-ai-word" data-payload="${safeWord}" aria-label="Nghe" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 active:scale-95">
                    <span aria-hidden="true">🔊</span> Nghe
                </button>
                <button data-action="add-ai-word" data-payload="${index}" aria-label="Thêm" class="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-sm font-bold flex items-center justify-center gap-2 active:scale-95">
                    <span aria-hidden="true">➕</span> Thêm
                </button>
                <button data-action="remove-ai-word" data-payload="${index}" aria-label="Xóa" class="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg text-sm active:scale-95">
                    <span aria-hidden="true">🗑️</span>
                </button>
            </div>
        </article>`;
    }

    function renderSuggestions() {
        const container = document.getElementById('ai-suggestions-container');
        if (!container) return;

        if (suggestedWords.length === 0) {
            container.innerHTML = `<p class="col-span-full text-center text-slate-400 font-medium py-10">Kết quả gợi ý sẽ hiển thị ở đây.</p>`;
            return;
        }

        container.innerHTML = suggestedWords.map((item, index) => createSuggestionCardHTML(item, index)).join('');
    }

    function handleAddWord(index) {
        const wordData = suggestedWords[index];
        if (!wordData) return;

        const currentVocab = AppState.getVocab();
        const isExist = currentVocab.some(v => v.word.toLowerCase() === wordData.word.toLowerCase());

        if (isExist) {
            showToast('⚠️ Từ này đã tồn tại trong thư viện!', 'error');
            return;
        }

        const inputEl = document.getElementById('ai-topic-input');
        const topicName = inputEl && inputEl.value.trim() ? inputEl.value.trim() : 'Từ vựng mới';

        const newVocabItem = {
            id: 'vocab_' + Date.now() + Math.floor(Math.random() * 1000),
            word: wordData.word,
            wordIcon: wordData.wordIcon || '📝',
            ipa: wordData.ipa || '/.../',
            type: wordData.type || 'n',
            mean: wordData.mean,
            example: wordData.example || '',
            topic: '✨ ' + topicName,
            createdAt: new Date().toISOString(),
            masteryLevel: 0
        };

        AppState.setVocab([newVocabItem, ...currentVocab]);
        showToast(`✅ Đã thêm "${wordData.word}" vào thư viện!`);
        handleRemoveWord(index);
    }

    function handleRemoveWord(index) {
        const card = document.getElementById(`ai-card-${index}`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => card.remove(), 250);
        }
    }

    // Đăng ký Event Delegation toàn cục để xử lý linh hoạt cho HTML load động
    document.addEventListener('click', (e) => {
        if (e.target.closest('#generate-ai-words-btn')) {
            handleGenerateClick();
            return;
        }

        if (e.target.closest('#process-json-btn')) {
            processPastedJSON();
            return;
        }

        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
            const action = actionBtn.getAttribute('data-action');
            const payload = actionBtn.getAttribute('data-payload');

            if (action === 'speak-ai-word') {
                e.preventDefault();
                AudioAPI.speak(payload);
            } else if (action === 'add-ai-word') {
                e.preventDefault();
                handleAddWord(parseInt(payload, 10));
            } else if (action === 'remove-ai-word') {
                e.preventDefault();
                handleRemoveWord(parseInt(payload, 10));
            }
        }
    });

    return {};
})();

export { AIModule };
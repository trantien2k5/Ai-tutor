import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';

const AIModule = (function() {

    function copyDynamicPrompt() {
        const topicEl = document.getElementById('user-topic');
        const levelEl = document.getElementById('user-level');
        const countEl = document.getElementById('user-count');

        const topic = topicEl ? topicEl.value.trim() : '';
        const level = levelEl ? levelEl.value : 'B1-B2';
        const count = countEl ? countEl.value : '10';

        if (!topic) {
            showToast('⚠️ Vui lòng nhập chủ đề bạn muốn học!', 'error');
            if (topicEl) topicEl.focus();
            return;
        }

        const prompt = `Tạo ${count} từ vựng tiếng Anh thiết thực thuộc chủ đề "${topic}" dành cho trình độ ${level}. 
Trả về CHỈ MỘT mảng JSON theo đúng định dạng sau, không kèm theo bất kỳ văn bản giải thích hay markdown code block nào khác:
[
  {
    "word": "từ tiếng anh",
    "wordIcon": "1 emoji phù hợp",
    "ipa": "/phiên âm/",
    "type": "n/v/adj/adv",
    "mean": "nghĩa tiếng việt",
    "example": "Một câu ví dụ ngắn gọn",
    "synonyms": "1-2 từ đồng nghĩa (nếu có)",
    "antonyms": "1-2 từ trái nghĩa (nếu có)",
    "note": "Ghi chú ngữ pháp nhỏ (nếu có)"
  }
]`;

        navigator.clipboard.writeText(prompt).then(() => {
            showToast('📋 Đã copy lệnh! Hãy dán vào ChatGPT và lấy kết quả.');
            const aiInput = document.getElementById('ai-input');
            if (aiInput) aiInput.focus();
        }).catch(() => {
            showToast('❌ Lỗi copy, vui lòng thử lại!', 'error');
        });
    }

    function processVocab() {
        const jsonInput = document.getElementById('ai-input');
        if (!jsonInput || !jsonInput.value.trim()) {
            showToast('⚠️ Vui lòng dán kết quả JSON từ AI vào ô trống!', 'error');
            return;
        }

        try {
            const rawData = jsonInput.value.trim().replace(/^```(json)?|```$/gi, '');
            const match = rawData.match(/\[[\s\S]*\]/);
            const parsedData = JSON.parse(match ? match[0] : rawData);

            if (!Array.isArray(parsedData) || parsedData.length === 0) {
                showToast('❌ Dữ liệu không hợp lệ. Phải là một mảng JSON.', 'error');
                return;
            }

            const currentVocab = AppState.getVocab() || [];
            const topicEl = document.getElementById('user-topic');
            const topicName = topicEl && topicEl.value.trim() ? topicEl.value.trim() : 'Từ vựng AI';

            let addedCount = 0;
            let duplicateCount = 0;
            const newItems = [];

            parsedData.forEach(item => {
                const isExist = currentVocab.some(v => 
    v.word.toLowerCase() === (item.word || '').toLowerCase() && 
    (v.topic || 'Chung') === topicName
);
                if (!isExist && item.word && item.mean) {
                    newItems.push({
                        id: 'vocab_' + Date.now() + Math.floor(Math.random() * 1000) + addedCount,
                        word: item.word,
                        wordIcon: item.wordIcon || '📝',
                        ipa: item.ipa || '/.../',
                        type: item.type || 'n',
                        mean: item.mean,
                        example: item.example || '',
                        synonyms: item.synonyms || '',
                        antonyms: item.antonyms || '',
                        note: item.note || '',
                        topic: topicName,
                        createdAt: new Date().toISOString(),
                        masteryLevel: 0
                    });
                    addedCount++;
                } else {
                    duplicateCount++;
                }
            });

            if (addedCount > 0) {
                AppState.setVocab([...newItems, ...currentVocab]);
                
                let msg = `✨ Đã thêm ${addedCount} từ vựng vào chủ đề "${topicName}"!`;
                if (duplicateCount > 0) msg += ` (Bỏ qua ${duplicateCount} từ trùng)`;
                
                showToast(msg, 'success');
                jsonInput.value = ''; 
                
                document.querySelector('[data-action="switch-tab"][data-payload="library"]')?.click();
            } else if (duplicateCount > 0) {
                showToast(`⚠️ Tất cả ${duplicateCount} từ AI cho đều đã có trong thư viện!`, 'error');
            } else {
                showToast('❌ Không tìm thấy từ vựng hợp lệ nào để thêm.', 'error');
            }

        } catch (error) {
            console.error(error);
            showToast('❌ Định dạng JSON bị lỗi! AI trả về sai cấu trúc.', 'error');
        }
    }

    const actions = {
        'copy-prompt': () => copyDynamicPrompt(),
        'process-ai-vocab': () => processVocab()
    };

    return { actions };
})();

export { AIModule };
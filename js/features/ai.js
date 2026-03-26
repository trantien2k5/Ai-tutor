// js/features/ai.js
import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';

const AIModule = (function() {
    function copyDynamicPrompt() {
        const topic = document.getElementById('user-topic').value.trim() || 'General vocabulary';
        const level = document.getElementById('user-level').value;
        const count = document.getElementById('user-count').value;

        const prompt = `Act as an expert English teacher. Generate exactly ${count} English vocabulary words for the topic "${topic}" at ${level} level. 
CRITICAL RULES:
1. Mix word types.
2. "type" MUST be an abbreviation (n, v, adj, adv).
3. "mean" and "note" MUST be in Vietnamese.
4. Output ONLY a valid raw JSON array. NO markdown, NO code blocks, NO conversational text.

Format EXACTLY like this:
[
  {
    "word": "English word",
    "ipa": "/IPA pronunciation/",
    "type": "n/v/adj/adv",
    "mean": "Nghĩa tiếng Việt (ngắn gọn)",
    "synonyms": "1-2 English synonyms",
    "antonyms": "1-2 English antonyms (or 'None')",
    "example": "A simple English example sentence",
    "note": "Một câu tiếng Việt ngắn giúp dễ nhớ từ này"
  }
]`;

        navigator.clipboard.writeText(prompt).then(() => {
            showToast('📋 Đã copy mã Prompt! Hãy dán vào ChatGPT.');
        }).catch(() => {
            showToast('❌ Lỗi copy. Vui lòng thử lại!', 'error');
        });
    }

    function processVocab() {
        const inputArea = document.getElementById('ai-input');
        const topicInput = document.getElementById('user-topic');
        const levelInput = document.getElementById('user-level');

        if (!inputArea || !inputArea.value.trim()) {
            showToast('⚠️ Vui lòng dán kết quả từ AI vào ô!', 'error');
            return;
        }

        try {
            let rawData = inputArea.value.trim();
            const startIndex = rawData.indexOf('[');
            const endIndex = rawData.lastIndexOf(']');
            if (startIndex !== -1 && endIndex !== -1) {
                rawData = rawData.substring(startIndex, endIndex + 1);
            }

            const newData = JSON.parse(rawData);
            const currentTopic = topicInput.value.trim() || 'Chung';
            const currentLevel = levelInput ? levelInput.value : 'B1-B2';
            const currentVocab = AppState.getVocab();

            if (Array.isArray(newData)) {
                let addedCount = 0;
                let duplicateCount = 0;

                const enrichedData = newData.map(item => {
                    const isExist = currentVocab.some(v => v.word.toLowerCase() === item.word.toLowerCase());
                    if (isExist) {
                        duplicateCount++;
                        return null; 
                    }
                    addedCount++;
                    return {
                        id: 'vocab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        word: item.word || 'Unknown',
                        ipa: item.ipa || '/.../',
                        type: item.type || 'n',
                        mean: item.mean || 'Chưa có nghĩa',
                        synonyms: item.synonyms || 'N/A',
                        antonyms: item.antonyms || 'N/A',
                        example: item.example || '',
                        note: item.note || '',
                        topic: currentTopic,
                        level: currentLevel,          
                        createdAt: new Date().toISOString(), 
                        masteryLevel: 0,              
                        lastReviewed: null            
                    };
                }).filter(item => item !== null); 

                if (enrichedData.length === 0) {
                    showToast('⚠️ Các từ vựng này đã có sẵn trong thư viện!', 'error');
                    return;
                }

                AppState.setVocab([...enrichedData, ...currentVocab]);
                inputArea.value = '';
                
                const msg = duplicateCount > 0 
                    ? `🎉 Nạp ${addedCount} từ mới (Bỏ qua ${duplicateCount} từ trùng)`
                    : `🎉 Nạp thành công ${addedCount} từ vựng mới!`;
                showToast(msg);
                
                appEventBus.emit(EVENTS.TAB_CHANGED, 'library');
            } else {
                 showToast('❌ Kết quả không đúng định dạng danh sách (Array).', 'error'); 
            }
        } catch (e) { 
            showToast('❌ Lỗi: Mã JSON không hợp lệ! Hãy kiểm tra lại kết quả của AI.', 'error'); 
        }
    }

    return { copyDynamicPrompt, processVocab };
})();

window.copyDynamicPrompt = AIModule.copyDynamicPrompt;
window.processVocab = AIModule.processVocab;

export { AIModule };
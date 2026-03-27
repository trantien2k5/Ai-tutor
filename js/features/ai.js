// js/features/ai.js
import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';

const AIModule = (function() {
    
    // 1. NÂNG CẤP PROMPT: Yêu cầu AI sinh thêm Icon và Tên chuyên nghiệp
    function copyDynamicPrompt() {
        const topic = document.getElementById('user-topic').value.trim() || 'General vocabulary';
        const level = document.getElementById('user-level').value;
        const count = document.getElementById('user-count').value;

        const prompt = `Act as an expert English teacher. I want to learn about "${topic}" at ${level} level. Generate exactly ${count} vocabulary words.

CRITICAL RULES:
1. Refine the topic name to be professional, concise, and in Vietnamese (e.g., if I input "code", refine it to "Lập trình & Công nghệ").
2. Provide a single, fitting emoji as the "topicIcon".
3. Mix word types (n, v, adj, adv).
4. "mean" and "note" MUST be in Vietnamese.
5. Output ONLY a valid raw JSON object. NO markdown, NO code blocks.

Format EXACTLY like this:
{
  "refinedTopic": "Tên chủ đề tiếng Việt chuyên nghiệp",
  "topicIcon": "🚀",
  "words": [
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
  ]
}`;

        navigator.clipboard.writeText(prompt).then(() => {
            showToast('📋 Đã copy mã Prompt! Hãy dán vào ChatGPT.');
        }).catch(() => {
            showToast('❌ Lỗi copy. Vui lòng thử lại!', 'error');
        });
    }

    // 2. NÂNG CẤP XỬ LÝ DỮ LIỆU: Đọc định dạng mới và ghép Icon
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
            
            // Xóa markdown code block nếu người dùng lỡ copy dư (VD: ```json ... ```)
            rawData = rawData.replace(/^```(json)?|```$/gi, '').trim();

            // Tìm và bóc tách khối JSON hợp lệ (Object hoặc Array)
            let parsedData;
            const match = rawData.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                parsedData = JSON.parse(match[0]);
            } else {
                parsedData = JSON.parse(rawData);
            }

            const currentLevel = levelInput ? levelInput.value : 'B1-B2';
            const currentVocab = AppState.getVocab();
            
            let vocabList = [];
            let finalTopic = topicInput.value.trim() || 'Chung';

            // Xử lý linh hoạt cả chuẩn cũ (Array) và chuẩn mới (Object)
            if (Array.isArray(parsedData)) {
                vocabList = parsedData; 
            } else if (parsedData && Array.isArray(parsedData.words)) {
                vocabList = parsedData.words; 
                
                // Ghép Emoji và Tên chủ đề AI trả về
                const icon = parsedData.topicIcon || '📁';
                const refined = parsedData.refinedTopic || finalTopic;
                finalTopic = `${icon} ${refined}`.trim();
            } else {
                showToast('❌ Kết quả không đúng định dạng (Array/Object).', 'error');
                return;
            }

            if (vocabList.length > 0) {
                let addedCount = 0;
                let duplicateCount = 0;

                const enrichedData = vocabList.map(item => {
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
                        topic: finalTopic, // Gán chủ đề cực xịn xò vào đây
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
                    : `🎉 Đã tạo chủ đề: ${finalTopic}`;
                showToast(msg);
                
                appEventBus.emit(EVENTS.TAB_CHANGED, 'library');
            } else {
                 showToast('❌ AI không trả về từ vựng nào.', 'error'); 
            }
        } catch (e) { 
            showToast('❌ Lỗi: Mã JSON không hợp lệ! Hãy kiểm tra lại kết quả của AI.', 'error'); 
            console.error(e);
        }
    }

    return { copyDynamicPrompt, processVocab };
})();

window.copyDynamicPrompt = AIModule.copyDynamicPrompt;
window.processVocab = AIModule.processVocab;

export { AIModule };
                          

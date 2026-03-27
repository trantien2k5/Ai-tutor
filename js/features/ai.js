import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';

const AIModule = (function() {
    function copyDynamicPrompt() {
        const settings = AppState.getSettings();
        const topicInput = document.getElementById('user-topic');
        const levelInput = document.getElementById('user-level');
        const countInput = document.getElementById('user-count');

        const topic = (topicInput && topicInput.value.trim()) ? topicInput.value.trim() : 'General vocabulary';
        const level = (levelInput && levelInput.value) ? levelInput.value : (settings.aiLevel || 'B1-B2');
        const count = (countInput && countInput.value) ? countInput.value : (settings.aiCount || '10');

        const vocabList = AppState.getVocab();
        const cleanTopicName = topic.replace(/^[\p{Emoji}\p{Extended_Pictographic}]\s*/u, '').toLowerCase().trim();
        
        const existingWords = vocabList
            .filter(v => (v.topic || '').toLowerCase().includes(cleanTopicName))
            .map(v => v.word)
            .join(', ');

        let progressiveInstruction = "Prioritize high-frequency, essential, and practical English words that are most commonly used in real-life situations related to this topic.";
        
        if (existingWords.length > 0) {
            progressiveInstruction = `CRITICAL: The user ALREADY KNOWS the following words. DO NOT generate them again:\n[${existingWords}]\n\nExpand the vocabulary scope to other important, high-frequency, and practical words related to the topic that are NOT in the list above.`;
        }

        const prompt = `Act as an expert English teacher and curriculum designer. 
I want to learn about "${topic}" at ${level} level. Generate exactly ${count} vocabulary words.

${progressiveInstruction}

RULES:
1. Refine the topic name to be professional, concise, and in Vietnamese.
2. Provide a single, fitting emoji as the "topicIcon".
3. For EACH word, provide a unique, descriptive emoji as the "wordIcon".
4. Mix word types (n, v, adj, adv).
5. "mean" and "note" MUST be in Vietnamese.
6. Output ONLY a valid raw JSON object. NO markdown, NO code blocks.

Format EXACTLY like this:
{
  "refinedTopic": "Tên chủ đề tiếng Việt chuyên nghiệp",
  "topicIcon": "🦁",
  "words": [
    {
      "wordIcon": "🐯",
      "word": "tiger",
      "ipa": "/ˈtaɪ.ɡɚ/",
      "type": "n",
      "mean": "con hổ",
      "synonyms": "big cat",
      "antonyms": "prey",
      "example": "The tiger is a powerful hunter.",
      "note": "Hổ là loài mèo lớn nhất."
    }
  ]
}`;

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
        const settings = AppState.getSettings();

        if (!inputArea || !inputArea.value.trim()) {
            showToast('⚠️ Vui lòng dán kết quả từ AI vào ô!', 'error');
            return;
        }

        try {
            let rawData = inputArea.value.trim();
            rawData = rawData.replace(/^```(json)?|```$/gi, '').trim();

            let parsedData;
            const match = rawData.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                parsedData = JSON.parse(match[0]);
            } else {
                parsedData = JSON.parse(rawData);
            }

            const currentLevel = (levelInput && levelInput.value) ? levelInput.value : (settings.aiLevel || 'B1-B2');
            const currentVocab = AppState.getVocab();
            
            let vocabList = [];
            let finalTopic = (topicInput && topicInput.value.trim()) ? topicInput.value.trim() : 'Chung';

            if (parsedData && Array.isArray(parsedData.words)) {
                vocabList = parsedData.words; 
                const icon = parsedData.topicIcon || '📁';
                const refined = parsedData.refinedTopic || finalTopic;
                finalTopic = `${icon} ${refined}`.trim();
            } else if (Array.isArray(parsedData)) {
                vocabList = parsedData; 
                finalTopic = `📁 ${finalTopic}`.trim();
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
                        wordIcon: item.wordIcon || '📝',
                        ipa: item.ipa || '/.../',
                        type: item.type || 'n',
                        mean: item.mean || 'Chưa có nghĩa',
                        synonyms: item.synonyms || 'N/A',
                        antonyms: item.antonyms || 'N/A',
                        example: item.example || '',
                        note: item.note || '',
                        topic: finalTopic,
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
                    ? `🎉 Đã tạo chủ đề: ${finalTopic} (Bỏ qua ${duplicateCount} từ trùng)`
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
import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';

const AIModule = (function() {
    const CONSTANTS = {
        DEFAULT_TOPIC: 'General vocabulary',
        DEFAULT_TOPIC_VI: 'Chung',
        DEFAULT_LEVEL: 'B1-B2',
        DEFAULT_COUNT: '10',
        DEFAULT_ICON_TOPIC: '📁',
        DEFAULT_ICON_WORD: '📝',
        DEFAULT_TYPE: 'n'
    };

    const getEl = (id) => document.getElementById(id);
    const getVal = (id, defaultVal = '') => {
        const el = getEl(id);
        return (el && el.value.trim()) ? el.value.trim() : defaultVal;
    };

    function generatePromptString(topic, level, count, existingWords) {
        let progressiveInstruction = "Prioritize high-frequency, essential, and practical English words that are most commonly used in real-life situations related to this topic.";
        
        if (existingWords.length > 0) {
            progressiveInstruction = `CRITICAL: The user ALREADY KNOWS the following words. DO NOT generate them again:\n[${existingWords}]\n\nExpand the vocabulary scope to other important, high-frequency, and practical words related to the topic that are NOT in the list above.`;
        }

        return `Act as an expert English teacher and curriculum designer. 
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
    }

    function extractExistingWords(topicQuery) {
        const vocabList = AppState.getVocab();
        const cleanTopicName = topicQuery.replace(/^[\p{Emoji}\p{Extended_Pictographic}]\s*/u, '').toLowerCase().trim();
        return vocabList
            .filter(v => (v.topic || '').toLowerCase().includes(cleanTopicName))
            .map(v => v.word)
            .join(', ');
    }

    function parseRawAIResponse(rawData) {
        const cleanData = rawData.replace(/^```(json)?|```$/gi, '').trim();
        const match = cleanData.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return JSON.parse(match ? match[0] : cleanData);
    }

    function createNewVocabItem(item, finalTopic, currentLevel) {
        return {
            id: 'vocab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            word: item.word || 'Unknown',
            wordIcon: item.wordIcon || CONSTANTS.DEFAULT_ICON_WORD,
            ipa: item.ipa || '/.../',
            type: item.type || CONSTANTS.DEFAULT_TYPE,
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
    }

    function copyDynamicPrompt() {
        const settings = AppState.getSettings();
        const topic = getVal('user-topic', CONSTANTS.DEFAULT_TOPIC);
        const level = getVal('user-level', settings.aiLevel || CONSTANTS.DEFAULT_LEVEL);
        const count = getVal('user-count', settings.aiCount || CONSTANTS.DEFAULT_COUNT);

        const existingWords = extractExistingWords(topic);
        const prompt = generatePromptString(topic, level, count, existingWords);

        navigator.clipboard.writeText(prompt)
            .then(() => showToast('📋 Đã copy mã Prompt! Hãy dán vào ChatGPT.'))
            .catch(() => showToast('❌ Lỗi copy. Vui lòng thử lại!', 'error'));
    }

    function processVocab() {
        const inputArea = getEl('ai-input');
        const rawValue = inputArea ? inputArea.value.trim() : '';
        
        if (!rawValue) {
            return showToast('⚠️ Vui lòng dán kết quả từ AI vào ô!', 'error');
        }

        try {
            const parsedData = parseRawAIResponse(rawValue);
            const settings = AppState.getSettings();
            const currentLevel = getVal('user-level', settings.aiLevel || CONSTANTS.DEFAULT_LEVEL);
            const inputTopic = getVal('user-topic', CONSTANTS.DEFAULT_TOPIC_VI);
            const currentVocab = AppState.getVocab();
            
            let vocabList = [];
            let finalTopic = inputTopic;

            if (parsedData && Array.isArray(parsedData.words)) {
                vocabList = parsedData.words; 
                const icon = parsedData.topicIcon || CONSTANTS.DEFAULT_ICON_TOPIC;
                const refined = parsedData.refinedTopic || finalTopic;
                finalTopic = `${icon} ${refined}`.trim();
            } else if (Array.isArray(parsedData)) {
                vocabList = parsedData; 
                finalTopic = `${CONSTANTS.DEFAULT_ICON_TOPIC} ${finalTopic}`.trim();
            } else {
                return showToast('❌ Kết quả không đúng định dạng (Array/Object).', 'error');
            }

            if (vocabList.length === 0) {
                return showToast('❌ AI không trả về từ vựng nào.', 'error'); 
            }

            let addedCount = 0;
            let duplicateCount = 0;

            const enrichedData = vocabList.map(item => {
                const isExist = currentVocab.some(v => v.word.toLowerCase() === item.word.toLowerCase());
                if (isExist) {
                    duplicateCount++;
                    return null; 
                }
                addedCount++;
                return createNewVocabItem(item, finalTopic, currentLevel);
            }).filter(Boolean); 

            if (enrichedData.length === 0) {
                return showToast('⚠️ Các từ vựng này đã có sẵn trong thư viện!', 'error');
            }

            AppState.setVocab([...enrichedData, ...currentVocab]);
            inputArea.value = '';
            
            const msg = duplicateCount > 0 
                ? `🎉 Đã tạo chủ đề: ${finalTopic} (Bỏ qua ${duplicateCount} từ trùng)`
                : `🎉 Đã tạo chủ đề: ${finalTopic}`;
            showToast(msg);
            
            appEventBus.emit(EVENTS.TAB_CHANGED, 'library');

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
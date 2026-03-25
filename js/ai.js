function generatePrompt() {
    const topic = document.getElementById('user-topic').value || 'General';
    const level = document.getElementById('user-level').value;
    const count = document.getElementById('user-count').value;

    const prompt = `Act as an expert English teacher. Generate exactly ${count} English vocabulary words for the topic "${topic}" at ${level} level. 
CRITICAL RULES:
1. Mix word types.
2. "type" MUST be an abbreviation (n, v, adj, adv).
3. "mean" and "note" MUST be in Vietnamese.
4. Output ONLY a valid raw JSON array. NO markdown, NO code blocks (do NOT use \`\`\`json), NO conversational text.

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

    const promptCode = document.getElementById('generated-prompt');
    if (promptCode) {
        promptCode.innerText = prompt;
        document.getElementById('prompt-output-area').classList.remove('hidden');
    }
}

function copyPrompt() {
    navigator.clipboard.writeText(document.getElementById('generated-prompt').innerText);
    showToast('📋 Đã copy prompt nâng cao!');
}

function processVocab() {
    const inputArea = document.getElementById('ai-input');
    const topicInput = document.getElementById('user-topic');
    if (!inputArea || !inputArea.value) return;
    try {
        let rawData = inputArea.value.trim();
        if (rawData.startsWith('```')) rawData = rawData.replace(/```json|```/g, '').trim();
        const newData = JSON.parse(rawData);
        const currentTopic = topicInput.value.trim() || 'General';
        if (Array.isArray(newData)) {
            const dataWithTopic = newData.map(item => ({ ...item, topic: currentTopic }));
            vocabList = [...dataWithTopic, ...vocabList];
            localStorage.setItem('my_vocab', JSON.stringify(vocabList));
            inputArea.value = '';
            refreshAllUI();
            showToast(`🎉 Đã nạp ${newData.length} từ vựng mới!`);
            switchTab('library');
        }
    } catch (e) { 
        showToast('❌ Lỗi: JSON không hợp lệ!', 'error'); 
    }
}
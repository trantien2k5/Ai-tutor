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
    const levelInput = document.getElementById('user-level'); // Bắt thêm thông tin Level

    if (!inputArea || !inputArea.value) return;
    try {
        let rawData = inputArea.value.trim();
        // Xử lý rác markdown từ LLMs
        if (rawData.startsWith('```')) rawData = rawData.replace(/```json|```/g, '').trim();
        const newData = JSON.parse(rawData);

        const currentTopic = topicInput.value.trim() || 'General';
        const currentLevel = levelInput ? levelInput.value : 'B1-B2';

        if (Array.isArray(newData)) {
            let addedCount = 0;
            let duplicateCount = 0;

            // Đúc kết và chuẩn hóa từng từ vựng
            const enrichedData = newData.map(item => {
                // Check trùng lặp: Tìm xem từ này đã có trong máy chưa (không phân biệt hoa thường)
                const isExist = vocabList.some(v => v.word.toLowerCase() === item.word.toLowerCase());
                if (isExist) {
                    duplicateCount++;
                    return null; // Trùng thì bỏ qua
                }

                addedCount++;
                return {
                    id: 'vocab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), // Tạo ID duy nhất
                    word: item.word || 'Unknown',
                    ipa: item.ipa || '/.../',
                    type: item.type || 'n',
                    mean: item.mean || 'Chưa có nghĩa',
                    synonyms: item.synonyms || 'N/A',
                    antonyms: item.antonyms || 'N/A',
                    example: item.example || '',
                    note: item.note || '',
                    topic: currentTopic,
                    level: currentLevel,          // Lưu lại độ khó
                    createdAt: new Date().toISOString(), // Phục vụ sort/filter theo thời gian sau này
                    masteryLevel: 0,              // Khởi tạo điểm thông thạo = 0 cho SRS
                    lastReviewed: null            // Thời điểm ôn tập cuối cùng
                };
            }).filter(item => item !== null); // Xóa các object bị null do trùng lặp

            if (enrichedData.length === 0) {
                showToast('⚠️ Các từ vựng này đã có sẵn trong thư viện!', 'error');
                return;
            }

            // Gộp data mới lên đầu danh sách
            vocabList = [...enrichedData, ...vocabList];
            localStorage.setItem('my_vocab', JSON.stringify(vocabList));
            inputArea.value = '';
            
            refreshAllUI();
            
            // Báo cáo chi tiết số lượng từ thêm thành công và trùng lặp
            const msg = duplicateCount > 0 
                ? `🎉 Nạp ${addedCount} từ mới (Bỏ qua ${duplicateCount} từ trùng)`
                : `🎉 Nạp thành công ${addedCount} từ vựng mới!`;
            showToast(msg);
            
            switchTab('library');
        }
    } catch (e) { 
        showToast('❌ Lỗi: Dữ liệu JSON không hợp lệ!', 'error'); 
    }
}
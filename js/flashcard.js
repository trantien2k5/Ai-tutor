/* =========================================
   FLASHCARD MODULE & SRS INTEGRATION
   ========================================= */

function startFlashcards(topic) {
    let words = vocabList.filter(v => (v.topic || 'Chung') === topic);
    if (words.length === 0) return showToast("📂 Chủ đề này chưa có từ!", 'error');

    // NÂNG CẤP SRS: Sắp xếp các từ cần ôn tập khẩn cấp lên đầu!
    if (typeof calculateSRSPriority === "function") {
        words.sort((a, b) => calculateSRSPriority(b) - calculateSRSPriority(a));
    } else {
        words.sort(() => 0.5 - Math.random());
    }

    currentSessionWords = words;
    currentCardIndex = 0;
    
    const flashView = document.getElementById('flashcard-view');
    if (flashView) {
        document.body.style.overflow = 'hidden'; 
        flashView.classList.remove('hidden');
    }

    showCard();
}

function closeFlashcards() {
    const flashView = document.getElementById('flashcard-view');
    if (flashView) {
        flashView.classList.add('hidden');
        document.body.style.overflow = ''; 
    }
    if (typeof checkAndUpdateStreak === "function") checkAndUpdateStreak();
}

function showCard() {
    const card = currentSessionWords[currentCardIndex];
    if (!card) return;

    const inner = document.getElementById('card-inner');
    
    // Ép thẻ úp lại mặt trước không bị giật
    if (inner && inner.classList.contains('rotate-y-180')) {
        inner.style.transition = 'none'; 
        inner.classList.remove('rotate-y-180');
        void inner.offsetWidth; 
        inner.style.transition = ''; 
    }

    // NÂNG CẤP SRS: Đảm bảo hiển thị Nút "Xem nghĩa" (Ẩn nút Đánh giá)
    const ctrlFront = document.getElementById('flashcard-controls-front');
    const ctrlBack = document.getElementById('flashcard-controls-back');
    if (ctrlFront && ctrlBack) {
        ctrlBack.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
        ctrlBack.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        
        ctrlFront.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        ctrlFront.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
    }

    const setHtml = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };

    setHtml('card-front-word', card.word);
    setHtml('card-front-ipa', card.ipa || '/.../');
    setHtml('card-front-type', card.type || 'n');
    setHtml('card-back-mean', card.mean);
    setHtml('card-back-type-ipa', `${card.type || 'n'} • ${card.ipa || ''}`);
    setHtml('card-back-example', card.example ? `"${card.example}"` : 'Chưa có ví dụ.');
    setHtml('card-back-synonyms', (card.synonyms && card.synonyms !== 'None') ? card.synonyms : 'N/A');
    setHtml('card-back-antonyms', (card.antonyms && card.antonyms !== 'None') ? card.antonyms : 'N/A');

    const noteBox = document.getElementById('card-back-note-box');
    const noteText = document.getElementById('card-back-note');
    if (card.note && noteText && noteBox) {
        noteText.innerText = card.note;
        noteBox.classList.remove('hidden');
    } else if (noteBox) {
        noteBox.classList.add('hidden');
    }

    const total = currentSessionWords.length;
    const current = currentCardIndex + 1;
    setHtml('card-progress', `${current} / ${total}`);
    
    const progBar = document.getElementById('card-progress-bar');
    if(progBar) progBar.style.width = `${(current / total) * 100}%`;

    if (appSettings.autoSpeak) speak(card.word);
}

function flipCard() {
    const inner = document.getElementById('card-inner');
    if(!inner) return;
    
    const isFlippingToBack = !inner.classList.contains('rotate-y-180');
    inner.classList.toggle('rotate-y-180');
    
    // NÂNG CẤP SRS: Chuyển đổi UI Bảng điều khiển
    const ctrlFront = document.getElementById('flashcard-controls-front');
    const ctrlBack = document.getElementById('flashcard-controls-back');

    if (isFlippingToBack) {
        ctrlFront.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        ctrlFront.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
        
        ctrlBack.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        ctrlBack.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
    } else {
        ctrlBack.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
        ctrlBack.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        
        ctrlFront.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        ctrlFront.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
    }

    const card = currentSessionWords[currentCardIndex];
    if (card && isFlippingToBack && !appSettings.autoSpeak) {
        speak(card.word);
    }
}

// NÂNG CẤP SRS: Ghi nhận điểm thông thạo
function rateFlashcard(score) {
    const card = currentSessionWords[currentCardIndex];
    if (card) {
        if (card.masteryLevel === undefined) card.masteryLevel = 0;
        
        card.masteryLevel += score;
        if (card.masteryLevel < -2) card.masteryLevel = -2; // Khóa đáy
        card.lastReviewed = new Date().toISOString();

        if (typeof saveVocabToStorage === "function") {
            saveVocabToStorage();
        } else {
            localStorage.setItem('my_vocab', JSON.stringify(vocabList));
        }
    }
    nextCard();
}

function nextCard() {
    if (currentCardIndex < currentSessionWords.length - 1) {
        currentCardIndex++;
        showCard();
    } else {
        closeFlashcards(); 
        showToast("🎉 Hoàn thành ôn tập chủ đề này!");
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCard();
    }
}
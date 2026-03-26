/* =========================================
   FLASHCARD MODULE & SETTINGS INTEGRATION
   ========================================= */
let autoFlipTimer = null; // Biến giữ đồng hồ tự lật thẻ

function startFlashcards(topic) {
    let words = vocabList.filter(v => (v.topic || 'Chung') === topic);
    if (words.length === 0) return showToast("📂 Chủ đề này chưa có từ!", 'error');

    // 1. TÍNH NĂNG: LUÔN XÁO TRỘN THẺ (SHUFFLE)
    if (appSettings.shuffleFlashcards) {
        words.sort(() => 0.5 - Math.random());
    } 
    // Nếu không bật trộn cứng, ưu tiên dùng thuật toán SRS
    else if (typeof calculateSRSPriority === "function") {
        words.sort((a, b) => calculateSRSPriority(b) - calculateSRSPriority(a));
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
    clearTimeout(autoFlipTimer); // Xóa đồng hồ tự lật nếu đang chạy
    const flashView = document.getElementById('flashcard-view');
    if (flashView) {
        flashView.classList.add('hidden');
        document.body.style.overflow = ''; 
    }
    if (typeof checkAndUpdateStreak === "function") checkAndUpdateStreak();
}

function showCard() {
    clearTimeout(autoFlipTimer); // Reset bộ đếm tự lật mỗi khi sang thẻ mới
    const card = currentSessionWords[currentCardIndex];
    if (!card) return;

    const inner = document.getElementById('card-inner');
    
    // 2. TÍNH NĂNG: GIẢM HOẠT ẢNH (REDUCE MOTION)
    if (appSettings.reduceMotion) {
        inner.style.transition = 'none'; // Tắt hiệu ứng 3D lật mượt
    } else {
        inner.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }

    // Ép thẻ về mặt trước
    if (inner && inner.classList.contains('rotate-y-180')) {
        let oldTransition = inner.style.transition;
        inner.style.transition = 'none'; 
        inner.classList.remove('rotate-y-180');
        void inner.offsetWidth; 
        inner.style.transition = oldTransition; 
    }

    // Reset UI Bảng điều khiển
    const ctrlFront = document.getElementById('flashcard-controls-front');
    const ctrlBack = document.getElementById('flashcard-controls-back');
    if (ctrlFront && ctrlBack) {
        ctrlBack.classList.replace('opacity-100', 'opacity-0');
        ctrlBack.classList.replace('pointer-events-auto', 'pointer-events-none');
        ctrlBack.classList.replace('scale-100', 'scale-95');
        
        ctrlFront.classList.replace('opacity-0', 'opacity-100');
        ctrlFront.classList.replace('pointer-events-none', 'pointer-events-auto');
        ctrlFront.classList.replace('scale-95', 'scale-100');
    }

    const setHtml = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };

    // 3. TÍNH NĂNG: CỠ CHỮ & ẨN HIỆN IPA/VÍ DỤ
    const wordEl = document.getElementById('card-front-word');
    const ipaEl = document.getElementById('card-front-ipa');
    const ipaBackEl = document.getElementById('card-back-type-ipa');
    const exampleBox = document.getElementById('card-back-example').parentElement;
    
    if (wordEl) {
        wordEl.className = `font-black text-slate-800 dark:text-white tracking-tight break-words w-full leading-tight ${appSettings.fontSize === 'lg' ? 'text-5xl sm:text-6xl' : (appSettings.fontSize === 'sm' ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl')}`;
    }

    // Ẩn/Hiện Phiên âm
    if (ipaEl) ipaEl.style.display = appSettings.showIPA ? 'block' : 'none';
    if (ipaBackEl) ipaBackEl.style.display = appSettings.showIPA ? 'block' : 'none';
    
    // Ẩn/Hiện Ví dụ
    if (exampleBox) exampleBox.style.display = appSettings.showExample ? 'block' : 'none';

    // Đổ dữ liệu
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

    // 4. TÍNH NĂNG: TỰ ĐỘNG LẬT THẺ
    if (appSettings.autoFlip !== 'off') {
        const delay = parseInt(appSettings.autoFlip) * 1000;
        autoFlipTimer = setTimeout(() => {
            const innerCheck = document.getElementById('card-inner');
            if (innerCheck && !innerCheck.classList.contains('rotate-y-180')) {
                flipCard(); // Tự gọi hàm lật mặt
            }
        }, delay);
    }
}

function flipCard() {
    clearTimeout(autoFlipTimer); // Hủy tự lật nếu user đã tự bấm lật
    const inner = document.getElementById('card-inner');
    if(!inner) return;
    
    const isFlippingToBack = !inner.classList.contains('rotate-y-180');
    inner.classList.toggle('rotate-y-180');
    
    const ctrlFront = document.getElementById('flashcard-controls-front');
    const ctrlBack = document.getElementById('flashcard-controls-back');

    if (isFlippingToBack) {
        ctrlFront.classList.replace('opacity-100', 'opacity-0');
        ctrlFront.classList.replace('pointer-events-auto', 'pointer-events-none');
        ctrlFront.classList.replace('scale-100', 'scale-95');
        
        ctrlBack.classList.replace('opacity-0', 'opacity-100');
        ctrlBack.classList.replace('pointer-events-none', 'pointer-events-auto');
        ctrlBack.classList.replace('scale-95', 'scale-100');
    } else {
        ctrlBack.classList.replace('opacity-100', 'opacity-0');
        ctrlBack.classList.replace('pointer-events-auto', 'pointer-events-none');
        ctrlBack.classList.replace('scale-100', 'scale-95');
        
        ctrlFront.classList.replace('opacity-0', 'opacity-100');
        ctrlFront.classList.replace('pointer-events-none', 'pointer-events-auto');
        ctrlFront.classList.replace('scale-95', 'scale-100');
    }

    const card = currentSessionWords[currentCardIndex];
    if (card && isFlippingToBack && !appSettings.autoSpeak) {
        speak(card.word);
    }
}

function rateFlashcard(score) {
    const card = currentSessionWords[currentCardIndex];
    if (card) {
        if (card.masteryLevel === undefined) card.masteryLevel = 0;
        card.masteryLevel += score;
        if (card.masteryLevel < -2) card.masteryLevel = -2;
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
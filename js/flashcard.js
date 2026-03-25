function startFlashcards(topic) {
    currentSessionWords = vocabList.filter(v => (v.topic || 'Chung') === topic);
    if (currentSessionWords.length === 0) return showToast("📂 Chủ đề này chưa có từ!", 'error');

    currentCardIndex = 0;
    switchTab('library');

    const headerSection = document.getElementById('library-header-section');
    const topicView = document.getElementById('library-topics-view');
    const notebookView = document.getElementById('library-notebook-view');
    const flashView = document.getElementById('flashcard-view');

    if (headerSection) headerSection.classList.add('hidden');
    if (topicView) topicView.classList.add('hidden');
    if (notebookView) notebookView.classList.add('hidden');
    if (flashView) flashView.classList.remove('hidden');

    showCard();
}

function closeFlashcards() {
    const flashView = document.getElementById('flashcard-view');
    const headerSection = document.getElementById('library-header-section');
    const topicsView = document.getElementById('library-topics-view');
    
    if (flashView) flashView.classList.add('hidden');
    if (headerSection) headerSection.classList.remove('hidden');
    if (topicsView) topicsView.classList.remove('hidden');
    
    switchLibView('topics');
}

function showCard() {
    const card = currentSessionWords[currentCardIndex];
    if (!card) return;

    const setHtml = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };

    setHtml('card-front-word', card.word);
    setHtml('card-front-ipa', card.ipa || '/---/');
    setHtml('card-front-type', card.type || 'n');
    setHtml('card-back-mean', card.mean);
    setHtml('card-back-type-ipa', `${card.type || 'n'} • ${card.ipa || ''}`);
    setHtml('card-back-example', `"${card.example}"`);
    setHtml('card-back-synonyms', card.synonyms || 'N/A');
    setHtml('card-back-antonyms', card.antonyms || 'N/A');

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
    
    const inner = document.getElementById('card-inner');
    if(inner) inner.classList.remove('rotate-y-180');

    if (appSettings.autoSpeak) speak(card.word);
}

function flipCard() {
    const inner = document.getElementById('card-inner');
    inner.classList.toggle('rotate-y-180');
    const card = currentSessionWords[currentCardIndex];
    if (card) speak(card.word);
}

function nextCard() {
    if (currentCardIndex < currentSessionWords.length - 1) {
        currentCardIndex++;
        showCard();
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCard();
    }
}
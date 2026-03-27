import { AppState } from '../core/state.js';
import { appEventBus, EVENTS } from '../core/eventBus.js';
import { showToast } from '../shared/ui-helpers.js';
import { AudioAPI } from '../shared/audio.js';

const FlashcardModule = (function () {
    let autoFlipTimer = null;
    let currentSessionWords = [];
    let currentCardIndex = 0;

    function startFlashcards(topic) {
        const vocabList = AppState.getVocab();
        const settings = AppState.getSettings();

        let words = vocabList.filter(v => (v.topic || 'Chung') === topic);
        if (words.length === 0) return showToast("📂 Chủ đề này chưa có từ!", 'error');

        if (settings.shuffleFlashcards) {
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
        clearTimeout(autoFlipTimer);
        const flashView = document.getElementById('flashcard-view');
        if (flashView) {
            flashView.classList.add('hidden');
            document.body.style.overflow = '';
        }
        appEventBus.emit(EVENTS.QUIZ_FINISHED);
    }

    function showCard() {
        clearTimeout(autoFlipTimer);
        const settings = AppState.getSettings();
        const card = currentSessionWords[currentCardIndex];
        if (!card) return;

        const inner = document.getElementById('card-inner');

        if (settings.reduceMotion) {
            inner.style.transition = 'none';
        } else {
            inner.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }

        if (inner && inner.classList.contains('rotate-y-180')) {
            let oldTransition = inner.style.transition;
            inner.style.transition = 'none';
            inner.classList.remove('rotate-y-180');
            void inner.offsetWidth;
            inner.style.transition = oldTransition;
        }

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

        const setHtml = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
        const wordEl = document.getElementById('card-front-word');
        const ipaEl = document.getElementById('card-front-ipa');
        const ipaBackEl = document.getElementById('card-back-type-ipa');
        const exampleBox = document.getElementById('card-back-example').parentElement;

        if (wordEl) {
            wordEl.className = `font-black text-slate-800 dark:text-white tracking-tight break-words w-full leading-tight ${settings.fontSize === 'lg' ? 'text-5xl sm:text-6xl' : (settings.fontSize === 'sm' ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl')}`;
        }

        if (ipaEl) ipaEl.style.display = settings.showIPA ? 'block' : 'none';
        if (ipaBackEl) ipaBackEl.style.display = settings.showIPA ? 'block' : 'none';
        if (exampleBox) exampleBox.style.display = settings.showExample ? 'block' : 'none';

        setHtml('card-front-word', card.word);
        setHtml('card-front-ipa', card.ipa || '/.../');
        setHtml('card-front-type', card.type || 'n');
        setHtml('card-back-mean', card.mean);
        setHtml('card-back-type-ipa', `${card.type || 'n'} • ${card.ipa || ''}`);
        setHtml('card-back-example', card.example ? `"${card.example}"` : 'Chưa có ví dụ.');
        setHtml('card-back-synonyms', (card.synonyms && card.synonyms !== 'None') ? card.synonyms : 'N/A');
        setHtml('card-back-antonyms', (card.antonyms && card.antonyms !== 'None') ? card.antonyms : 'N/A');

        const total = currentSessionWords.length;
        const current = currentCardIndex + 1;
        setHtml('card-progress', `${current} / ${total}`);
        const progBar = document.getElementById('card-progress-bar');
        if (progBar) progBar.style.width = `${(current / total) * 100}%`;

        if (settings.autoSpeak) AudioAPI.speak(card.word);

        if (settings.autoFlip !== 'off') {
            const delay = parseInt(settings.autoFlip) * 1000;
            autoFlipTimer = setTimeout(() => {
                const innerCheck = document.getElementById('card-inner');
                if (innerCheck && !innerCheck.classList.contains('rotate-y-180')) {
                    flipCard();
                }
            }, delay);
        }
    }

    function flipCard() {
        clearTimeout(autoFlipTimer);
        const inner = document.getElementById('card-inner');
        if (!inner) return;

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
        if (card && isFlippingToBack) {
            AudioAPI.speak(card.word);
        }
    }

    function rateFlashcard(score) {
        const vocabList = AppState.getVocab();
        const card = currentSessionWords[currentCardIndex];

        if (card) {
            const newVocabList = vocabList.map(v => {
                if(v.word !== card.word) return v;
                let newMastery = (v.masteryLevel || 0) + score;
                return { ...v, masteryLevel: Math.max(-2, newMastery), lastReviewed: new Date().toISOString() };
            });
            AppState.setVocab(newVocabList);
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

    function speakCurrentCard() {
        const card = currentSessionWords[currentCardIndex];
        if (card) AudioAPI.speak(card.word);
    }

    const actions = {
        'start-flashcards': (payload) => startFlashcards(payload),
        'close-flashcards': () => closeFlashcards(),
        'flip-card': () => flipCard(),
        'rate-card': (payload) => rateFlashcard(parseInt(payload, 10)),
        'prev-card': () => prevCard(),
        'speak-flashcard': () => speakCurrentCard()
    };

    return { actions };
})();

export { FlashcardModule };
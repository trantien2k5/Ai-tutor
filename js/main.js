// js/main.js
import { AppState } from './core/state.js';
import { appEventBus, EVENTS } from './core/eventBus.js';
import { AudioAPI } from './shared/audio.js';

import { SettingsModule } from './features/settings.js';
import { HomeModule } from './features/home.js';
import { LibraryModule } from './features/library.js';
import { AIModule } from './features/ai.js';
import { FlashcardModule } from './features/flashcard.js';
// Thêm dòng import PracticeModule ở đây
import { PracticeModule } from './features/practice.js';

// --- 1. NẠP COMPONENT ---
async function loadComponent(id, fileName) {
    try {
        const response = await fetch(`components/${fileName}`);
        const target = document.getElementById(id);
        if (response.ok && target) {
            const rawHtml = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHtml, 'text/html');
            const section = doc.querySelector('section');
            target.innerHTML = section ? section.innerHTML : rawHtml;
        }
    } catch (error) {
        console.error("Lỗi nạp component:", fileName, error);
    }
}

// --- 2. QUẢN LÝ TAB (ROUTER) ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'dark:text-blue-400', 'bg-blue-50', 'dark:bg-blue-900/20');
        btn.classList.add('text-slate-400', 'dark:text-slate-500');
    });

    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.classList.remove('hidden');

    document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(activeBtn => {
        activeBtn.classList.remove('text-slate-400', 'dark:text-slate-500');
        activeBtn.classList.add('text-blue-600', 'dark:text-blue-400');
        if (!activeBtn.closest('nav')) activeBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
    });

    // Cập nhật ở đây: Gọi trực tiếp PracticeModule thay vì window.PracticeModule
    if (tabId === 'home') {
        HomeModule.updateStats();
        HomeModule.renderStreakUI();
    } else if (tabId === 'library') {
        LibraryModule.renderLibrary();
        LibraryModule.renderVocabList(true);
    } else if (tabId === 'practice') {
        PracticeModule.updateTopics(); 
    } else if (tabId === 'settings') {
        SettingsModule.initUI();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

appEventBus.on(EVENTS.TAB_CHANGED, switchTab);

// Cập nhật phần Event Delegation trong js/main.js
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    const payload = target.getAttribute('data-payload');

    // Bọc thép toàn bộ luồng sự kiện click
    try {
        switch (action) {
            case 'start-flashcards': FlashcardModule.start(payload); break;
            case 'close-flashcards': FlashcardModule.close(); break;
            case 'flip-card': FlashcardModule.flip(); break;
            case 'rate-card':
                e.stopPropagation();
                FlashcardModule.rate(parseInt(payload));
                break;
            case 'prev-card':
                e.stopPropagation();
                FlashcardModule.prev();
                break;
            case 'speak-flashcard':
                e.stopPropagation();
                FlashcardModule.speak();
                break;
                
            case 'set-quiz-mode': PracticeModule.setMode(payload, target); break;
            case 'set-quiz-count': PracticeModule.setCount(parseInt(payload), target); break;
            case 'init-quiz': PracticeModule.init(); break;
            case 'answer-quiz': PracticeModule.handleAnswer(payload, target); break;
            case 'next-quiz-question': PracticeModule.renderNext(); break;
            case 'exit-quiz': PracticeModule.exit(); break;

            case 'speak':
                e.stopPropagation();
                AudioAPI.speak(payload);
                break;
            default:
                break;
        }
    } catch (error) {
        // Nếu một tính năng bị lỗi code (ví dụ do update sai), nó sẽ bị chặn lại ở đây
        console.error(`[Core System] ❌ Tính năng '${action}' gặp sự cố cục bộ:`, error);
        
        // Bạn có thể import showToast vào main.js để báo lỗi nhẹ nhàng cho user
        // showToast('Tính năng này đang tạm thời gián đoạn', 'error');
    }
});

// --- 4. KHỞI TẠO ỨNG DỤNG ---
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadComponent('tab-home', 'home.html'),
        loadComponent('tab-library', 'library.html'),
        loadComponent('tab-ai-gen', 'ai.html'),
        loadComponent('tab-practice', 'practice.html'),
        loadComponent('tab-settings', 'settings.html'),
        loadComponent('flashcard-wrapper', 'flashcard.html')
    ]);

    SettingsModule.applyTheme();
    AudioAPI.initVoices();
    switchTab('home');

    window.switchTab = switchTab;
    window.appEventBus = appEventBus;
});
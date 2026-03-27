import { AppState } from './core/state.js';
import { appEventBus, EVENTS } from './core/eventBus.js';
import { AudioAPI } from './shared/audio.js';
import { SettingsModule } from './features/settings.js';
import { HomeModule } from './features/home.js';
import { LibraryModule } from './features/library.js';
import { AIModule } from './features/ai.js';
import { FlashcardModule } from './features/flashcard.js';
import { PracticeModule } from './features/practice.js';

const appActions = {
    ...(HomeModule?.actions || {}),
    ...(LibraryModule?.actions || {}),
    ...(AIModule?.actions || {}),
    ...(FlashcardModule?.actions || {}),
    ...(PracticeModule?.actions || {}),
    ...(SettingsModule?.actions || {}),
    'switch-tab': (payload) => handleSwitchTab(payload),
    'speak': (payload) => AudioAPI.speak(payload)
};

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
        console.error(error);
    }
}

function handleSwitchTab(tabId) {
    if (!tabId) return;

    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'dark:text-blue-400', 'bg-blue-50', 'dark:bg-blue-900/20');
        btn.classList.add('text-slate-400', 'dark:text-slate-500');
        btn.setAttribute('aria-current', 'false');
    });

    document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(activeBtn => {
        activeBtn.classList.remove('text-slate-400', 'dark:text-slate-500');
        activeBtn.classList.add('text-blue-600', 'dark:text-blue-400');
        activeBtn.setAttribute('aria-current', 'page');
        
        if (!activeBtn.closest('.md\\:hidden')) { 
            activeBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
        }
    });

    appEventBus.emit(EVENTS.TAB_CHANGED, tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

appEventBus.on(EVENTS.TAB_CHANGED, (tabId) => {
    switch(tabId) {
        case 'home':
            if (HomeModule?.updateStats) HomeModule.updateStats();
            if (HomeModule?.renderStreakUI) HomeModule.renderStreakUI();
            break;
        case 'library':
            if (LibraryModule?.renderLibrary) LibraryModule.renderLibrary();
            if (LibraryModule?.renderVocabList) LibraryModule.renderVocabList(true);
            break;
        case 'practice':
            if (PracticeModule?.updateTopics) PracticeModule.updateTopics(); 
            break;
        case 'settings':
            if (SettingsModule?.initUI) SettingsModule.initUI();
            break;
    }
});

function handleAction(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    const payload = target.getAttribute('data-payload');

    if (appActions[action]) {
        if (e.type === 'click' && target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && target.type !== 'checkbox') {
            e.preventDefault();
        }
        try {
            appActions[action](payload, target);
        } catch (error) {
            console.error(error);
        }
    }
}

document.addEventListener('click', handleAction);
document.addEventListener('change', handleAction);

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadComponent('tab-home', 'home.html'),
        loadComponent('tab-library', 'library.html'),
        loadComponent('tab-ai-gen', 'ai.html'),
        loadComponent('tab-practice', 'practice.html'),
        loadComponent('tab-settings', 'settings.html'),
        loadComponent('flashcard-wrapper', 'flashcard.html')
    ]);

    if (SettingsModule?.applyTheme) SettingsModule.applyTheme();
    AudioAPI.initVoices();
    handleSwitchTab('home'); 

    window.appEventBus = appEventBus;
});

window.addMoreWordsToTopic = function(topicName) {
    const topicInput = document.getElementById('user-topic');
    if (topicInput) {
        topicInput.value = topicName;
        topicInput.focus();
    }
    handleSwitchTab('ai-gen');
}
function refreshAllUI() {
    renderLibrary();
    updateStats();
    renderVocabList();
    updateQuizTopics();
}

window.onload = async () => {
    // Nạp giao diện và đợi hoàn tất 100% trước khi render
    await Promise.all([
        loadComponent('tab-home', 'home.html'),
        loadComponent('tab-library', 'library.html'),
        loadComponent('tab-ai-gen', 'ai.html'),
        loadComponent('tab-practice', 'practice.html'),
        loadComponent('tab-settings', 'settings.html')
    ]);

    loadSettingsUI();
    applyTheme();
    loadVoices();
    refreshAllUI();
    switchTab('home');
};
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-slate-900/90 dark:bg-blue-600/90' : 'bg-red-600/90';
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md font-bold text-xs uppercase tracking-widest toast-in pointer-events-auto`;
    toast.innerHTML = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.replace('toast-in', 'toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    const voiceSelect = document.getElementById('setting-voice');
    if (!voiceSelect) return;
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    voiceSelect.innerHTML = enVoices.map(v => `<option value="${v.name}" ${v.name === appSettings.voiceName ? 'selected' : ''}>${v.name} (${v.lang})</option>`).join('');
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = voices.find(v => v.name === appSettings.voiceName);
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = 'en-US';
        utterance.rate = appSettings.ttsRate || 1.0;
        window.speechSynthesis.speak(utterance);
    }
}
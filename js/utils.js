// Hiển thị thông báo (Toast)
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

// Tải danh sách giọng đọc tiếng Anh
function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    const voiceSelect = document.getElementById('setting-voice');
    if (!voiceSelect) return;
    
    const settings = AppState.getSettings();
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    voiceSelect.innerHTML = enVoices.map(v => `<option value="${v.name}" ${v.name === settings.voiceName ? 'selected' : ''}>${v.name} (${v.lang})</option>`).join('');
}

// Phát âm thanh đọc từ vựng (TTS)
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const settings = AppState.getSettings();
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = voices.find(v => v.name === settings.voiceName);
        
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = 'en-US';
        utterance.rate = settings.ttsRate || 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// Tạo âm thanh hiệu ứng đúng/sai (SFX)
function playSound(type) {
    const settings = AppState.getSettings();
    if (!settings.sfxEnabled) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return; 
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(); 
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start(); 
            osc.stop(ctx.currentTime + 0.2);
        }
    } catch (e) { console.error("SFX Error:", e); }
}
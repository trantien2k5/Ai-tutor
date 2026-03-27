// js/shared/audio.js
import { AppState } from '../core/state.js';

let availableVoices = [];

export const AudioAPI = {
    // Tải danh sách giọng đọc từ trình duyệt
    initVoices: () => {
        availableVoices = window.speechSynthesis.getVoices();
        return availableVoices.filter(v => v.lang.startsWith('en'));
    },

    // Phát âm thanh đọc từ vựng (TTS)
    speak: (text) => {
        if (!('speechSynthesis' in window)) return;
        
        window.speechSynthesis.cancel();
        const settings = AppState.getSettings();
        
        // Không đọc nếu đang tắt autoSpeak (tùy ngữ cảnh, nhưng hàm này gọi chủ động thì vẫn đọc)
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = availableVoices.find(v => v.name === settings.voiceName);
        
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = 'en-US';
        utterance.rate = settings.ttsRate || 1.0;
        
        window.speechSynthesis.speak(utterance);
    },

    // Tạo âm thanh hiệu ứng đúng/sai (SFX)
    playSound: (type) => {
        const settings = AppState.getSettings();
        if (!settings.sfxEnabled) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return; 
            
            if (!AudioAPI._ctx) {
                AudioAPI._ctx = new AudioContext();
            }
            
            const ctx = AudioAPI._ctx;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

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
        } catch (e) { 
            console.warn("AudioContext blocked or failed:", e); 
        }
    }
};

// Đảm bảo voice được nạp khi event thay đổi (do Chrome load voice bất đồng bộ)
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = AudioAPI.initVoices;
}
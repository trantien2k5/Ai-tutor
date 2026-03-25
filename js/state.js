/* Các biến Global State */
let vocabList = JSON.parse(localStorage.getItem('my_vocab')) || [];
let voices = [];
let appSettings = JSON.parse(localStorage.getItem('app_settings')) || {
    dailyGoal: 10,
    ttsRate: 1.0,
    voiceName: '',
    darkMode: false,
    autoSpeak: false
};

let quizState = {
    pool: [],
    currentIdx: 0,
    score: 0,
    total: 20,
    mode: 'learning',
    startTime: null,
    timerInterval: null
};

let currentSessionWords = [];
let currentCardIndex = 0;
let searchTimeout;
let notebookRenderLimit = 50;
/***********************************************
 * Screen Transition Animation Function
 ***********************************************/
function animateTransition(fromScreen, toScreen, outClass, inClass, callback) {
    fromScreen.classList.add(outClass);
    fromScreen.addEventListener('animationend', function handler() {
        fromScreen.removeEventListener('animationend', handler);
        fromScreen.classList.add('hidden');
        fromScreen.classList.remove(outClass);
        toScreen.classList.remove('hidden');
        toScreen.classList.add(inClass);
        toScreen.addEventListener('animationend', function handler2() {
            toScreen.removeEventListener('animationend', handler2);
            toScreen.classList.remove(inClass);
            if (callback) callback();
        });
    });
}

/***********************************************
 * Helper: Get currently visible screen (non-menu)
 ***********************************************/
function getCurrentScreen() {
    const screens = [screenStopwatch, screenTimerSetup, screenTimerRun];
    for (const s of screens) {
        if (!s.classList.contains('hidden')) {
            return s;
        }
    }
    return null;
}

/***********************************************
 * SPA Navigation
 ***********************************************/
const screenMenu = document.getElementById('screen-menu');
const screenStopwatch = document.getElementById('screen-stopwatch');
const screenTimerSetup = document.getElementById('screen-timer-setup');
const screenTimerRun = document.getElementById('screen-timer-run');
const bottomBar = document.getElementById('bottom-bar');
const btnBack = document.getElementById('btn-back');

const btnStopwatch = document.getElementById('btn-stopwatch');
const btnTimer = document.getElementById('btn-timer');

btnStopwatch.addEventListener('click', () => {
    // Animate from menu to stopwatch:
    // Menu slides out downward, stopwatch slides in from above.
    animateTransition(screenMenu, screenStopwatch, 'slide-out-down', 'slide-in-from-top', () => {
        btnBack.classList.remove('hidden'); // show back button on non-menu screens
    });
});

btnTimer.addEventListener('click', () => {
    // Animate from menu to timer setup:
    // Menu slides out upward, timer setup slides in from bottom.
    animateTransition(screenMenu, screenTimerSetup, 'slide-out-up', 'slide-in-from-bottom', () => {
        btnBack.classList.remove('hidden');
    });
});

// Back button: animate current screen out left and menu in from left.
btnBack.addEventListener('click', () => {
    let current = getCurrentScreen();
    if (!current) return;
    current.classList.add('slide-out-left');
    current.addEventListener('animationend', function handler() {
        current.removeEventListener('animationend', handler);
        current.classList.add('hidden');
        current.classList.remove('slide-out-left');
        btnBack.classList.add('hidden'); // Hide back button when returning home.
        screenMenu.classList.remove('hidden');
        screenMenu.classList.add('slide-in-from-left');
        screenMenu.addEventListener('animationend', function handler2() {
            screenMenu.removeEventListener('animationend', handler2);
            screenMenu.classList.remove('slide-in-from-left');
        });
    });
});

// Initially, show menu and hide Back button.
screenMenu.classList.remove('hidden');
btnBack.classList.add('hidden');

/***********************************************
 * Stopwatch
 ***********************************************/
let stopwatchInterval = null;
let stopwatchRunning = false;
let stopwatchStartTime = 0;
let stopwatchElapsed = 0;

const stopwatchDisplay = document.getElementById('stopwatch-display');
const stopwatchMs = document.getElementById('stopwatch-ms');
const btnSWStartPause = document.getElementById('stopwatch-start-pause-btn');
const btnSWClear = document.getElementById('stopwatch-clear-btn');

function updateStopwatchDisplay() {
    const now = Date.now();
    if (stopwatchRunning) {
        const diff = now - stopwatchStartTime;
        stopwatchElapsed += diff;
        stopwatchStartTime = now;
    }
    let totalMs = stopwatchElapsed;
    let hours = Math.floor(totalMs / 3600000);
    totalMs %= 3600000;
    let minutes = Math.floor(totalMs / 60000);
    totalMs %= 60000;
    let seconds = Math.floor(totalMs / 1000);
    let msPart = totalMs % 1000;

    stopwatchDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    stopwatchMs.textContent = `.${String(msPart).padStart(3, '0')}`;
}

function stopwatchTick() {
    if (stopwatchRunning) updateStopwatchDisplay();
}

btnSWStartPause.addEventListener('click', () => {
    if (!stopwatchRunning && stopwatchElapsed === 0) {
        startStopwatch();
    } else if (stopwatchRunning) {
        pauseStopwatch();
    } else {
        continueStopwatch();
    }
});

btnSWClear.addEventListener('click', () => {
    resetStopwatch();
});

function startStopwatch() {
    stopwatchRunning = true;
    stopwatchStartTime = Date.now();
    btnSWStartPause.textContent = 'Pause';
    btnSWStartPause.classList.remove('bg-green-500', 'bg-blue-500');
    btnSWStartPause.classList.add('bg-red-500');
}

function pauseStopwatch() {
    updateStopwatchDisplay();
    stopwatchRunning = false;
    btnSWStartPause.textContent = 'Continue';
    btnSWStartPause.classList.remove('bg-red-500', 'bg-green-500');
    btnSWStartPause.classList.add('bg-blue-500');
}

function continueStopwatch() {
    stopwatchRunning = true;
    stopwatchStartTime = Date.now();
    btnSWStartPause.textContent = 'Pause';
    btnSWStartPause.classList.remove('bg-blue-500', 'bg-green-500');
    btnSWStartPause.classList.add('bg-red-500');
}

function resetStopwatch() {
    stopwatchRunning = false;
    stopwatchElapsed = 0;
    stopwatchStartTime = 0;
    btnSWStartPause.textContent = 'Start';
    btnSWStartPause.classList.remove('bg-red-500', 'bg-blue-500');
    btnSWStartPause.classList.add('bg-green-500');
    updateStopwatchDisplay();
}

setInterval(stopwatchTick, 16);

/***********************************************
 * Timer
 ***********************************************/
const timerSetupDisplay = document.getElementById('timer-setup-display');
const timerRunDisplay = document.getElementById('timer-run-display');
const timerRunMs = document.getElementById('timer-run-ms');

const digitButtons = document.querySelectorAll('.timer-digit-btn');
const btnTimerSetupClear = document.getElementById('timer-setup-clear');
const btnTimerSetupSet = document.getElementById('timer-setup-set');
const btnTimerStartStop = document.getElementById('timer-start-stop-btn');
const btnTimerClear = document.getElementById('timer-clear-btn');

let timerInputString = '';
let timerSetMs = 0;
let timerRemainingMs = 0;
let timerRunning = false;
let timerInterval = null;
let timerLastUpdateTime = 0;

function updateTimerSetupDisplay() {
    let padded = timerInputString.padStart(6, '0');
    timerSetupDisplay.textContent = padded.slice(0, 2) + ":" + padded.slice(2, 4) + ":" + padded.slice(4, 6);
}

digitButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (timerInputString.length < 6) {
            timerInputString += btn.getAttribute('data-digit');
            updateTimerSetupDisplay();
        }
    });
});

btnTimerSetupClear.addEventListener('click', () => {
    timerInputString = '';
    updateTimerSetupDisplay();
});

function parseTimerInput(str) {
    let raw = str.padStart(6, '0');
    let hours = parseInt(raw.slice(0, 2), 10);
    let minutes = parseInt(raw.slice(2, 4), 10);
    let seconds = parseInt(raw.slice(4, 6), 10);
    if (seconds >= 60) {
        let extraMin = Math.floor(seconds / 60);
        seconds = seconds % 60;
        minutes += extraMin;
    }
    if (minutes >= 60) {
        let extraHr = Math.floor(minutes / 60);
        minutes = minutes % 60;
        hours += extraHr;
    }
    return (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
}

btnTimerSetupSet.addEventListener('click', () => {
    const msVal = parseTimerInput(timerInputString);
    if (msVal <= 0) return;
    timerSetMs = msVal;
    timerRemainingMs = msVal;
    screenTimerSetup.classList.add('hidden');
    screenTimerRun.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    updateTimerRunDisplay(timerRemainingMs);
    btnTimerStartStop.textContent = 'Start';
    btnTimerStartStop.classList.remove('bg-red-500', 'bg-blue-500');
    btnTimerStartStop.classList.add('bg-green-500');
    timerRunning = false;
});

function updateTimerRunDisplay(ms) {
    let totalMs = Math.floor(ms);
    let hours = Math.floor(totalMs / 3600000);
    totalMs %= 3600000;
    let minutes = Math.floor(totalMs / 60000);
    totalMs %= 60000;
    let seconds = Math.floor(totalMs / 1000);
    let msPart = totalMs % 1000;

    timerRunDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timerRunMs.textContent = `.${String(msPart).padStart(3, '0')}`;
}

function timerTick() {
    let now = Date.now();
    let delta = now - timerLastUpdateTime;
    timerLastUpdateTime = now;
    timerRemainingMs -= delta;
    if (timerRemainingMs <= 0) {
        timerRemainingMs = 0;
        updateTimerRunDisplay(0);
        clearInterval(timerInterval);
        timerInterval = null;
        playAlarm();
        return;
    }
    updateTimerRunDisplay(timerRemainingMs);
}

btnTimerStartStop.addEventListener('click', () => {
    if (!timerRunning && timerRemainingMs === timerSetMs) {
        startTimer();
    } else if (timerRunning) {
        stopTimer();
    } else {
        continueTimer();
    }
});

btnTimerClear.addEventListener('click', () => {
    stopAlarm();
    timerRunning = false;
    timerRemainingMs = timerSetMs;
    updateTimerRunDisplay(timerRemainingMs);
    btnTimerStartStop.textContent = 'Start';
    btnTimerStartStop.classList.remove('bg-red-500', 'bg-blue-500');
    btnTimerStartStop.classList.add('bg-green-500');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
});

function startTimer() {
    timerRunning = true;
    btnTimerStartStop.textContent = 'Stop';
    btnTimerStartStop.classList.remove('bg-green-500', 'bg-blue-500');
    btnTimerStartStop.classList.add('bg-red-500');
    timerLastUpdateTime = Date.now();
    timerInterval = setInterval(timerTick, 16);
}

function stopTimer() {
    timerRunning = false;
    btnTimerStartStop.textContent = 'Continue';
    btnTimerStartStop.classList.remove('bg-red-500', 'bg-green-500');
    btnTimerStartStop.classList.add('bg-blue-500');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function continueTimer() {
    timerRunning = true;
    btnTimerStartStop.textContent = 'Stop';
    btnTimerStartStop.classList.remove('bg-blue-500', 'bg-green-500');
    btnTimerStartStop.classList.add('bg-red-500');
    timerLastUpdateTime = Date.now();
    timerInterval = setInterval(timerTick, 16);
}

function resetTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerInputString = '';
    timerSetMs = 0;
    timerRemainingMs = 0;
    timerRunning = false;
    updateTimerSetupDisplay();
    updateTimerRunDisplay(0);
    btnTimerStartStop.textContent = 'Start';
    btnTimerStartStop.classList.remove('bg-red-500', 'bg-blue-500');
    btnTimerStartStop.classList.add('bg-green-500');
}

/***********************************************
 * Alarm
 ***********************************************/
const alarmAudio = document.getElementById('alarm-audio');
let alarmTimeout = null;

function playAlarm() {
    stopAlarm();
    alarmAudio.currentTime = 0;
    alarmAudio.play().catch(() => { });
    alarmTimeout = setTimeout(() => {
        stopAlarm();
    }, 15000);
}

function stopAlarm() {
    if (!alarmAudio.paused) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
    }
    if (alarmTimeout) {
        clearTimeout(alarmTimeout);
        alarmTimeout = null;
    }
}

document.body.addEventListener('click', (e) => {
    if (!alarmAudio.paused) {
        stopAlarm();
    }
}, true);

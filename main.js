import State from './state.js';
import Constants from './constants.js'
import Player from './player.js'
import Canvas from './canvas.js';
import { EventHandlers } from './event-handlers.js';
import { UIHelpers } from './ui-helpers.js';
import { LevelManager } from './level-manager.js';
import { AuthService } from './auth-service.js';
import { ReplayRecorder } from './replay-recorder.js';

let canvas = new Canvas()
let player = new Player()

// Make player and LevelManager globally accessible
window.player = player;
window.LevelManager = LevelManager;
window.ReplayRecorder = ReplayRecorder;

// Load images
Constants.githubImg.src = 'github.png';
Constants.openLockImg.src = 'open_lock.png';
Constants.closedLockImg.src = 'closed_lock.png';

// Initialize
AuthService.init();
EventHandlers.setupKeyboardEvents();
EventHandlers.setupBrowserEvents();
EventHandlers.setupCanvasEvents(canvas);
LevelManager.loadLevelsFromStorage();
LevelManager.loadPlayerColors();
LevelManager.loadLevelCompletions();

function gameLoop(time) {
    canvas.resize()
    canvas.ctx.globalAlpha = 1;
    canvas.ctx.fillStyle = Constants.WHITE;
    canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

    const titleControls = document.getElementById('titleControls');
    if (titleControls) titleControls.style.display = State.showTitleScreen ? 'block' : 'none';
    
    if (State.showTitleScreen) {
        UIHelpers.drawTitleScreen(canvas.ctx);
    } else if (State.showCustomizationScreen) {
        UIHelpers.drawCustomizationScreen(canvas.ctx);
    } else if (State.showCreditsScreen) {
        UIHelpers.drawCreditsScreen(canvas.ctx);
    } else if (State.showSignInScreen) {
        UIHelpers.drawSignInScreen(canvas.ctx);
    } else if (State.showLevelsScreen) {
        UIHelpers.drawLevelsScreen(canvas.ctx);
    } else if (State.showCompletionScreen) {
        UIHelpers.drawCompletionScreen(canvas.ctx);
    } else if (State.showDeathScreen) {
        UIHelpers.drawDeathScreen(canvas.ctx);
    } else {
        UIHelpers.updateEditorUI();
        UIHelpers.drawBlocks(canvas.ctx);
        
        if (!State.editorMode) {
            if (State.isRunning) {
                if (State.levelStartTime === 0) {
                    State.levelStartTime = Date.now();
                    ReplayRecorder.start();
                }
                ReplayRecorder.recordFrame(); // Record frame for anti-cheat
                player.update();
            }
            player.draw(canvas.ctx);
        }
        
        UIHelpers.drawHUD(canvas.ctx);
    }
    
    requestAnimationFrame(gameLoop)
}

// Global functions
window.onLevelComplete = () => {
    if (State.levelCompleted) return;
    State.levelCompleted = true;
    State.isRunning = false;
    State.showCompletionScreen = true;
    State.completionTime = ((Date.now() - State.levelStartTime) / 1000).toFixed(2);
    
    const key = `level_${State.currentLevelIndex}`;
    State.levelCompletions[key] = true;
    localStorage.setItem('platformer_completions', JSON.stringify(State.levelCompletions));
    
    // Submit to leaderboard
    if (State.currentUser) {
        import('./leaderboard-service.js').then(({ LeaderboardService }) => {
            LeaderboardService.submitScore(State.currentLevelIndex, parseFloat(State.completionTime), State.jumpCount, ReplayRecorder.getReplay());
        });
    }
};

window.onPlayerKilled = () => {
    State.isRunning = false;
    State.showDeathScreen = true;
    State.deathTime = ((Date.now() - State.levelStartTime) / 1000).toFixed(2);
};

requestAnimationFrame(gameLoop)
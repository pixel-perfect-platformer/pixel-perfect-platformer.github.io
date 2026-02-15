import State from './state.js';
import Constants from './constants.js';
import Player from './player.js';
import Canvas from './canvas.js';
import { FirebaseService } from './firebase-service.js';
import { EventHandlers } from './event-handlers.js';
import { UIHelpers } from './ui-helpers.js';
import { LevelManager } from './level-manager.js';
import { UIScreens } from './ui-screens.js';

const canvas = new Canvas();
const firebaseService = new FirebaseService();
let player = null;

// Initialize
EventHandlers.setupKeyboardEvents();
EventHandlers.setupBrowserEvents();
EventHandlers.setupCanvasEvents(canvas);

// Game loop
function gameLoop() {
    canvas.resize();
    canvas.ctx.globalAlpha = 1;
    canvas.ctx.fillStyle = Constants.WHITE;
    canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

    const titleControls = document.getElementById('titleControls');
    if (titleControls) titleControls.style.display = State.showTitleScreen ? 'block' : 'none';
    
    if (State.showTitleScreen) {
        UIScreens.drawTitleScreen(canvas.ctx, canvas, () => EventHandlers.fadeInMusic(), () => EventHandlers.fadeOutMusic(), () => UIHelpers.showLevelMenu());
        requestAnimationFrame(gameLoop);
        return;
    } else if (State.showCustomizationScreen) {
        UIScreens.drawCustomizationScreen(canvas.ctx, canvas);
        requestAnimationFrame(gameLoop);
        return;
    } else if (State.showCreditsScreen) {
        UIScreens.drawCreditsScreen(canvas.ctx, canvas);
        requestAnimationFrame(gameLoop);
        return;
    } else if (State.showSignInScreen) {
        UIScreens.drawSignInScreen(canvas.ctx, canvas);
        requestAnimationFrame(gameLoop);
        return;
    } else if (State.showCompletionScreen) {
        UIScreens.drawCompletionScreen(canvas.ctx, canvas, drawBlocks);
        requestAnimationFrame(gameLoop);
        return;
    } else if (State.showDeathScreen) {
        UIScreens.drawDeathScreen(canvas.ctx, canvas, drawBlocks);
        requestAnimationFrame(gameLoop);
        return;
    }
    
    updateEditorUI();
    drawBlocks(canvas.ctx);

    if (!State.editorMode) {
        if (State.isRunning) {
            if (State.levelStartTime === 0) State.levelStartTime = Date.now();
            player.update();
        }
        player.draw(canvas.ctx);
    }

    drawHUD(canvas.ctx);
    requestAnimationFrame(gameLoop);
}

function drawBlocks(ctx) {
    const barHeight = 100;
    canvas.ctx.fillStyle = '#808080';
    canvas.ctx.fillRect(0, Constants.SCREEN_HEIGHT - barHeight - 40, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

    for (let i = 0; i < State.blocks.length; i++) {
        const b = State.blocks[i];
        if (b.type === 'end') canvas.ctx.fillStyle = 'green';
        else if (b.type === 'kill') canvas.ctx.fillStyle = '#ff4500';
        else if (b.type === 'start') canvas.ctx.fillStyle = '#1e90ff';
        else canvas.ctx.fillStyle = '#666';
        canvas.ctx.fillRect(b.x, b.y, b.width, b.height);
        canvas.ctx.strokeStyle = '#333';
        canvas.ctx.strokeRect(b.x, b.y, b.width, b.height);
        if (State.selectedBlockIndex === i) {
            canvas.ctx.save();
            canvas.ctx.strokeStyle = 'yellow';
            canvas.ctx.lineWidth = 3;
            canvas.ctx.strokeRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
            canvas.ctx.restore();
        }
    }
    canvas.ctx.fillStyle = '#000';
    canvas.ctx.font = '12px sans-serif';
    for (let t of State.texts) canvas.ctx.fillText(t.text, t.x, t.y);
}

function drawHUD(ctx) {
    if (!State.showTitleScreen) {
        UIScreens.animateBackArrow(ctx, canvas, { value: State.isAnimatingBack }, { value: State.animationStartTimeBack });
    }

    if (!State.editorMode && !State.showLevelMenu && State.levels.length > 1 && !State.showTitleScreen) {
        const arrowY = 10, arrowSize = 30;
        const leftX = Constants.SCREEN_WIDTH - 100, rightX = Constants.SCREEN_WIDTH - 40;
        canvas.ctx.fillStyle = State.currentLevelIndex > 0 ? '#3498db' : '#7f8c8d';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(leftX + arrowSize, arrowY);
        canvas.ctx.lineTo(leftX, arrowY + arrowSize / 2);
        canvas.ctx.lineTo(leftX + arrowSize, arrowY + arrowSize);
        canvas.ctx.closePath();
        canvas.ctx.fill();
        canvas.ctx.fillStyle = State.currentLevelIndex < State.levels.length - 1 ? '#3498db' : '#7f8c8d';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(rightX, arrowY);
        canvas.ctx.lineTo(rightX + arrowSize, arrowY + arrowSize / 2);
        canvas.ctx.lineTo(rightX, arrowY + arrowSize);
        canvas.ctx.closePath();
        canvas.ctx.fill();
        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = '14px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText(`${State.currentLevelIndex + 1}/${State.levels.length}`, (leftX + rightX + arrowSize) / 2, arrowY + arrowSize / 2 + 5);
    }

    if (State.editorMode) {
        canvas.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        canvas.ctx.fillRect(70, 0, Constants.SCREEN_WIDTH, 35);
        canvas.ctx.fillStyle = '#ffff00';
        canvas.ctx.font = 'bold 20px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('EDITOR', Constants.SCREEN_WIDTH / 2, 24);
    }
}

function updateEditorUI() {
    const editorTools = document.getElementById('editorTools');
    if (editorTools) editorTools.style.display = State.editorMode ? 'block' : 'none';
    if (Constants.publishBtn) Constants.publishBtn.hidden = !State.editorMode;
    if (Constants.saveBtn) Constants.saveBtn.hidden = !State.editorMode;
    if (Constants.clearBtn) Constants.clearBtn.hidden = !State.editorMode;
}

window.onLevelComplete = function() {
    if (State.levelCompleted) return;
    State.levelCompleted = true;
    State.isRunning = false;
    State.showCompletionScreen = true;
    const key = `level_${State.currentLevelIndex}`;
    State.levelCompletions[key] = true;
    localStorage.setItem('platformer_completions', JSON.stringify(State.levelCompletions));
};

// Initialize and start
player = new Player();
LevelManager.loadLevelsFromStorage();
LevelManager.loadPlayerColors();
LevelManager.loadLevelCompletions();
requestAnimationFrame(gameLoop);

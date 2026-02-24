import State from './state.js';
import Constants from './constants.js';
import Canvas from './canvas.js';
class Input {
    static upPressed = false;
    static leftPressed = false;
    static rightPressed = false;
    // Jump input buffering: `jumpBuffered` is true while ArrowUp is held.
    // `jumpUsed` prevents repeated jumps while the key remains held.
    static jumpBuffered = false;
    static jumpUsed = false;
    constructor() {
        document.addEventListener('keydown', (e) => {
            if (e.code == 'ArrowUp' || e.code == 'KeyW' || e.code == 'Space') {
                State.upPressed = true;
                State.jumpBuffered = true;
                // If on title screen, Space starts the game
                if (State.showTitleScreen && e.code == 'Space') {
                    e.preventDefault();
                    State.showTitleScreen = false;
                    State.isRunning = true;
                    return;
                }
            } else if (e.code == 'ArrowLeft' || e.code == 'KeyA') {
                State.leftPressed = true;
            } else if (e.code == 'ArrowRight' || e.code == 'KeyD') {
                State.rightPressed = true;
            } else if (e.code == 'Escape') {
                if (!State.showTitleScreen && !State.isAnimating && !State.isAnimatingEditor && !State.isAnimatingBack) {
                    if (State.editorMode && State.levels[State.currentLevelIndex]) {
                        State.levels[State.currentLevelIndex].blocks = window.LevelManager.cloneData(State.blocks);
                        State.levels[State.currentLevelIndex].texts = window.LevelManager.cloneData(State.texts);
                        window.LevelManager?.saveLevelsToStorage();
                    }                    State.isRunning = false;
                    State.editorMode = false;
                    if (Constants.startBtn) Constants.startBtn.style.display = 'none';
                    if (Constants.editorBtn) Constants.editorBtn.style.display = 'none';
                    if (!State.isAnimatingBack) {
                        State.isAnimatingBack = true;
                        State.animationStartTimeBack = Date.now();
                    }
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code == 'ArrowUp' || e.code == 'KeyW' || e.code == 'Space') {
                State.upPressed = false;
                State.jumpBuffered = false;
                Input.jumpUsed = false; // allow next press to jump
            } else if (e.code == 'ArrowLeft' || e.code == 'KeyA') {
                State.leftPressed = false;
            } else if (e.code == 'ArrowRight' || e.code == 'KeyD') {
                State.rightPressed = false;
            }
        });

        // touch support: treat touchstart like mousedown and touchend like mouseup
        canvas.canvas.addEventListener('touchstart', (e) => {
            const p = canvasToGameCoords(e.touches[0]);
            // Handle back arrow for touch
            if (!State.showTitleScreen && window._isBackArrowAtPos && window._isBackArrowAtPos(p.x, p.y) && !State.isAnimating && !State.isAnimatingEditor && !State.isAnimatingBack) {
                if (State.editorMode && State.levels[State.currentLevelIndex]) {
                    State.levels[State.currentLevelIndex].blocks = window.LevelManager.cloneData(State.blocks);
                    State.levels[State.currentLevelIndex].texts = window.LevelManager.cloneData(State.texts);
                    window.LevelManager?.saveLevelsToStorage();
                }                State.isRunning = false;
                State.editorMode = false;
                State.showCustomizationScreen = false;
                State.showTitleScreen = true;
                // push title state back
                history.pushState({ screen: 'title' }, '', '');
                if (Constants.startBtn) Constants.startBtn.style.display = 'none';
                if (Constants.editorBtn) Constants.editorBtn.style.display = 'none';
                if (!Constants.isAnimatingBack) {
                    Constants.isAnimatingBack = true;
                    Constants.animationStartTimeBack = Date.now();
                }
                e.preventDefault();
                return;
            }
            if (State.showTitleScreen) { const btn = getTitleScreenButtonAtPos(p.x, p.y); if (btn) State.pressedTitleButton = btn; }
        }, { passive: false });
        canvas.canvas.addEventListener('touchend', (e) => { if (!State.pressedTitleButton) return; const touch = (e.changedTouches && e.changedTouches[0]); if (!touch) { State.pressedTitleButton = null; return; } const p = canvasToGameCoords(touch); const btn = getTitleScreenButtonAtPos(p.x, p.y); if (btn === State.pressedTitleButton) { if (btn === 'play' && !State.isAnimating) { State.isAnimating = true; State.animationStartTime = Date.now(); } else if (btn === 'editor' && !State.isAnimatingEditor) { State.isAnimatingEditor = true; State.animationStartTimeEditor = Date.now(); } else if (btn === 'issues') { window.open('https://github.com/pixel-perfect-platformer/pixel-perfect-platformer.github.io/issues', '_blank'); } } State.pressedTitleButton = null; }, { passive: false });

        // Touch support for customization screen
        canvas.canvas.addEventListener('touchstart', (e) => {
            if (!State.showCustomizationScreen) return;
            const p = canvasToGameCoords(e.touches[0]);
            // Handle customization screen touches
            const colors = [
                { name: 'Black', color: '#000000' },
                { name: 'Red', color: '#ff0000' },
                { name: 'Blue', color: '#0000ff' },
                { name: 'Green', color: '#00ff00' },
                { name: 'Yellow', color: '#ffff00' },
                { name: 'Purple', color: '#800080' },
                { name: 'Orange', color: '#ffa500' },
                { name: 'Pink', color: '#ffc0cb' }
            ];

            const buttonWidth = 60;
            const buttonHeight = 30;
            const spacing = 10;
            const colorsPerRow = 4;
            const startX = (Constants.SCREEN_WIDTH - (colorsPerRow * (buttonWidth + spacing) - spacing)) / 2;
            const startY = 120;
            const rowSpacing = 50;

            // Check color buttons
            for (let i = 0; i < colors.length; i++) {
                const row = Math.floor(i / colorsPerRow);
                const col = i % colorsPerRow;
                const x = startX + col * (buttonWidth + spacing);
                const y = startY + row * rowSpacing;
                if (p.x >= x && p.x <= x + buttonWidth && p.y >= y && p.y <= y + buttonHeight) {
                    State.currentPlayerColor = colors[i].color;
                    State.showCustomizationScreen = false;
                    State.showTitleScreen = true;
                    return;
                }
            }

            // Check back button
            const backX = Constants.SCREEN_WIDTH / 2 - 50;
            const backY = Constants.SCREEN_HEIGHT - 80;
            const backWidth = 100;
            const backHeight = 40;
            if (p.x >= backX && p.x <= backX + backWidth && p.y >= backY && p.y <= backY + backHeight) {
                State.showCustomizationScreen = false;
                State.showTitleScreen = true;
            }
        }, { passive: false });




        // Right-click to add text box
        canvas.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!State.editorMode) return;
            const p = canvasToGameCoords(e);
            const text = prompt('Enter text:');
            if (text) {
                addTextAt(p.x, p.y, text);
                saveCurrentLevel();
            }
        });

        // Double-click a placed text to edit or remove it
        canvas.canvas.addEventListener('dblclick', (e) => {
            if (!State.editorMode) return;
            const p = canvasToGameCoords(e);
            const ti = findTextAt(p.x, p.y);
            if (ti < 0) return;
            const current = State.texts[ti].text;
            const edited = prompt('Edit text (leave empty to delete):', current);
            if (edited === null) return; // cancelled
            const trimmed = (edited || '').trim();
            if (trimmed === '') {
                State.texts.splice(ti, 1);
            } else {
                State.texts[ti].text = trimmed;
            }
            saveCurrentLevel();
        });
        
        // Block type selector
        Constants.blockTypeSelect.addEventListener('change', (e) => {
            State.currentBlockType = e.target.value;
        });



    }
}
export default Input;

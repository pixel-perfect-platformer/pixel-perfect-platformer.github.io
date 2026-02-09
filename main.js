import State from './state.js';
import Constants from './constants.js'
import Player from './player.js'
import Input from './input.js'
import Canvas from './canvas.js';
let canvas = new Canvas()

// Load GitHub logo image
const githubLogo = new Image();
githubLogo.src = 'github.png';

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
            State.isRunning = false;
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

function bindButtonAction(el, action) {
    if (!el) return;

    let pressed = false;

    const addPressed = (ev) => {
        pressed = true;
        el.classList.add('pressed');
        ev.preventDefault();
    };

    const clearPressed = () => {
        pressed = false;
        el.classList.remove('pressed');
    };

    const release = (ev) => {
        if (!pressed) return;          // only if it started on this button
        clearPressed();

        // Only trigger action if the pointer/touch ends still on the button
        const rect = el.getBoundingClientRect();
        const x = ev.changedTouches ? ev.changedTouches[0].clientX : ev.clientX;
        const y = ev.changedTouches ? ev.changedTouches[0].clientY : ev.clientY;

        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            try {
                action(ev);
            } catch (e) {
                console.error(e);
            }
        }
    };

    el.addEventListener('mousedown', addPressed);
    el.addEventListener('touchstart', addPressed, { passive: false });

    el.addEventListener('mouseup', release);
    el.addEventListener('touchend', release);

    el.addEventListener('mouseleave', clearPressed);
    el.addEventListener('touchcancel', clearPressed);
}


// Non-blocking status helper (replaces alerts)
function showStatus(msg, ms = 1800) {
    if (Constants.editorHint) Constants.editorHint.textContent = msg;
    clearTimeout(showStatus._t);
}

// Music fade out function
function fadeOutMusic(duration = 1000) {
    if (!Constants.titleMusic || Constants.titleMusic.paused) return;
    
    const startVolume = Constants.titleMusic.volume || 1;
    const fadeStep = startVolume / (duration / 50); // 50ms intervals
    
    const fadeInterval = setInterval(() => {
        if (Constants.titleMusic.volume > fadeStep) {
            Constants.titleMusic.volume -= fadeStep;
        } else {
            Constants.titleMusic.volume = 0;
            Constants.titleMusic.pause();
            Constants.titleMusic.volume = startVolume; // Reset for next play
            clearInterval(fadeInterval);
        }
    }, 50);
}

// Music fade in function
function fadeInMusic(duration = 1000) {
    if (!Constants.titleMusic) return;
    
    const targetVolume = 1;
    const fadeStep = targetVolume / (duration / 50); // 50ms intervals
    
    Constants.titleMusic.volume = 0;
    Constants.titleMusic.play().catch(e => console.log('Music autoplay blocked:', e));
    
    const fadeInterval = setInterval(() => {
        if (Constants.titleMusic.volume < targetVolume - fadeStep) {
            Constants.titleMusic.volume += fadeStep;
        } else {
            Constants.titleMusic.volume = targetVolume;
            clearInterval(fadeInterval);
        }
    }, 50);
}



// Push dummy state and initial title state for back button support
history.pushState(null, '', '');
history.pushState({ screen: 'title' }, '', '');
console.log('Initial states pushed for back button support');

// Fade out music when tab loses focus
document.addEventListener('visibilitychange', () => {
    if (document.hidden && Constants.titleMusic && !Constants.titleMusic.paused) {
        fadeOutMusic(500);
    } else if (!document.hidden && State.showTitleScreen && Constants.titleMusic && Constants.titleMusic.paused) {
        fadeInMusic(500);
    }
});

// Handle browser back button
window.addEventListener('popstate', (e) => {
    console.log('Popstate event fired, state:', e.state, 'showTitleScreen:', Constants.showTitleScreen);
    if (!Constants.showTitleScreen) {
        console.log('Browser back button pressed, returning to title screen');
        // do back action
        State.isRunning = false;
        State.editorMode = false;
        State.showCustomizationScreen = false;
        State.showCreditsScreen = false;
        Constants.showTitleScreen = true;
        // Reset title screen button states
        State.pressedTitleButton = null;
        State.titleButtonIsDown = false;
        State.isAnimating = false;
        State.isAnimatingEditor = false;
        State.isAnimatingCustomize = false;
        State.isAnimatingCredits = false;
        State.isAnimatingBack = false;
        State.fadeOpacity = 1;
        // push title state back to prevent going back further
        history.pushState({ screen: 'title' }, '', '');
    }
});





let player = null;


function gameLoop(time) {
    canvas.resize()
    // Reset global alpha
    canvas.ctx.globalAlpha = 1;
    // Clear screen
    canvas.ctx.fillStyle = Constants.WHITE;
    canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

    // Show/hide title controls
    const titleControls = document.getElementById('titleControls');
    if (titleControls) titleControls.style.display = State.showTitleScreen ? 'block' : 'none';
    if (State.showTitleScreen) {
        drawTitleScreen(canvas.ctx);
        requestAnimationFrame(gameLoop);
        return;
    } else if (State.showCustomizationScreen) {
        drawCustomizationScreen(canvas.ctx);
        requestAnimationFrame(gameLoop);
        return;
    } else if (State.showCreditsScreen) {
        drawCreditsScreen(canvas.ctx);
        requestAnimationFrame(gameLoop);
        return;
    }
    
    updateEditorUI();
    // Draw blocks
    drawBlocks(canvas.ctx);

        // Player exists and is active only when NOT in editor mode
        if (!State.editorMode) {
            if (State.isRunning) {
                player.update();
            }
            player.draw(canvas.ctx);
        }

        // Frame-level check for touching an end block (robust against missed checks)
        if (State.isRunning && !State.levelCompleted) {
            for (let b of State.blocks) {
                if ((b.type === 'end' || b.end === true) && player.x <= b.x + b.width && player.x + player.width >= b.x && player.y <= b.y + b.height && player.y + player.height >= b.y) {
                    State.levelCompleted = true;
                    onLevelComplete();
                    break;
                }
                if ((b.type === 'kill' || b.kill === true) && player.x <= b.x + b.width && player.x + player.width >= b.x && player.y <= b.y + b.height && player.y + player.height >= b.y) {
                    onPlayerKilled();
                    break;
                }
            }
        }

    // Draw editor HUD
    drawHUD(canvas.ctx);
    requestAnimationFrame(gameLoop)
}
player = new Player()
loadLevelsFromStorage();
loadPlayerColors();
requestAnimationFrame(gameLoop)

// --- Editor & UI functions ---
// Helper: draw rounded rectangle path (doesnot fill/stroke)
function roundRectPath(ctx, x, y, w, h, r) {
    canvas.ctx.beginPath();
    canvas.ctx.moveTo(x + r, y);
    canvas.ctx.lineTo(x + w - r, y);
    canvas.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    canvas.ctx.lineTo(x + w, y + h - r);
    canvas.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    canvas.ctx.lineTo(x + r, y + h);
    canvas.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    canvas.ctx.lineTo(x, y + r);
    canvas.ctx.quadraticCurveTo(x, y, x + r, y);
    canvas.ctx.closePath();
}

function drawButtonIcon(ctx, buttonType, buttonX, buttonY) {
    if (buttonType === 'play') {
        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(buttonX - 12, buttonY - 18);
        canvas.ctx.lineTo(buttonX - 12, buttonY + 18);
        canvas.ctx.lineTo(buttonX + 20, buttonY);
        canvas.ctx.closePath();
        canvas.ctx.fill();
    } else if (buttonType === 'editor') {
        const brickCols = [3, 2, 3, 2, 3];
        const rows = brickCols.length;
        const brickW = 18;
        const brickH = 10;
        const gap = 3;
        const totalH = rows * brickH + (rows - 1) * gap;
        const topY = buttonY - Math.floor(totalH / 2);

        canvas.ctx.lineWidth = 3;
        for (let r = 0; r < rows; r++) {
            const cols = brickCols[r];
            const rowW = cols * brickW + (cols - 1) * gap;
            const y = topY + r * (brickH + gap);
            const startX = buttonX - rowW / 2;

            canvas.ctx.save();
            canvas.ctx.fillStyle = '#d9d9d9';
            roundRectPath(ctx, startX - gap / 2, y - gap / 2, rowW + gap, brickH + gap, 3);
            canvas.ctx.fill();
            canvas.ctx.restore();

            for (let c = 0; c < cols; c++) {
                const x = startX + c * (brickW + gap);

                canvas.ctx.save();
                canvas.ctx.shadowColor = 'rgba(0,0,0,0.55)';
                canvas.ctx.shadowBlur = 12;
                canvas.ctx.shadowOffsetY = 3;

                canvas.ctx.fillStyle = '#c0392b';
                canvas.ctx.strokeStyle = '#050505';
                roundRectPath(ctx, x, y, brickW, brickH, 2);
                canvas.ctx.fill();
                canvas.ctx.stroke();
                canvas.ctx.restore();

                canvas.ctx.fillStyle = '#ffd3c2';
                canvas.ctx.fillRect(x + 3, y + 2, brickW - 6, brickH - 5);
            }
        }
    }
}

function animateButton(ctx, buttonX, buttonY, buttonRadius, animatingRef, startTimeRef, buttonType) {
    if (animatingRef.value) {
        const progress = Math.min((Date.now() - startTimeRef.value) / Constants.animationDuration, 1);
        let scale = 1;
        let shakeOffset = 0;
        if (progress < 0.25) {
            const p = progress / 0.25;
            if (p < 0.5) {
                scale = 1 + p * 1; // 1 to 1.5
            } else {
                scale = 1.5 - (p - 0.5) * 2; // 1.5 to 0.5
            }
        } else if (progress < 0.5) {
            shakeOffset = Math.sin((progress - 0.25) * 40) * 5;
        } else if (progress > 0.75) {
            State.fadeOpacity = (progress - 0.75) / 0.25;
            canvas.ctx.globalAlpha = 1 - State.fadeOpacity;
        }
        if (progress >= 1) {
            animatingRef.value = false;
            if (State.showTitleScreen) {
                if (buttonType === 'play') {
                    State.showTitleScreen = false;
                    State.isRunning = true;
                    State.isAnimating = false;
                    State.isAnimatingEditor = false;
                    if (Constants.titleMusic) fadeOutMusic();
                    history.pushState({ screen: 'game' }, '', '');
                } else if (buttonType === 'editor') {
                    State.showTitleScreen = false;
                    State.editorMode = true;
                    State.isAnimating = false;
                    State.isAnimatingEditor = false;
                    if (Constants.titleMusic) fadeOutMusic();
                    history.pushState({ screen: 'game' }, '', '');
                }
            }
            State.fadeOpacity = 1;
            return;
        }


        canvas.ctx.save();
        canvas.ctx.translate(buttonX, buttonY);
        canvas.ctx.scale(scale, scale);
        canvas.ctx.translate(-buttonX, -buttonY);
        canvas.ctx.translate(shakeOffset, 0);

        canvas.ctx.fillStyle = buttonType === 'play' ? 'rgba(255, 100, 0, 0.3)' : 'rgba(0, 200, 255, 0.3)';
        canvas.ctx.beginPath();
        canvas.ctx.arc(buttonX, buttonY, buttonRadius + 15, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = buttonType === 'play' ? '#ff6600' : '#00ccff';
        canvas.ctx.beginPath();
        canvas.ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
        canvas.ctx.fill();

        drawButtonIcon(ctx, buttonType, buttonX, buttonY);

        canvas.ctx.restore();
    } else {
        canvas.ctx.fillStyle = buttonType === 'play' ? 'rgba(255, 100, 0, 0.3)' : 'rgba(0, 200, 255, 0.3)';
        canvas.ctx.beginPath();
        canvas.ctx.arc(buttonX, buttonY, buttonRadius + 15, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = buttonType === 'play' ? '#ff6600' : '#00ccff';
        canvas.ctx.beginPath();
        canvas.ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
        canvas.ctx.fill();

        drawButtonIcon(ctx, buttonType, buttonX, buttonY);
    }
}

function animateBackArrow(ctx, animatingRef, startTimeRef) {
    const bx = 10, by = 10, bw = 60, bh = 40, br = 6;
    if (animatingRef.value) {
        const progress = Math.min((Date.now() - startTimeRef.value) / Constants.animationDuration, 1);
        let scale = 1;
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        if (progress < 0.25) {
            const p = progress / 0.25;
            if (p < 0.5) {
                scale = 1 + p * 1; // 1 to 1.5
            } else {
                scale = 1.5 - (p - 0.5) * 2; // 1.5 to 0.5
            }
        } else if (progress < 0.5) {
            shakeOffsetX = Math.sin((progress - 0.25) * 40) * 5;
            shakeOffsetY = Math.cos((progress - 0.25) * 40) * 3;
        } else if (progress > 0.75) {
            State.fadeOpacity = (progress - 0.75) / 0.25;
            canvas.ctx.globalAlpha = 1 - State.fadeOpacity;
        }
        if (progress >= 1) {
            animatingRef.value = false;
            State.isAnimatingBack = false;
            State.showTitleScreen = true;
            State.showCustomizationScreen = false;
            State.showCreditsScreen = false;
            State.editorMode = false;
            if (Constants.editorBtn) Constants.editorBtn.textContent = 'Enter Editor';
            State.isPainting = false;
            State.dragging = false;
            State.draggingTextIndex = -1;
            // Stop any ongoing button animations
            State.isAnimating = false;
            State.isAnimatingEditor = false;
            State.isAnimatingCustomize = false;
            // Reset title screen button states
            State.pressedTitleButton = null;
            State.titleButtonIsDown = false;
            State.fadeOpacity = 1;
            if (Constants.titleMusic) Constants.titleMusic.currentTime = 0;
            return;
        }

        canvas.ctx.save();
        const centerX = bx + bw / 2;
        const centerY = by + bh / 2;
        canvas.ctx.translate(centerX, centerY);
        canvas.ctx.scale(scale, scale);
        canvas.ctx.translate(-centerX, -centerY);
        canvas.ctx.translate(shakeOffsetX, shakeOffsetY);

        // Glow
        canvas.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        roundRectPath(ctx, bx - 10, by - 10, bw + 20, bh + 20, br + 5);
        canvas.ctx.fill();

        // Draw animated back arrow
        canvas.ctx.save();
        canvas.ctx.shadowColor = 'rgba(0,0,0,0.45)';
        canvas.ctx.shadowBlur = 8;
        canvas.ctx.shadowOffsetY = 3;
        canvas.ctx.fillStyle = '#19a819';
        roundRectPath(ctx, bx, by, bw, bh, br);
        canvas.ctx.fill();
        canvas.ctx.restore();
        // arrow triangle
        canvas.ctx.fillStyle = '#e8ffe8';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(bx + 15, by + bh / 2);
        canvas.ctx.lineTo(bx + bw - 15, by + 8);
        canvas.ctx.lineTo(bx + bw - 15, by + bh - 8);
        canvas.ctx.closePath();
        canvas.ctx.fill();

        canvas.ctx.restore();
    } else {
        // Draw normal back arrow
        canvas.ctx.save();
        canvas.ctx.shadowColor = 'rgba(0,0,0,0.45)';
        canvas.ctx.shadowBlur = 8;
        canvas.ctx.fillStyle = '#19a819';
        roundRectPath(ctx, bx, by, bw, bh, br);
        canvas.ctx.fill();
        canvas.ctx.restore();
        // arrow triangle
        canvas.ctx.fillStyle = '#e8ffe8';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(bx + 15, by + bh / 2);
        canvas.ctx.lineTo(bx + bw - 15, by + 8);
        canvas.ctx.lineTo(bx + bw - 15, by + bh - 8);
        canvas.ctx.closePath();
        canvas.ctx.fill();
    }
}
function drawTitleScreen(ctx) {
    canvas.ctx.globalAlpha = 1; // ensure alpha is reset for title screen
    console.log("Drawing title screen, isAnimating:", State.isAnimating, "isAnimatingEditor:", State.isAnimatingEditor)
    
    // Play title music
    if (Constants.titleMusic && Constants.titleMusic.paused) {
        fadeInMusic();
    }




    // Gradient background (purple to blue)
    const gradient = canvas.ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
    gradient.addColorStop(0, '#1a0033');
    gradient.addColorStop(0.5, '#330066');
    gradient.addColorStop(1, '#004d99');
    canvas.ctx.fillStyle = gradient;
    canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

    // Animated geometric background elements
    const time = Date.now() * 0.001;

    // Floating circles
    canvas.ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
    canvas.ctx.beginPath();
    canvas.ctx.arc(100 + Math.sin(time) * 20, 100 + Math.cos(time * 0.7) * 30, 40, 0, Math.PI * 2);
    canvas.ctx.fill();

    canvas.ctx.fillStyle = 'rgba(0, 200, 255, 0.1)';
    canvas.ctx.beginPath();
    canvas.ctx.arc(400 + Math.cos(time * 1.3) * 25, 80 + Math.sin(time * 0.9) * 35, 60, 0, Math.PI * 2);
    canvas.ctx.fill();

    // Title
    canvas.ctx.fillStyle = '#ffff00';
    canvas.ctx.font = 'bold 56px Arial';
    canvas.ctx.textAlign = 'center';
    canvas.ctx.fillText('PLATFORMER', Constants.SCREEN_WIDTH / 2, 120);

    // Play button (orange circle with play icon) - Top Left
    const playX = Constants.SCREEN_WIDTH / 4;
    const playY = Constants.SCREEN_HEIGHT / 2 - 50;
    const playRadius = 40;

    // Editor button (cyan circle with pencil icon) - Top Right
    const editorX = 3 * Constants.SCREEN_WIDTH / 4;
    const editorY = Constants.SCREEN_HEIGHT / 2 - 50;
    const editorRadius = 40;


    // Animate and draw play button
    animateButton(ctx, playX, playY, playRadius, { value: State.isAnimating }, { value: State.animationStartTime }, 'play');

    // Animate and draw editor button
    animateButton(ctx, editorX, editorY, editorRadius, { value: State.isAnimatingEditor }, { value: State.animationStartTimeEditor }, 'editor');

    // Customize button (green circle with gear icon) - Bottom Left
    const customizeX = Constants.SCREEN_WIDTH / 4;
    const customizeY = Constants.SCREEN_HEIGHT / 2 + 50;
    const customizeRadius = 40;

    // Animate and draw customize button
    if (State.isAnimatingCustomize) {
        const progress = Math.min((Date.now() - State.animationStartTimeCustomize) / Constants.animationDuration, 1);
        let scale = 1;
        let shakeOffset = 0;
        if (progress < 0.25) {
            const p = progress / 0.25;
            scale = p < 0.5 ? 1 + p * 1 : 1.5 - (p - 0.5) * 2;
        } else if (progress < 0.5) {
            shakeOffset = Math.sin((progress - 0.25) * 40) * 5;
        } else if (progress > 0.75) {
            State.fadeOpacity = (progress - 0.75) / 0.25;
            canvas.ctx.globalAlpha = 1 - State.fadeOpacity;
        }
        if (progress >= 1) {
            State.isAnimatingCustomize = false;
            State.showTitleScreen = false;
            State.showCustomizationScreen = true;
            if (Constants.titleMusic) fadeOutMusic();
            State.fadeOpacity = 1;
            return;
        }

        canvas.ctx.save();
        canvas.ctx.translate(customizeX, customizeY);
        canvas.ctx.scale(scale, scale);
        canvas.ctx.translate(-customizeX, -customizeY);
        canvas.ctx.translate(shakeOffset, 0);

        canvas.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        canvas.ctx.beginPath();
        canvas.ctx.arc(customizeX, customizeY, customizeRadius + 15, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#00ff00';
        canvas.ctx.beginPath();
        canvas.ctx.arc(customizeX, customizeY, customizeRadius, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = 'bold 20px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('⚙', customizeX, customizeY + 7);

        canvas.ctx.restore();
    } else {
        canvas.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        canvas.ctx.beginPath();
        canvas.ctx.arc(customizeX, customizeY, customizeRadius + 10, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#00ff00';
        canvas.ctx.beginPath();
        canvas.ctx.arc(customizeX, customizeY, customizeRadius, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = 'bold 20px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('⚙', customizeX, customizeY + 7);
    }

    // Credits button (gold circle with star icon) - Center Bottom
    const creditsX = Constants.SCREEN_WIDTH / 2;
    const creditsY = Constants.SCREEN_HEIGHT / 2 + 120;
    const creditsRadius = 40;

    // Credits button animation
    if (State.isAnimatingCredits) {
        const progress = Math.min((Date.now() - State.animationStartTimeCredits) / Constants.animationDuration, 1);
        let scale = 1;
        let shakeOffset = 0;
        if (progress < 0.25) {
            const p = progress / 0.25;
            scale = p < 0.5 ? 1 + p * 1 : 1.5 - (p - 0.5) * 2;
        } else if (progress < 0.5) {
            shakeOffset = Math.sin((progress - 0.25) * 40) * 5;
        } else if (progress > 0.75) {
            State.fadeOpacity = (progress - 0.75) / 0.25;
            canvas.ctx.globalAlpha = 1 - State.fadeOpacity;
        }
        if (progress >= 1) {
            State.isAnimatingCredits = false;
            State.showTitleScreen = false;
            State.showCreditsScreen = true;
            if (Constants.titleMusic) fadeOutMusic();
            State.fadeOpacity = 1;
            return;
        }

        canvas.ctx.save();
        canvas.ctx.translate(creditsX, creditsY);
        canvas.ctx.scale(scale, scale);
        canvas.ctx.translate(-creditsX, -creditsY);
        canvas.ctx.translate(shakeOffset, 0);

        canvas.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        canvas.ctx.beginPath();
        canvas.ctx.arc(creditsX, creditsY, creditsRadius + 15, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#ffd700';
        canvas.ctx.beginPath();
        canvas.ctx.arc(creditsX, creditsY, creditsRadius, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = 'bold 20px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('⭐', creditsX, creditsY + 7);

        canvas.ctx.restore();
    } else {
        // Draw normal credits button
        canvas.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        canvas.ctx.beginPath();
        canvas.ctx.arc(creditsX, creditsY, creditsRadius + 10, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#ffd700';
        canvas.ctx.beginPath();
        canvas.ctx.arc(creditsX, creditsY, creditsRadius, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = 'bold 20px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('⭐', creditsX, creditsY + 7);
    }

    // Issues button (purple circle with bug icon) - Bottom Right
    const issuesX = 3 * Constants.SCREEN_WIDTH / 4;
    const issuesY = Constants.SCREEN_HEIGHT / 2 + 50;
    const issuesRadius = 40;
    // Button glow
    canvas.ctx.fillStyle = 'rgba(128, 0, 128, 0.3)';
    canvas.ctx.beginPath();
    canvas.ctx.arc(issuesX, issuesY, issuesRadius + 10, 0, Math.PI * 2);
    canvas.ctx.fill();
    // Button
    canvas.ctx.fillStyle = '#800080';
    canvas.ctx.beginPath();
    canvas.ctx.arc(issuesX, issuesY, issuesRadius, 0, Math.PI * 2);
    canvas.ctx.fill();
    // GitHub logo image
    if (githubLogo.complete) {
        const iconSize = 48;
        canvas.ctx.drawImage(githubLogo, issuesX - iconSize/2, issuesY - iconSize/2, iconSize, iconSize);
    }

    // Music credit
    canvas.ctx.fillStyle = '#ecf0f1';
    canvas.ctx.font = '10px Arial';
    canvas.ctx.fillText('Music: Scott Joplin / IE', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT - 10);

    canvas.ctx.globalAlpha = 1; // reset
}

function drawCustomizationScreen(ctx) {
    // Animated gradient background
    const time = Date.now() * 0.001;
    const gradient = canvas.ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(0.5, '#34495e');
    gradient.addColorStop(1, '#2c3e50');
    canvas.ctx.fillStyle = gradient;
    canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

    // Floating particles
    for (let i = 0; i < 5; i++) {
        const x = (i * 100 + time * 30) % Constants.SCREEN_WIDTH;
        const y = 50 + Math.sin(time + i) * 20;
        canvas.ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time + i) * 0.05})`;
        canvas.ctx.beginPath();
        canvas.ctx.arc(x, y, 3, 0, Math.PI * 2);
        canvas.ctx.fill();
    }

    // Draw back arrow
    animateBackArrow(ctx, { value: State.isAnimatingBack }, { value: State.animationStartTimeBack });

    // Title
    canvas.ctx.save();
    canvas.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    canvas.ctx.shadowBlur = 10;
    canvas.ctx.shadowOffsetY = 3;
    canvas.ctx.fillStyle = '#ecf0f1';
    canvas.ctx.font = 'bold 32px Arial';
    canvas.ctx.textAlign = 'center';
    canvas.ctx.fillText('Customize Player', Constants.SCREEN_WIDTH / 2, 60);
    canvas.ctx.restore();

    // Tabs
    const tabY = 80;
    const tabWidth = 100;
    const tabHeight = 35;
    const tabSpacing = 10;
    const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;

    // Inner color tab
    canvas.ctx.fillStyle = State.customizeColorMode === 'inner' ? '#3498db' : '#7f8c8d';
    roundRectPath(ctx, tabStartX, tabY, tabWidth, tabHeight, 5);
    canvas.ctx.fill();
    canvas.ctx.fillStyle = '#ffffff';
    canvas.ctx.font = 'bold 14px Arial';
    canvas.ctx.textAlign = 'center';
    canvas.ctx.fillText('Inner', tabStartX + tabWidth / 2, tabY + tabHeight / 2 + 5);

    // Outer color tab
    canvas.ctx.fillStyle = State.customizeColorMode === 'outer' ? '#3498db' : '#7f8c8d';
    roundRectPath(ctx, tabStartX + tabWidth + tabSpacing, tabY, tabWidth, tabHeight, 5);
    canvas.ctx.fill();
    canvas.ctx.fillStyle = '#ffffff';
    canvas.ctx.font = 'bold 14px Arial';
    canvas.ctx.fillText('Outer', tabStartX + tabWidth + tabSpacing + tabWidth / 2, tabY + tabHeight / 2 + 5);

    // Player preview (top right)
    const previewX = Constants.SCREEN_WIDTH - 80;
    const previewY = 80;
    const previewSize = 40;
    
    canvas.ctx.save();
    canvas.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    canvas.ctx.shadowBlur = 8;
    canvas.ctx.fillStyle = State.currentPlayerOuterColor;
    canvas.ctx.fillRect(previewX, previewY, previewSize, previewSize);
    canvas.ctx.fillStyle = State.currentPlayerColor;
    canvas.ctx.fillRect(previewX + 5, previewY + 5, previewSize - 10, previewSize - 10);
    canvas.ctx.restore();
    
    canvas.ctx.fillStyle = '#ecf0f1';
    canvas.ctx.font = '10px Arial';
    canvas.ctx.textAlign = 'center';
    canvas.ctx.fillText('Preview', previewX + previewSize / 2, previewY + previewSize + 15);

    // Color options
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

    const buttonWidth = 70;
    const buttonHeight = 70;
    const spacing = 15;
    const colorsPerRow = 4;
    const startX = (Constants.SCREEN_WIDTH - (colorsPerRow * (buttonWidth + spacing) - spacing)) / 2;
    const startY = 150;
    const rowSpacing = 90;

    const currentColor = State.customizeColorMode === 'inner' ? State.currentPlayerColor : State.currentPlayerOuterColor;

    for (let i = 0; i < colors.length; i++) {
        const row = Math.floor(i / colorsPerRow);
        const col = i % colorsPerRow;
        const x = startX + col * (buttonWidth + spacing);
        const y = startY + row * rowSpacing;

        const hoverScale = 1 + Math.sin(time * 2 + i) * 0.05;
        
        canvas.ctx.save();
        canvas.ctx.translate(x + buttonWidth / 2, y + buttonHeight / 2);
        canvas.ctx.scale(hoverScale, hoverScale);
        canvas.ctx.translate(-(x + buttonWidth / 2), -(y + buttonHeight / 2));

        canvas.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        canvas.ctx.shadowBlur = 8;
        canvas.ctx.shadowOffsetY = 4;

        canvas.ctx.fillStyle = colors[i].color;
        canvas.ctx.beginPath();
        canvas.ctx.arc(x + buttonWidth / 2, y + buttonHeight / 2, buttonWidth / 2 - 5, 0, Math.PI * 2);
        canvas.ctx.fill();

        if (currentColor === colors[i].color) {
            canvas.ctx.strokeStyle = '#ffffff';
            canvas.ctx.lineWidth = 4;
            canvas.ctx.beginPath();
            canvas.ctx.arc(x + buttonWidth / 2, y + buttonHeight / 2, buttonWidth / 2 - 2, 0, Math.PI * 2);
            canvas.ctx.stroke();
            
            canvas.ctx.fillStyle = '#ffffff';
            canvas.ctx.font = 'bold 24px Arial';
            canvas.ctx.textAlign = 'center';
            canvas.ctx.fillText('✓', x + buttonWidth / 2, y + buttonHeight / 2 + 8);
        }

        canvas.ctx.restore();

        canvas.ctx.fillStyle = '#ecf0f1';
        canvas.ctx.font = '12px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText(colors[i].name, x + buttonWidth / 2, y + buttonHeight + 15);
    }

    canvas.ctx.globalAlpha = 1;
}

function drawCreditsScreen(ctx) {
    // Animated gradient background
    const time = Date.now() * 0.001;
    const gradient = canvas.ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    canvas.ctx.fillStyle = gradient;
    canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

    // Draw back arrow
    animateBackArrow(ctx, { value: State.isAnimatingBack }, { value: State.animationStartTimeBack });

    // Title
    canvas.ctx.save();
    canvas.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    canvas.ctx.shadowBlur = 10;
    canvas.ctx.shadowOffsetY = 3;
    canvas.ctx.fillStyle = '#ffd700';
    canvas.ctx.font = 'bold 32px Arial';
    canvas.ctx.textAlign = 'center';
    canvas.ctx.fillText('Credits', Constants.SCREEN_WIDTH / 2, 60);
    canvas.ctx.restore();

    // Credits content
    const credits = [
        'Game Developer: Vihaan Krishnan',
        'Title Screen Music: Scott Joplin',
        'Engine: HTML5 Canvas',
        'First player: Tejas Deepak',
        'Inspiration: Aneerudh (Krrish) Joshi',

        'Thanks for playing!'
    ];

    canvas.ctx.fillStyle = '#ffffff';
    canvas.ctx.font = '18px Arial';
    canvas.ctx.textAlign = 'center';
    
    credits.forEach((credit, i) => {
        const y = 150 + i * 40;
        canvas.ctx.fillText(credit, Constants.SCREEN_WIDTH / 2, y);
    });

    canvas.ctx.globalAlpha = 1;
}

// Click detection for title screen buttons
function getTitleScreenButtonAtPos(x, y) {
    // Play button (top left)
    const playX = Constants.SCREEN_WIDTH / 4;
    const playY = Constants.SCREEN_HEIGHT / 2 - 50;
    const playRadius = 40;
    const playDist = Math.sqrt((x - playX) ** 2 + (y - playY) ** 2);
    if (playDist <= playRadius) return 'play';

    // Editor button (top right)
    const editorX = 3 * Constants.SCREEN_WIDTH / 4;
    const editorY = Constants.SCREEN_HEIGHT / 2 - 50;
    const editorRadius = 40;
    const editorDist = Math.sqrt((x - editorX) ** 2 + (y - editorY) ** 2);
    if (editorDist <= editorRadius) return 'editor';

    // Customize button (bottom left)
    const customizeX = Constants.SCREEN_WIDTH / 4;
    const customizeY = Constants.SCREEN_HEIGHT / 2 + 50;
    const customizeRadius = 40;
    const customizeDist = Math.sqrt((x - customizeX) ** 2 + (y - customizeY) ** 2);
    if (customizeDist <= customizeRadius) return 'customize';

    // Issues button (bottom right)
    const issuesX = 3 * Constants.SCREEN_WIDTH / 4;
    const issuesY = Constants.SCREEN_HEIGHT / 2 + 50;
    const issuesRadius = 40;
    const issuesDist = Math.sqrt((x - issuesX) ** 2 + (y - issuesY) ** 2);
    if (issuesDist <= issuesRadius) return 'issues';

    // Credits button (center bottom)
    const creditsX = Constants.SCREEN_WIDTH / 2;
    const creditsY = Constants.SCREEN_HEIGHT / 2 + 120;
    const creditsRadius = 40;
    const creditsDist = Math.sqrt((x - creditsX) ** 2 + (y - creditsY) ** 2);
    if (creditsDist <= creditsRadius) return 'credits';

    // Music credit link
    const creditY = Constants.SCREEN_HEIGHT - 10;
    canvas.ctx.font = '10px Arial';
    const creditText = 'Music: Scott Joplin / IE';
    const creditWidth = canvas.ctx.measureText(creditText).width;
    const creditX = Constants.SCREEN_WIDTH / 2 - creditWidth / 2;
    if (y >= creditY - 10 && y <= creditY + 2 && x >= creditX && x <= creditX + creditWidth) return 'credit';

    return null;
}

// Click detection for editor tool buttons in gray rectangle
function getEditorToolButtonAtPos(x, y) {
    if (!State.editorMode) return null;
    const toolX = 10;
    const toolHeight = 40;
    const toolWidth = 80;
    const spacing = 5;
    const buildY = 367;
    
    // Check block type selectors
    const blockTypes = ['solid', 'end', 'kill'];
    const blockX = 200;
    const blockWidth = 60;
    const blockHeight = 30;
    const blockSpacing = 10;
    
    for (let i = 0; i < blockTypes.length; i++) {
        const bx = blockX + i * (blockWidth + blockSpacing);
        const by = buildY;
        if (x >= bx && x <= bx + blockWidth && y >= by && y <= by + blockHeight) {
            return blockTypes[i];
        }
    }
    if (x >= toolX && x <= toolX + toolWidth && y >= buildY && y <= buildY + toolHeight) return 'build';

    // Edit button
    const editY = buildY + toolHeight + spacing;
    if (x >= toolX && x <= toolX + toolWidth && y >= editY && y <= editY + toolHeight) return 'edit';

    // Delete button
    const deleteY = editY + toolHeight + spacing;
    if (x >= toolX && x <= toolX + toolWidth && y >= deleteY && y <= deleteY + toolHeight) return 'delete';

    return null;
}

function drawBlocks(ctx) {
    // Draw gray bottom bar
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
        if (State.showHitboxes) {
            canvas.ctx.save();
            canvas.ctx.strokeStyle = 'magenta';
            canvas.ctx.lineWidth = 1;
            canvas.ctx.strokeRect(b.x, b.y, b.width, b.height);
            canvas.ctx.restore();
        }
        // Highlight selected block
        if (State.selectedBlockIndex === i) {
            canvas.ctx.save();
            canvas.ctx.strokeStyle = 'yellow';
            canvas.ctx.lineWidth = 3;
            canvas.ctx.strokeRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
            canvas.ctx.restore();
        }
    }
    // draw texts
    canvas.ctx.fillStyle = '#000';
    canvas.ctx.font = '12px sans-serif';
    for (let t of State.texts) {
        canvas.ctx.fillText(t.text, t.x, t.y);
    }
    // draw selection for dragging
    if (State.dragging && State.draggingTextIndex >= 0 && State.texts[State.draggingTextIndex]) {
        const sel = State.texts[State.draggingTextIndex];
        canvas.ctx.save();
        canvas.ctx.strokeStyle = 'blue';
        canvas.ctx.lineWidth = 1;
        canvas.ctx.font = '12px sans-serif';
        const w = canvas.ctx.measureText(sel.text).width;
        const h = 12;
        canvas.ctx.strokeRect(sel.x, sel.y - h, w, h);
        canvas.ctx.restore();
    }
}

function drawHUD(ctx) {
    // Draw back arrow (visible when not on title screen) so user can return
    function drawBackArrow(ctx) {
        const bx = 10, by = 10, bw = 60, bh = 40, br = 6;
        canvas.ctx.save();
        canvas.ctx.shadowColor = 'rgba(0,0,0,0.45)';
        canvas.ctx.shadowBlur = 8;
        canvas.ctx.fillStyle = '#19a819';
        roundRectPath(ctx, bx, by, bw, bh, br);
        canvas.ctx.fill();
        canvas.ctx.restore();
        // arrow triangle
        canvas.ctx.fillStyle = '#e8ffe8';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(bx + 15, by + bh / 2);
        canvas.ctx.lineTo(bx + bw - 15, by + 8);
        canvas.ctx.lineTo(bx + bw - 15, by + bh - 8);
        canvas.ctx.closePath();
        canvas.ctx.fill();
    }

    function isBackArrowAtPos(x, y) {
        const bx = 10, by = 10, bw = 60, bh = 40;
        return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
    }
    if (!State.showTitleScreen) {
        animateBackArrow(ctx, { value: State.isAnimatingBack }, { value: State.animationStartTimeBack });
    }

    // Draw level switcher arrows (not in editor mode)
    if (!State.editorMode && State.levels.length > 1) {
        const arrowY = 10;
        const arrowSize = 30;
        const leftX = Constants.SCREEN_WIDTH - 100;
        const rightX = Constants.SCREEN_WIDTH - 40;
        
        // Left arrow
        canvas.ctx.fillStyle = State.currentLevelIndex > 0 ? '#3498db' : '#7f8c8d';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(leftX + arrowSize, arrowY);
        canvas.ctx.lineTo(leftX, arrowY + arrowSize / 2);
        canvas.ctx.lineTo(leftX + arrowSize, arrowY + arrowSize);
        canvas.ctx.closePath();
        canvas.ctx.fill();
        
        // Right arrow
        canvas.ctx.fillStyle = State.currentLevelIndex < State.levels.length - 1 ? '#3498db' : '#7f8c8d';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(rightX, arrowY);
        canvas.ctx.lineTo(rightX + arrowSize, arrowY + arrowSize / 2);
        canvas.ctx.lineTo(rightX, arrowY + arrowSize);
        canvas.ctx.closePath();
        canvas.ctx.fill();
        
        // Level indicator
        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = '14px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText(`${State.currentLevelIndex + 1}/${State.levels.length}`, (leftX + rightX + arrowSize) / 2, arrowY + arrowSize / 2 + 5);
    }

    if (State.editorMode) {
        // Editor toolbar at top
        canvas.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        canvas.ctx.fillRect(70, 0, Constants.SCREEN_WIDTH, 35);

        canvas.ctx.fillStyle = '#ffff00';
        canvas.ctx.font = 'bold 20px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('EDITOR', Constants.SCREEN_WIDTH / 2, 24);

        canvas.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        canvas.ctx.font = '11px Arial';

        // Draw editor tools on the left margin
        const toolX = 10;
        const toolHeight = 40;
        const toolWidth = 80;
        const spacing = 5;
        const buildY = 367;

        // Block type selectors (hide in delete mode)
        if (State.editorToolMode !== 'delete') {
            const blockTypes = ['solid', 'end', 'kill'];
            const blockX = 200;
            const blockWidth = 60;
            const blockHeight = 30;
            const blockSpacing = 10;
            
            // Determine which type to highlight
            let highlightType = State.currentBlockType;
            if (State.editorToolMode === 'edit' && State.selectedBlockIndex >= 0 && State.blocks[State.selectedBlockIndex]) {
                highlightType = State.blocks[State.selectedBlockIndex].type;
            }
            
            for (let i = 0; i < blockTypes.length; i++) {
                const type = blockTypes[i];
                const bx = blockX + i * (blockWidth + blockSpacing);
                const by = buildY;
                
                // Draw block
                if (type === 'end') canvas.ctx.fillStyle = 'green';
                else if (type === 'kill') canvas.ctx.fillStyle = '#ff4500';
                else canvas.ctx.fillStyle = '#666';
                canvas.ctx.fillRect(bx, by, blockWidth, blockHeight);
                
                // Highlight selected
                if (highlightType === type) {
                    canvas.ctx.strokeStyle = '#ffff00';
                    canvas.ctx.lineWidth = 3;
                } else {
                    canvas.ctx.strokeStyle = '#333';
                    canvas.ctx.lineWidth = 2;
                }
                canvas.ctx.strokeRect(bx, by, blockWidth, blockHeight);
            }
        }

        // Build button
        canvas.ctx.fillStyle = State.editorToolMode === 'build' ? '#ffff00' : '#cccccc';
        canvas.ctx.fillRect(toolX, buildY, toolWidth, toolHeight);
        canvas.ctx.strokeStyle = '#000';
        canvas.ctx.lineWidth = 2;
        canvas.ctx.strokeRect(toolX, buildY, toolWidth, toolHeight);
        canvas.ctx.fillStyle = '#000';
        canvas.ctx.font = '14px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('Build', toolX + toolWidth / 2, buildY + toolHeight / 2 + 5);

        // Edit button
        const editY = buildY + toolHeight + spacing;
        canvas.ctx.fillStyle = State.editorToolMode === 'edit' ? '#ffff00' : '#cccccc';
        canvas.ctx.fillRect(toolX, editY, toolWidth, toolHeight);
        canvas.ctx.strokeStyle = '#000';
        canvas.ctx.lineWidth = 2;
        canvas.ctx.strokeRect(toolX, editY, toolWidth, toolHeight);
        canvas.ctx.fillStyle = '#000';
        canvas.ctx.fillText('Edit', toolX + toolWidth / 2, editY + toolHeight / 2 + 5);

        // Delete button
        const deleteY = editY + toolHeight + spacing;
        canvas.ctx.fillStyle = State.editorToolMode === 'delete' ? '#ffff00' : '#cccccc';
        canvas.ctx.fillRect(toolX, deleteY, toolWidth, toolHeight);
        canvas.ctx.strokeStyle = '#000';
        canvas.ctx.lineWidth = 2;
        canvas.ctx.strokeRect(toolX, deleteY, toolWidth, toolHeight);
        canvas.ctx.fillStyle = '#000';
        canvas.ctx.fillText('Delete', toolX + toolWidth / 2, deleteY + toolHeight / 2 + 5);
        // Add export button

        return;
    }

    if (!State.isRunning && !State.isAnimatingBack) {
        canvas.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
    }
    if (State.levelCompleted) {
        canvas.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        canvas.ctx.fillRect(0, Constants.SCREEN_HEIGHT / 2 - 30, Constants.SCREEN_WIDTH, 60);
        canvas.ctx.fillStyle = '#0f0';
        canvas.ctx.font = '24px sans-serif';
        canvas.ctx.fillText('You have completed the level!', 20, Constants.SCREEN_HEIGHT / 2 + 8);

    }
    if (State.editorMode) {
        Constants.editorHint.textContent = 'Editor: click to add/remove blocks (grid 10px)';
    } else {
        Constants.editorHint.textContent = '';
    }
}

// expose helper for click handling
window._isBackArrowAtPos = function (x, y) { return (function (x, y) { const bx = 10, by = 10, bw = 60, bh = 40; return x >= bx && x <= bx + bw && y >= by && y <= by + bh; })(x, y); };

function canvasToGameCoords(evt) {
    const rect = canvas.canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left) / Constants.scaleX;
    const y = (evt.clientY - rect.top) / Constants.scaleY;
    return { x, y };
}

// Return index of text at position or -1
function findTextAt(x, y) {
    canvas.ctx.font = '12px sans-serif';
    for (let i = State.texts.length - 1; i >= 0; i--) {
        const t = State.texts[i];
        const metrics = canvas.ctx.measureText(t.text);
        const w = metrics.width;
        const h = 12; // approximate font height
        const left = t.x;
        const top = t.y - h; // text drawn at baseline
        if (x >= left && x <= left + w && y >= top && y <= top + h) return i;
    }
    return -1;
}

function addBlockAt(x, y) {
    const grid = 10;
    const bw = 40, bh = 10;
    const gx = Math.floor(x / grid) * grid;
    const gy = Math.floor(y / grid) * grid;
    
    // Prevent placing blocks in gray rectangle area (below Y=367)
    if (gy + bh > 367) {
        return; // Don't place block
    }
    
    // If placing a start block, ensure only one exists per level  
    if (State.currentBlockType === 'start') {
        for (let i = State.blocks.length - 1; i >= 0; i--) {
            if (State.blocks[i].type === 'start') State.blocks.splice(i, 1);
        }
    }
    State.blocks.push({ x: gx, y: gy, width: bw, height: bh, type: State.currentBlockType });
}

// Add text at grid position
function addTextAt(x, y, text) {
    const grid = 10;
    const gx = Math.floor(x / grid) * grid;
    const gy = Math.floor(y / grid) * grid;
    State.texts.push({ x: gx, y: gy, text: text });
}

function removeBlockAt(x, y) {
    for (let i = State.blocks.length - 1; i >= 0; i--) {
        const b = State.blocks[i];
        if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
            State.blocks.splice(i, 1);
            return;
        }
    }
}

// expose helper for click handling
window._isBackArrowAtPos = function (x, y) { return (function (x, y) { const bx = 10, by = 10, bw = 60, bh = 40; return x >= bx && x <= bx + bw && y >= by && y <= by + bh; })(x, y); };
// Editor mouse interactions: support placing text, toggling/painting blocks, and dragging texts
canvas.canvas.addEventListener('mousedown', (e) => {
    console.log('Mousedown event fired, button:', e.button);
    if (e.button !== 0) return; // Only handle left-click for blocks
    const p = canvasToGameCoords(e);
    console.log('Game coordinates:', p.x, p.y);
    // If on title screen, check which button was clicked
    if (State.showTitleScreen) {
        const btn = getTitleScreenButtonAtPos(p.x, p.y);
        if (btn) {
            // record which button was pressed; actual action happens on release
            State.pressedTitleButton = btn;
            State.titleButtonIsDown = true;
        }
        return;
    }

    // Back arrow (top-left) should return to title screen when clicked with animation
    console.log('Checking back arrow: isAnimating:', State.isAnimating, 'isAnimatingEditor:', State.isAnimatingEditor, 'isAnimatingBack:', State.isAnimatingBack, 'showTitleScreen:', State.showTitleScreen);
    if (window._isBackArrowAtPos && window._isBackArrowAtPos(p.x, p.y)) {
        console.log('Back arrow clicked, starting animation');
        // Reset any ongoing animations
        State.isAnimating = false;
        State.isAnimatingEditor = false;
        State.isAnimatingCustomize = false;
        if (!State.isAnimatingBack) {
            State.isAnimatingBack = true;
            State.animationStartTimeBack = Date.now();
        }
        // push title state back
        history.pushState({ screen: 'title' }, '', '');
        return;
    }

    // Level switcher arrows
    if (!State.editorMode && State.levels.length > 1) {
        const arrowY = 10;
        const arrowSize = 30;
        const leftX = Constants.SCREEN_WIDTH - 100;
        const rightX = Constants.SCREEN_WIDTH - 40;
        
        // Left arrow click
        if (p.x >= leftX && p.x <= leftX + arrowSize && p.y >= arrowY && p.y <= arrowY + arrowSize && State.currentLevelIndex > 0) {
            loadLevel(State.currentLevelIndex - 1);
            return;
        }
        
        // Right arrow click
        if (p.x >= rightX && p.x <= rightX + arrowSize && p.y >= arrowY && p.y <= arrowY + arrowSize && State.currentLevelIndex < State.levels.length - 1) {
            loadLevel(State.currentLevelIndex + 1);
            return;
        }
    }

    if (!State.editorMode) return;
    
    // Check if clicking on editor UI buttons first
    const toolBtn = getEditorToolButtonAtPos(p.x, p.y);
    if (toolBtn) {
        // Don't process block selection if clicking on UI
        return;
    }
    
    const txt = (Constants.textInput && Constants.textInput.value || '').trim();
    // If user has typed text, place it at click
    if (txt) {
        addTextAt(p.x, p.y, txt);
        Constants.textInput.value = '';
        saveCurrentLevel();
        return;
    }
    // If clicked on an existing text, start dragging it
    const ti = findTextAt(p.x, p.y);
    if (ti >= 0) {
            State.draggingTextIndex = ti;
        State.dragging = true;
        const t = State.texts[ti];
        State.dragOffsetX = p.x - t.x;
        State.dragOffsetY = p.y - t.y;
        return;
    }

    // Check if clicked on a block
    let clickedBlockIndex = -1;
    for (let i = 0; i < State.blocks.length; i++) {
        const b = State.blocks[i];
        if (p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height) {
            clickedBlockIndex = i;
            break;
        }
    }

    if (clickedBlockIndex >= 0) {
        if (State.editorToolMode === 'delete') {
            // Delete the block
            State.blocks.splice(clickedBlockIndex, 1);
            saveCurrentLevel();
            return;
        } else if (State.editorToolMode === 'edit') {
            // Select and start dragging the block
            State.selectedBlockIndex = clickedBlockIndex;
            State.draggingBlockIndex = clickedBlockIndex;
            const b = State.blocks[clickedBlockIndex];
            State.dragBlockOffsetX = p.x - b.x;
            State.dragBlockOffsetY = p.y - b.y;
            return;
        } else if (State.editorToolMode === 'build') {
            // Build mode: do nothing when clicking on existing blocks
            return;
        }
    } else {
        // Clicked on empty space
        if (State.editorToolMode === 'build') {
            // Add block
            addBlockAt(p.x, p.y);
            saveCurrentLevel();
            return;
        } else if (State.editorToolMode === 'edit') {
            // Deselect
            State.selectedBlockIndex = -1;
            return;
        }
    }
});

canvas.canvas.addEventListener('mousemove', (e) => {
    if (!State.editorMode) return;
    const p = canvasToGameCoords(e);
    
    // If dragging a block in edit mode
    if (State.draggingBlockIndex >= 0 && State.blocks[State.draggingBlockIndex]) {
        const grid = 10;
        const nx = Math.floor((p.x - State.dragBlockOffsetX) / grid) * grid;
        const ny = Math.floor((p.y - State.dragBlockOffsetY) / grid) * grid;
        
        // Prevent dragging into gray area
        if (ny + State.blocks[State.draggingBlockIndex].height <= 367) {
            State.blocks[State.draggingBlockIndex].x = nx;
            State.blocks[State.draggingBlockIndex].y = ny;
        }
        return;
    }
    
    // If dragging a text, move it
    if (State.dragging && State.draggingTextIndex >= 0) {
        const grid = 10;
        const nx = Math.floor((p.x - State.dragOffsetX) / grid) * grid;
        const ny = Math.floor((p.y - State.dragOffsetY) / grid) * grid;
        State.texts[State.draggingTextIndex].x = nx;
        State.texts[State.draggingTextIndex].y = ny + 12; // keep baseline offset
        return;
    }
    // If painting mode (mouse held down after toggling), apply add/remove along path
    if (State.isPainting && State.paintingMode) {
        const grid = 10;
        const gx = Math.floor(p.x / grid) * grid;
        const gy = Math.floor(p.y / grid) * grid;
        // remove mode: remove any block at this grid cell
        if (State.paintingMode === 'remove') {
            for (let i = State.blocks.length - 1; i >= 0; i--) {
                const b = State.blocks[i];
                if (b.x === gx && b.y === gy) {
                    State.blocks.splice(i, 1);
                    break;
                }
            }
        } else if (State.paintingMode === 'add') {
            // add mode: add block if not present
            let exists = false;
            for (let b of State.blocks) {
                if (b.x === gx && b.y === gy) { exists = true; break; }
            }
            if (!exists) addBlockAt(gx + 1, gy + 1);
        }
    }
});

// Handle mouseup for canvas: trigger title-screen actions on release
canvas.canvas.addEventListener('mouseup', (e) => {
    const p = canvasToGameCoords(e);

    // Handle customization screen clicks first
    if (State.showCustomizationScreen) {
        // Check back arrow first
        if (window._isBackArrowAtPos && window._isBackArrowAtPos(p.x, p.y)) {
            State.isAnimating = false;
            State.isAnimatingEditor = false;
            State.isAnimatingCustomize = false;
            if (!State.isAnimatingBack) {
                State.isAnimatingBack = true;
                State.animationStartTimeBack = Date.now();
            }
            history.pushState({ screen: 'title' }, '', '');
            return;
        }

        // Check tabs
        const tabY = 80;
        const tabWidth = 100;
        const tabHeight = 35;
        const tabSpacing = 10;
        const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;
        
        if (p.y >= tabY && p.y <= tabY + tabHeight) {
            if (p.x >= tabStartX && p.x <= tabStartX + tabWidth) {
                State.customizeColorMode = 'inner';
                return;
            } else if (p.x >= tabStartX + tabWidth + tabSpacing && p.x <= tabStartX + 2 * tabWidth + tabSpacing) {
                State.customizeColorMode = 'outer';
                return;
            }
        }

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

        const buttonWidth = 70;
        const buttonHeight = 70;
        const spacing = 15;
        const colorsPerRow = 4;
        const startX = (Constants.SCREEN_WIDTH - (colorsPerRow * (buttonWidth + spacing) - spacing)) / 2;
        const startY = 150;
        const rowSpacing = 90;

        // Check color buttons (circular hit detection)
        for (let i = 0; i < colors.length; i++) {
            const row = Math.floor(i / colorsPerRow);
            const col = i % colorsPerRow;
            const centerX = startX + col * (buttonWidth + spacing) + buttonWidth / 2;
            const centerY = startY + row * rowSpacing + buttonHeight / 2;
            const dist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
            
            if (dist <= buttonWidth / 2) {
                if (State.customizeColorMode === 'inner') {
                    State.currentPlayerColor = colors[i].color;
                } else {
                    State.currentPlayerOuterColor = colors[i].color;
                }
                savePlayerColors();
                return;
            }
        }
        return;
    }

    // Handle credits screen clicks
    if (State.showCreditsScreen) {
        if (window._isBackArrowAtPos && window._isBackArrowAtPos(p.x, p.y)) {
            State.isAnimating = false;
            State.isAnimatingEditor = false;
            State.isAnimatingCustomize = false;
            State.isAnimatingCredits = false;
            if (!State.isAnimatingBack) {
                State.isAnimatingBack = true;
                State.animationStartTimeBack = Date.now();
            }
            history.pushState({ screen: 'title' }, '', '');
            return;
        }
        return;
    }

    if (State.pressedTitleButton) {
        const btn = getTitleScreenButtonAtPos(p.x, p.y);
        if (btn === State.pressedTitleButton || !btn) {
            if (btn === State.pressedTitleButton || !btn) {
                if (State.pressedTitleButton === 'play' && !State.isAnimating && !State.isAnimatingEditor && !State.isAnimatingBack) {
                    console.log('Play button clicked, starting animation');
                    State.isAnimating = true;
                    State.animationStartTime = Date.now();
                }
                else if (State.pressedTitleButton === 'editor' && !State.isAnimatingEditor && !State.isAnimating && !State.isAnimatingBack) {
                    console.log('Editor button clicked, starting animation');
                    State.isAnimatingEditor = true;
                    State.animationStartTimeEditor = Date.now();
                }
                else if (State.pressedTitleButton === 'customize' && !State.isAnimatingCustomize && !State.isAnimating && !State.isAnimatingEditor && !State.isAnimatingBack) {
                    State.isAnimatingCustomize = true;
                    State.animationStartTimeCustomize = Date.now();
                }
                else if (State.pressedTitleButton === 'credits' && !State.isAnimatingCredits && !State.isAnimating && !State.isAnimatingEditor && !State.isAnimatingBack) {
                    State.isAnimatingCredits = true;
                    State.animationStartTimeCredits = Date.now();
                }
                else if (State.pressedTitleButton === 'issues') {
                    window.open('https://github.com/pixel-perfect-platformer/pixel-perfect-platformer.github.io/issues', '_blank');
                }
                else if (State.pressedTitleButton === 'credit') {
                    window.open('credits.html', '_blank');
                }
                State.pressedTitleButton = null;
                State.titleButtonIsDown = false;
                return;
            }
        }
    }

    // Handle editor tool button clicks
    if (State.editorMode) {
        const toolBtn = getEditorToolButtonAtPos(p.x, p.y);
        if (toolBtn) {
            // Check if it's a block type
            if (toolBtn === 'solid' || toolBtn === 'end' || toolBtn === 'kill') {
                if (State.editorToolMode === 'edit' && State.selectedBlockIndex >= 0 && State.blocks[State.selectedBlockIndex]) {
                    // Edit mode: change type of selected block
                    State.blocks[State.selectedBlockIndex].type = toolBtn;
                    saveCurrentLevel();
                } else {
                    // Build mode: set type for new blocks
                    State.currentBlockType = toolBtn;
                }
            } else {
                setEditorToolMode(toolBtn);
            }
            return;
        }
    }
    
    // Stop dragging blocks
    if (State.draggingBlockIndex >= 0) {
        State.draggingBlockIndex = -1;
        saveCurrentLevel();
    }
    State.dragging = false;
    State.draggingTextIndex = -1;
})

// touch support: treat touchstart like mousedown and touchend like mouseup
canvas.canvas.addEventListener('touchstart', (e) => {
    const p = canvasToGameCoords(e.touches[0]);
    // Handle back arrow for touch
    if (!State.showTitleScreen && window._isBackArrowAtPos && window._isBackArrowAtPos(p.x, p.y) && !State.isAnimating && !State.isAnimatingEditor && !State.isAnimatingBack) {
        State.isRunning = false;
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
canvas.canvas.addEventListener('touchend', (e) => { if (!State.pressedTitleButton) return; const touch = (e.changedTouches && e.changedTouches[0]); if (!touch) { State.pressedTitleButton = null; return; } const p = canvasToGameCoords(touch); const btn = getTitleScreenButtonAtPos(p.x, p.y); if (btn === State.pressedTitleButton) { if (btn === 'play' && !State.isAnimating) { State.isAnimating = true; State.animationStartTime = Date.now(); } else if (btn === 'editor' && !State.isAnimatingEditor) { State.isAnimatingEditor = true; State.animationStartTimeEditor = Date.now(); } else if (btn === 'issues') { window.open('https://github.com/pixel-perfect-platformer/pixel-perfect-platformer.github.io/issues', '_blank'); } else if (btn === 'credit') { window.open('credits.html', '_blank'); } } State.pressedTitleButton = null; }, { passive: false });

// Touch support for customization screen
canvas.canvas.addEventListener('touchstart', (e) => {
    if (!State.showCustomizationScreen) return;
    const p = canvasToGameCoords(e.touches[0]);
    
    // Check back arrow first
    if (window._isBackArrowAtPos && window._isBackArrowAtPos(p.x, p.y)) {
        State.isAnimating = false;
        State.isAnimatingEditor = false;
        State.isAnimatingCustomize = false;
        if (!State.isAnimatingBack) {
            State.isAnimatingBack = true;
            State.animationStartTimeBack = Date.now();
        }
        history.pushState({ screen: 'title' }, '', '');
        e.preventDefault();
        return;
    }

    // Check tabs
    const tabY = 80;
    const tabWidth = 100;
    const tabHeight = 35;
    const tabSpacing = 10;
    const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;
    
    if (p.y >= tabY && p.y <= tabY + tabHeight) {
        if (p.x >= tabStartX && p.x <= tabStartX + tabWidth) {
            State.customizeColorMode = 'inner';
            return;
        } else if (p.x >= tabStartX + tabWidth + tabSpacing && p.x <= tabStartX + 2 * tabWidth + tabSpacing) {
            State.customizeColorMode = 'outer';
            return;
        }
    }

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

    const buttonWidth = 70;
    const buttonHeight = 70;
    const spacing = 15;
    const colorsPerRow = 4;
    const startX = (Constants.SCREEN_WIDTH - (colorsPerRow * (buttonWidth + spacing) - spacing)) / 2;
    const startY = 150;
    const rowSpacing = 90;

    // Check color buttons (circular hit detection)
    for (let i = 0; i < colors.length; i++) {
        const row = Math.floor(i / colorsPerRow);
        const col = i % colorsPerRow;
        const centerX = startX + col * (buttonWidth + spacing) + buttonWidth / 2;
        const centerY = startY + row * rowSpacing + buttonHeight / 2;
        const dist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
        
        if (dist <= buttonWidth / 2) {
            if (State.customizeColorMode === 'inner') {
                State.currentPlayerColor = colors[i].color;
            } else {
                State.currentPlayerOuterColor = colors[i].color;
            }
            savePlayerColors();
            return;
        }
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
// Build mode: sets type for new blocks
// Edit mode: changes type of selected block
Constants.blockTypeSelect.addEventListener('change', (e) => {
    if (!State.editorMode) return;
    
    if (State.editorToolMode === 'build') {
        // Build mode: set type for new blocks to be created
        State.currentBlockType = e.target.value;
    } else if (State.editorToolMode === 'edit') {
        // Edit mode: change type of selected block
        if (State.selectedBlockIndex >= 0 && State.blocks[State.selectedBlockIndex]) {
            State.blocks[State.selectedBlockIndex].type = e.target.value;
            saveCurrentLevel();
        }
    }
});

// Level management
function saveLevelsToStorage() {
    try { 
        localStorage.setItem('platformer_levels', JSON.stringify(State.levels)); 
    } catch (e) {
        console.error('Failed to save levels:', e);
    }
}

// Player colors management
function savePlayerColors() {
    try {
        localStorage.setItem('platformer_player_colors', JSON.stringify({
            inner: State.currentPlayerColor,
            outer: State.currentPlayerOuterColor
        }));
    } catch (e) {
        console.error('Failed to save player colors:', e);
    }
}

function loadPlayerColors() {
    try {
        const data = localStorage.getItem('platformer_player_colors');
        if (data) {
            const colors = JSON.parse(data);
            State.currentPlayerColor = colors.inner || '#ff0000';
            State.currentPlayerOuterColor = colors.outer || '#000000';
        }
    } catch (e) {
        console.error('Failed to load player colors:', e);
    }
}

function loadLevelsFromStorage() {
    const data = localStorage.getItem('platformer_levels');
    if (data) {
        try { 
            State.levels = JSON.parse(data); 
        } catch (e) { 
            State.levels = []; 
        }
    }
    if (!State.levels || State.levels.length === 0) {
        State.levels = [{ name: 'Level 1', blocks: [], texts: [] }];
        saveLevelsToStorage();
    }
    populateLevelSelect();
    loadLevel(0);
}

function populateLevelSelect() {
    Constants.levelSelect.innerHTML = '';
    State.levels.forEach((lv, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = lv.name || `Level ${i + 1}`;
        Constants.levelSelect.appendChild(opt);
    });
    Constants.levelSelect.value = State.currentLevelIndex;
}

function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
}

function shiftLevelUp(shiftAmount) {
    State.blocks.forEach(b => b.y -= shiftAmount);
    State.texts.forEach(t => t.y -= shiftAmount);
}

function removeStartBlocks() {
    const startBlocks = State.blocks.filter(b => b.type === 'start');
    if (startBlocks.length > 0) {
        alert('Compatibility issue: This level contains start blocks which are no longer supported. They will be removed.');
        State.blocks = State.blocks.filter(b => b.type !== 'start');
        return true;
    }
    return false;
}

function positionPlayerOnSpawn() {
    const grayRectangleTop = Constants.SCREEN_HEIGHT - 140;
    player.x = 0;
    player.y = grayRectangleTop - player.height;
    
    // Position player on top of any block at spawn
    for (let b of State.blocks) {
        if (b.x <= player.x && b.x + b.width > player.x && 
            b.y <= player.y + player.height && b.y + b.height > player.y) {
            player.y = b.y - player.height;
            break;
        }
    }
}

function loadLevel(index) {
    State.currentLevelIndex = index;
    State.blocks = cloneData(State.levels[index].blocks || []);
    State.texts = cloneData(State.levels[index].texts || []);
    
    // Check if any blocks are in gray area and shift level up
    const maxBlockBottom = Math.max(0, ...State.blocks.map(b => b.y + b.height));
    if (maxBlockBottom > 367) {
        shiftLevelUp(maxBlockBottom - 367);
    }
    
    // Remove deprecated start blocks
    if (removeStartBlocks()) {
        State.levels[index].blocks = cloneData(State.blocks);
        saveLevelsToStorage();
    }
    
    positionPlayerOnSpawn();
    player.lateral_speed = player.vertical_speed = 0;
    State.isRunning = false;
    State.levelCompleted = false;
    
    if (State.levelNameInput) {
        State.levelNameInput.value = State.levels[index].name || `Level ${index + 1}`;
    }
}

function saveCurrentLevel() {
    if (!State.levels[State.currentLevelIndex]) {
        State.levels[State.currentLevelIndex] = { 
            name: `Level ${State.currentLevelIndex + 1}`, 
            blocks: [], 
            texts: [] 
        };
    }
    State.levels[State.currentLevelIndex].blocks = cloneData(State.blocks);
    State.levels[State.currentLevelIndex].texts = cloneData(State.texts);
    saveLevelsToStorage();
    populateLevelSelect();
    showStatus('Level saved to collection');
}
// wire up level UI
Constants.levelSelect.addEventListener('change', (e) => loadLevel(parseInt(e.target.value)));

// Editor tool buttons
const buildModeBtn = document.getElementById('buildModeBtn');
const editModeBtn = document.getElementById('editModeBtn');
const deleteModeBtn = document.getElementById('deleteModeBtn');

function setEditorToolMode(mode) {
    State.editorToolMode = mode;
    State.selectedBlockIndex = -1;
}

function updateEditorUI() {
    const editorTools = document.getElementById('editorTools');
    if (editorTools) editorTools.style.display = State.editorMode ? 'block' : 'none';
    
    if (Constants.blockTypeSelect) {
        Constants.blockTypeSelect.style.display = 'none';
    }
}

if (buildModeBtn) bindButtonAction(buildModeBtn, () => setEditorToolMode('build'));
if (editModeBtn) bindButtonAction(editModeBtn, () => setEditorToolMode('edit'));
if (deleteModeBtn) bindButtonAction(deleteModeBtn, () => setEditorToolMode('delete'));

// Wire up Theme Song button
const themeSongBtn = document.getElementById('themeSongBtn');
if (themeSongBtn) bindButtonAction(themeSongBtn, () => {
    window.open('theme.html', '_blank');
});

// Wire up Clear Blocks button
const clearBtn = document.getElementById('clearBtn');
if (clearBtn) bindButtonAction(clearBtn, () => {
    if (confirm('Clear all blocks from this level?')) {
        State.blocks = [];
        saveCurrentLevel();
    }
});

function respawnPlayer(x, y) {
    player.x = x;
    player.y = y;
    player.lateral_speed = 0;
    player.vertical_speed = 0;
    State.isRunning = true;
}

function onPlayerKilled() {
    const start = State.blocks.find(b => b.type === 'start');
    if (start) {
        respawnPlayer(
            start.x + Math.floor((start.width - player.width) / 2),
            start.y - player.height - 10000
        );
    } else {
        respawnPlayer(
            Math.floor(Constants.SCREEN_WIDTH / 2) - Math.floor(player.width / 2),
            Constants.SCREEN_HEIGHT - player.height - 100
        );
    }
}

function onLevelComplete() {
    if (State.levelCompleted) return;
    State.levelCompleted = true;
    State.isRunning = false;
    showStatus('You have completed the level!');
}

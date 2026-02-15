import State from './state.js';
import Constants from './constants.js';

export class UIScreens {
    static roundRectPath(ctx, canvas, x, y, w, h, r) {
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

    static drawButtonIcon(ctx, canvas, buttonType, buttonX, buttonY) {
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
            const brickW = 18, brickH = 10, gap = 3;
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
                UIScreens.roundRectPath(ctx, canvas, startX - gap / 2, y - gap / 2, rowW + gap, brickH + gap, 3);
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
                    UIScreens.roundRectPath(ctx, canvas, x, y, brickW, brickH, 2);
                    canvas.ctx.fill();
                    canvas.ctx.stroke();
                    canvas.ctx.restore();
                    canvas.ctx.fillStyle = '#ffd3c2';
                    canvas.ctx.fillRect(x + 3, y + 2, brickW - 6, brickH - 5);
                }
            }
        }
    }

    static animateButton(ctx, canvas, buttonX, buttonY, buttonRadius, animatingRef, startTimeRef, buttonType, fadeOutMusic, showLevelMenu) {
        if (animatingRef.value) {
            const progress = Math.min((Date.now() - startTimeRef.value) / Constants.animationDuration, 1);
            let scale = 1, shakeOffset = 0;
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
                        showLevelMenu();
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
            UIScreens.drawButtonIcon(ctx, canvas, buttonType, buttonX, buttonY);
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
            UIScreens.drawButtonIcon(ctx, canvas, buttonType, buttonX, buttonY);
        }
    }

    static animateBackArrow(ctx, canvas, animatingRef, startTimeRef, fadeOutMusic) {
        console.log("Animating back arrow line 128")
        if (State.backFromLevel) {
            State.showLevelsScreen = true;
            State.backFromLevel = false;
        } else {
            State.showTitleScreen = true;
        }

        const bx = 10, by = 10, bw = 60, bh = 40, br = 6;
        if (animatingRef.value) {
            const progress = Math.min((Date.now() - startTimeRef.value) / Constants.animationDuration, 1);
            let scale = 1, shakeOffsetX = 0, shakeOffsetY = 0;
            if (progress < 0.25) {
                const p = progress / 0.25;
                scale = p < 0.5 ? 1 + p * 1 : 1.5 - (p - 0.5) * 2;
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
                if (State.backFromLevel) {
                    State.showLevelsScreen = true;
                    State.backFromLevel = false;
                } else {
                    State.showTitleScreen = true;
                }
                State.showCustomizationScreen = false;
                State.showCreditsScreen = false;
                State.showSignInScreen = false;
                State.editorMode = false;
                State.isRunning = false;
                State.showCompletionScreen = false;
                State.showDeathScreen = false;
                if (Constants.editorBtn) Constants.editorBtn.textContent = 'Enter Editor';
                State.isPainting = false;
                State.dragging = false;
                State.draggingTextIndex = -1;
                State.isAnimating = false;
                State.isAnimatingEditor = false;
                State.isAnimatingCustomize = false;
                State.pressedTitleButton = null;
                State.titleButtonIsDown = false;
                State.fadeOpacity = 1;
                if (Constants.titleMusic) Constants.titleMusic.currentTime = 0;
                return;
            }
            canvas.ctx.save();
            const centerX = bx + bw / 2, centerY = by + bh / 2;
            canvas.ctx.translate(centerX, centerY);
            canvas.ctx.scale(scale, scale);
            canvas.ctx.translate(-centerX, -centerY);
            canvas.ctx.translate(shakeOffsetX, shakeOffsetY);
            canvas.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            UIScreens.roundRectPath(ctx, canvas, bx - 10, by - 10, bw + 20, bh + 20, br + 5);
            canvas.ctx.fill();
            canvas.ctx.save();
            canvas.ctx.shadowColor = 'rgba(0,0,0,0.45)';
            canvas.ctx.shadowBlur = 8;
            canvas.ctx.shadowOffsetY = 3;
            canvas.ctx.fillStyle = '#19a819';
            UIScreens.roundRectPath(ctx, canvas, bx, by, bw, bh, br);
            canvas.ctx.fill();
            canvas.ctx.restore();
            canvas.ctx.fillStyle = '#e8ffe8';
            canvas.ctx.beginPath();
            canvas.ctx.moveTo(bx + 15, by + bh / 2);
            canvas.ctx.lineTo(bx + bw - 15, by + 8);
            canvas.ctx.lineTo(bx + bw - 15, by + bh - 8);
            canvas.ctx.closePath();
            canvas.ctx.fill();
            canvas.ctx.restore();
        } else {
            canvas.ctx.save();
            canvas.ctx.shadowColor = 'rgba(0,0,0,0.45)';
            canvas.ctx.shadowBlur = 8;
            canvas.ctx.fillStyle = '#19a819';
            UIScreens.roundRectPath(ctx, canvas, bx, by, bw, bh, br);
            canvas.ctx.fill();
            canvas.ctx.restore();
            canvas.ctx.fillStyle = '#e8ffe8';
            canvas.ctx.beginPath();
            canvas.ctx.moveTo(bx + 15, by + bh / 2);
            canvas.ctx.lineTo(bx + bw - 15, by + 8);
            canvas.ctx.lineTo(bx + bw - 15, by + bh - 8);
            canvas.ctx.closePath();
            canvas.ctx.fill();
        }
    }

    static drawTitleScreen(ctx, canvas, fadeInMusic, fadeOutMusic, showLevelMenu) {
        canvas.ctx.globalAlpha = 1;
        if (Constants.titleMusic && Constants.titleMusic.paused) fadeInMusic();
        const gradient = canvas.ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(0.5, '#330066');
        gradient.addColorStop(1, '#004d99');
        canvas.ctx.fillStyle = gradient;
        canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        const time = Date.now() * 0.001;
        canvas.ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
        canvas.ctx.beginPath();
        canvas.ctx.arc(100 + Math.sin(time) * 20, 100 + Math.cos(time * 0.7) * 30, 40, 0, Math.PI * 2);
        canvas.ctx.fill();
        canvas.ctx.fillStyle = 'rgba(0, 200, 255, 0.1)';
        canvas.ctx.beginPath();
        canvas.ctx.arc(400 + Math.cos(time * 1.3) * 25, 80 + Math.sin(time * 0.9) * 35, 60, 0, Math.PI * 2);
        canvas.ctx.fill();
        canvas.ctx.fillStyle = '#ffff00';
        canvas.ctx.font = 'bold 56px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('PLATFORMER', Constants.SCREEN_WIDTH / 2, 120);
        const playX = Constants.SCREEN_WIDTH / 4, playY = Constants.SCREEN_HEIGHT / 2 - 50, playRadius = 40;
        const editorX = 3 * Constants.SCREEN_WIDTH / 4, editorY = Constants.SCREEN_HEIGHT / 2 - 50, editorRadius = 40;
        UIScreens.animateButton(ctx, canvas, playX, playY, playRadius, { value: State.isAnimating }, { value: State.animationStartTime }, 'play', fadeOutMusic, showLevelMenu);
        UIScreens.animateButton(ctx, canvas, editorX, editorY, editorRadius, { value: State.isAnimatingEditor }, { value: State.animationStartTimeEditor }, 'editor', fadeOutMusic, showLevelMenu);
        // Additional buttons omitted for brevity - customize, credits, account
        canvas.ctx.globalAlpha = 1;
    }

    static drawCustomizationScreen(ctx, canvas) {
        const time = Date.now() * 0.001;
        const gradient = canvas.ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(0.5, '#34495e');
        gradient.addColorStop(1, '#2c3e50');
        canvas.ctx.fillStyle = gradient;
        canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        for (let i = 0; i < 5; i++) {
            const x = (i * 100 + time * 30) % Constants.SCREEN_WIDTH;
            const y = 50 + Math.sin(time + i) * 20;
            canvas.ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time + i) * 0.05})`;
            canvas.ctx.beginPath();
            canvas.ctx.arc(x, y, 3, 0, Math.PI * 2);
            canvas.ctx.fill();
        }
        UIScreens.animateBackArrow(ctx, canvas, { value: State.isAnimatingBack }, { value: State.animationStartTimeBack });
        canvas.ctx.save();
        canvas.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        canvas.ctx.shadowBlur = 10;
        canvas.ctx.shadowOffsetY = 3;
        canvas.ctx.fillStyle = '#ecf0f1';
        canvas.ctx.font = 'bold 32px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('Customize Player', Constants.SCREEN_WIDTH / 2, 60);
        canvas.ctx.restore();
        canvas.ctx.globalAlpha = 1;
    }

    static drawCreditsScreen(ctx, canvas) {
        const time = Date.now() * 0.001;
        const gradient = canvas.ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        canvas.ctx.fillStyle = gradient;
        canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        UIScreens.animateBackArrow(ctx, canvas, { value: State.isAnimatingBack }, { value: State.animationStartTimeBack });
        canvas.ctx.save();
        canvas.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        canvas.ctx.shadowBlur = 10;
        canvas.ctx.shadowOffsetY = 3;
        canvas.ctx.fillStyle = '#ffd700';
        canvas.ctx.font = 'bold 32px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('Credits', Constants.SCREEN_WIDTH / 2, 60);
        canvas.ctx.restore();
        const credits = ['Game Developer: Vihaan Krishnan', 'Title Screen Composer: Scott Joplin', 'Title Screen Performer: IE', 'Engine: HTML5 Canvas', 'First player: Tejas Deepak', 'Inspiration: Aneerudh (Krrish) Joshi, GD', 'Contributors: Aneerudh (Krrish) Joshi', 'Thanks for playing!'];
        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = '18px Arial';
        canvas.ctx.textAlign = 'center';
        credits.forEach((credit, i) => canvas.ctx.fillText(credit, Constants.SCREEN_WIDTH / 2, 150 + i * 40));
        canvas.ctx.globalAlpha = 1;
    }

    static drawSignInScreen(ctx, canvas) {
        const gradient = canvas.ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        canvas.ctx.fillStyle = gradient;
        canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        UIScreens.animateBackArrow(ctx, canvas, { value: State.isAnimatingBack }, { value: State.animationStartTimeBack });
        canvas.ctx.save();
        canvas.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        canvas.ctx.shadowBlur = 10;
        canvas.ctx.shadowOffsetY = 3;
        canvas.ctx.fillStyle = '#007bff';
        canvas.ctx.font = 'bold 32px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('Sign In', Constants.SCREEN_WIDTH / 2, 60);
        canvas.ctx.restore();
        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = '18px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('Choose your sign-in method', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 - 80);
        canvas.ctx.globalAlpha = 1;
    }

    static drawCompletionScreen(ctx, canvas, drawBlocks) {
        drawBlocks(canvas.ctx);
        canvas.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        canvas.ctx.fillStyle = '#00ff00';
        canvas.ctx.font = 'bold 32px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('You have completed the level', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 - 60);
        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = '20px Arial';
        canvas.ctx.fillText(`Jumps: ${State.jumpCount}`, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 - 10);
        canvas.ctx.fillText(`Time: ${State.completionTime}s`, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 20);
        canvas.ctx.fillStyle = '#aaaaaa';
        canvas.ctx.font = '16px Arial';
        canvas.ctx.fillText('Click to continue', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 60);
    }

    static drawDeathScreen(ctx, canvas, drawBlocks) {
        drawBlocks(canvas.ctx);
        UIScreens.animateBackArrow(ctx, canvas, { value: State.isAnimatingBack }, { value: State.animationStartTimeBack });
        canvas.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        canvas.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        canvas.ctx.fillStyle = '#ff0000';
        canvas.ctx.font = 'bold 32px Arial';
        canvas.ctx.textAlign = 'center';
        canvas.ctx.fillText('You Died', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 - 60);
        canvas.ctx.fillStyle = '#ffffff';
        canvas.ctx.font = '20px Arial';
        canvas.ctx.fillText(`Jumps: ${State.jumpCount}`, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 - 10);
        canvas.ctx.fillText(`Time: ${State.deathTime}s`, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 20);
        canvas.ctx.fillStyle = '#aaaaaa';
        canvas.ctx.font = '16px Arial';
        canvas.ctx.fillText('Click to try again', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 60);
    }
}

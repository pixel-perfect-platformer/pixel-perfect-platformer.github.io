import State from './state.js';
import Constants from './constants.js';

export class UIManager {
    static roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    static drawButtonIcon(ctx, buttonType, buttonX, buttonY) {
        if (buttonType === 'play') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(buttonX - 12, buttonY - 18);
            ctx.lineTo(buttonX - 12, buttonY + 18);
            ctx.lineTo(buttonX + 20, buttonY);
            ctx.closePath();
            ctx.fill();
        } else if (buttonType === 'editor') {
            const brickCols = [3, 2, 3, 2, 3];
            const rows = brickCols.length;
            const brickW = 18;
            const brickH = 10;
            const gap = 3;
            const totalH = rows * brickH + (rows - 1) * gap;
            const topY = buttonY - Math.floor(totalH / 2);

            ctx.lineWidth = 3;
            for (let r = 0; r < rows; r++) {
                const cols = brickCols[r];
                const rowW = cols * brickW + (cols - 1) * gap;
                const y = topY + r * (brickH + gap);
                const startX = buttonX - rowW / 2;

                ctx.save();
                ctx.fillStyle = '#d9d9d9';
                this.roundRectPath(ctx, startX - gap / 2, y - gap / 2, rowW + gap, brickH + gap, 3);
                ctx.fill();
                ctx.restore();

                for (let c = 0; c < cols; c++) {
                    const x = startX + c * (brickW + gap);

                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.55)';
                    ctx.shadowBlur = 12;
                    ctx.shadowOffsetY = 3;

                    ctx.fillStyle = '#c0392b';
                    ctx.strokeStyle = '#050505';
                    this.roundRectPath(ctx, x, y, brickW, brickH, 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();

                    ctx.fillStyle = '#ffd3c2';
                    ctx.fillRect(x + 3, y + 2, brickW - 6, brickH - 5);
                }
            }
        }
    }

    static animateButton(ctx, buttonX, buttonY, buttonRadius, animatingRef, startTimeRef, buttonType) {
        if (animatingRef.value) {
            const progress = Math.min((Date.now() - startTimeRef.value) / Constants.animationDuration, 1);
            let scale = 1;
            let shakeOffset = 0;
            if (progress < 0.25) {
                const p = progress / 0.25;
                if (p < 0.5) {
                    scale = 1 + p * 1;
                } else {
                    scale = 1.5 - (p - 0.5) * 2;
                }
            } else if (progress < 0.5) {
                shakeOffset = Math.sin((progress - 0.25) * 40) * 5;
            } else if (progress > 0.75) {
                State.fadeOpacity = (progress - 0.75) / 0.25;
                ctx.globalAlpha = 1 - State.fadeOpacity;
            }
            if (progress >= 1) {
                animatingRef.value = false;
                if (State.showTitleScreen) {
                    if (buttonType === 'play') {
                        State.showTitleScreen = false;
                        State.showLevelsScreen = true;
                        State.editorMode = false;
                        State.selectingForEditor = false;
                        State.levelCategory = 'official';
                        State.isAnimating = false;
                        State.isAnimatingEditor = false;
                        if (Constants.titleMusic) this.fadeOutMusic();
                        history.pushState({ screen: 'game' }, '', '');
                    } else if (buttonType === 'editor') {
                        State.showTitleScreen = false;
                        const isAdmin = State.currentUser && (State.currentUser.email === 'krisvih32@platformer.local' || State.currentUser.displayName === 'krisvih32');
                        State.levelCategory = isAdmin ? 'official' : 'community';
                        State.showLevelsScreen = true;
                        State.selectingForEditor = true;
                        State.currentLevelView = 0;
                        State.isAnimating = false;
                        State.isAnimatingEditor = false;
                        if (Constants.titleMusic) this.fadeOutMusic();
                        history.pushState({ screen: 'game' }, '', '');
                    }
                }
                State.fadeOpacity = 1;
                return;
            }

            ctx.save();
            ctx.translate(buttonX, buttonY);
            ctx.scale(scale, scale);
            ctx.translate(-buttonX, -buttonY);
            ctx.translate(shakeOffset, 0);

            ctx.fillStyle = buttonType === 'play' ? 'rgba(255, 100, 0, 0.3)' : 'rgba(0, 200, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(buttonX, buttonY, buttonRadius + 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = buttonType === 'play' ? '#ff6600' : '#00ccff';
            ctx.beginPath();
            ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
            ctx.fill();

            this.drawButtonIcon(ctx, buttonType, buttonX, buttonY);

            ctx.restore();
        } else {
            ctx.fillStyle = buttonType === 'play' ? 'rgba(255, 100, 0, 0.3)' : 'rgba(0, 200, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(buttonX, buttonY, buttonRadius + 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = buttonType === 'play' ? '#ff6600' : '#00ccff';
            ctx.beginPath();
            ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
            ctx.fill();

            this.drawButtonIcon(ctx, buttonType, buttonX, buttonY);
        }
    }

    static fadeOutMusic(duration = 1000) {
        if (!Constants.titleMusic || Constants.titleMusic.paused) return;
        
        const startVolume = Constants.titleMusic.volume || 1;
        const fadeStep = startVolume / (duration / 50);
        
        const fadeInterval = setInterval(() => {
            if (Constants.titleMusic.volume > fadeStep) {
                Constants.titleMusic.volume -= fadeStep;
            } else {
                Constants.titleMusic.volume = 0;
                Constants.titleMusic.pause();
                Constants.titleMusic.volume = startVolume;
                clearInterval(fadeInterval);
            }
        }, 50);
    }

    static fadeInMusic(duration = 1000) {
        if (!Constants.titleMusic) return;
        
        const targetVolume = 1;
        const fadeStep = targetVolume / (duration / 50);
        
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
}
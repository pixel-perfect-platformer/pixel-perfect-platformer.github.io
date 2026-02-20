import State from './state.js';
import Constants from './constants.js';

export class UIRenderer {
    static drawTitleScreen(ctx) {
        ctx.globalAlpha = 1;
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(0.5, '#330066');
        gradient.addColorStop(1, '#004d99');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

        // Animated background elements
        const time = Date.now() * 0.001;
        ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(100 + Math.sin(time) * 20, 100 + Math.cos(time * 0.7) * 30, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 200, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(400 + Math.cos(time * 1.3) * 25, 80 + Math.sin(time * 0.9) * 35, 60, 0, Math.PI * 2);
        ctx.fill();

        // Title
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PLATFORMER', Constants.SCREEN_WIDTH / 2, 120);

        // Buttons
        this.drawTitleButtons(ctx);
        ctx.globalAlpha = 1;
    }

    static drawTitleButtons(ctx) {
        const playX = Constants.SCREEN_WIDTH / 4;
        const playY = Constants.SCREEN_HEIGHT / 2 - 50;
        const editorX = 3 * Constants.SCREEN_WIDTH / 4;
        const editorY = Constants.SCREEN_HEIGHT / 2 - 50;
        const customizeX = Constants.SCREEN_WIDTH / 4;
        const customizeY = Constants.SCREEN_HEIGHT / 2 + 50;
        const creditsX = Constants.SCREEN_WIDTH / 2;
        const creditsY = Constants.SCREEN_HEIGHT / 2 - 50;
        const accountX = Constants.SCREEN_WIDTH / 2;
        const accountY = Constants.SCREEN_HEIGHT / 2 + 50;
        const radius = 40;

        // Draw all buttons with their animations
        this.animateButton(ctx, playX, playY, radius, State.isAnimating, State.animationStartTime, 'play');
        this.animateButton(ctx, editorX, editorY, radius, State.isAnimatingEditor, State.animationStartTimeEditor, 'editor');
        this.animateButton(ctx, customizeX, customizeY, radius, State.isAnimatingCustomize, State.animationStartTimeCustomize, 'customize');
        this.animateButton(ctx, creditsX, creditsY, radius, State.isAnimatingCredits, State.animationStartTimeCredits, 'credits');
        this.animateButton(ctx, accountX, accountY, radius, State.isAnimatingSignIn, State.animationStartTimeSignIn, 'account');
    }

    static animateButton(ctx, x, y, radius, isAnimating, startTime, type) {
        const colors = {
            play: { main: '#ff6600', glow: 'rgba(255, 100, 0, 0.3)' },
            editor: { main: '#00ccff', glow: 'rgba(0, 200, 255, 0.3)' },
            customize: { main: '#00ff00', glow: 'rgba(0, 255, 0, 0.3)' },
            credits: { main: '#ffd700', glow: 'rgba(255, 215, 0, 0.3)' },
            account: { main: '#ffa500', glow: 'rgba(255, 165, 0, 0.3)' }
        };

        let scale = 1, shakeOffset = 0;
        
        if (isAnimating) {
            const progress = Math.min((Date.now() - startTime) / Constants.animationDuration, 1);
            if (progress < 0.25) {
                const p = progress / 0.25;
                scale = p < 0.5 ? 1 + p * 1 : 1.5 - (p - 0.5) * 2;
            } else if (progress < 0.5) {
                shakeOffset = Math.sin((progress - 0.25) * 40) * 5;
            } else if (progress > 0.75) {
                State.fadeOpacity = (progress - 0.75) / 0.25;
                ctx.globalAlpha = 1 - State.fadeOpacity;
            }
            
            if (progress >= 1) {
                this.handleButtonAnimationComplete(type);
                State.fadeOpacity = 1;
                return;
            }
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.translate(-x, -y);
        ctx.translate(shakeOffset, 0);

        // Glow
        ctx.fillStyle = colors[type].glow;
        ctx.beginPath();
        ctx.arc(x, y, radius + 15, 0, Math.PI * 2);
        ctx.fill();

        // Button
        ctx.fillStyle = colors[type].main;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        this.drawButtonIcon(ctx, type, x, y);
        ctx.restore();
    }

    static drawButtonIcon(ctx, type, x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        
        const icons = {
            play: '▶',
            editor: '⚒',
            customize: '⚙',
            credits: '⭐',
            account: State.currentUser ? '👤' : '🔓'
        };
        
        ctx.fillText(icons[type] || '?', x, y + 7);
    }

    static handleButtonAnimationComplete(type) {
        const animationMap = {
            play: () => { State.isAnimating = false; },
            editor: () => { State.isAnimatingEditor = false; },
            customize: () => { State.isAnimatingCustomize = false; },
            credits: () => { State.isAnimatingCredits = false; },
            account: () => { State.isAnimatingSignIn = false; }
        };
        
        if (animationMap[type]) animationMap[type]();
        
        if (State.showTitleScreen) {
            if (type === 'play') {
                State.showTitleScreen = false;
                State.isRunning = true;
                history.pushState({ screen: 'game' }, '', '');
            } else if (type === 'editor') {
                State.showTitleScreen = false;
                const isAdmin = State.currentUser && (State.currentUser.email === 'krisvih32@platformer.local' || State.currentUser.displayName === 'krisvih32');
                State.levelCategory = isAdmin ? 'admin' : 'community';
                State.showLevelsScreen = true;
                State.selectingForEditor = true;
                State.currentLevelView = 0;
            } else if (type === 'customize') {
                State.showTitleScreen = false;
                State.showCustomizationScreen = true;
            } else if (type === 'credits') {
                State.showTitleScreen = false;
                State.showCreditsScreen = true;
            } else if (type === 'account') {
                State.showTitleScreen = false;
                State.showSignInScreen = true;
            }
        }
    }

    static drawHUD(ctx) {
        if (State.isAnimatingBack) {
            const progress = Math.min((Date.now() - State.animationStartTimeBack) / Constants.animationDuration, 1);
            
            if (progress >= 1) {
                State.isAnimatingBack = false;
                State.isRunning = false;
                State.showCustomizationScreen = false;
                State.showCreditsScreen = false;
                State.showSignInScreen = false;
                if (State.editorMode) {
                    State.editorMode = false;
                    State.showLevelsScreen = true;
                    State.selectingForEditor = true;
                    const isAdmin = State.currentUser && (State.currentUser.email === 'krisvih32@platformer.local' || State.currentUser.displayName === 'krisvih32');
                    State.levelCategory = isAdmin ? 'admin' : 'community';
                } else if (State.backFromLevel) {
                    State.showLevelsScreen = true;
                    State.backFromLevel = false;
                } else {
                    State.showTitleScreen = true;
                }
                return;
            }
        }
        
        if (!State.showTitleScreen) {
            this.drawBackArrow(ctx);
        }
        
        if (State.editorMode) {
            this.drawEditorUI(ctx);
        }
    }

    static drawBackArrow(ctx) {
        const bx = 10, by = 10, bw = 60, bh = 40, br = 6;
        
        let scale = 1, shakeOffset = 0;
        if (State.isAnimatingBack) {
            const progress = Math.min((Date.now() - State.animationStartTimeBack) / Constants.animationDuration, 1);
            if (progress < 0.25) {
                const p = progress / 0.25;
                scale = p < 0.5 ? 1 + p * 1 : 1.5 - (p - 0.5) * 2;
            } else if (progress < 0.5) {
                shakeOffset = Math.sin((progress - 0.25) * 40) * 5;
            } else if (progress > 0.75) {
                ctx.globalAlpha = 1 - (progress - 0.75) / 0.25;
            }
        }
        
        ctx.save();
        ctx.translate(bx + bw / 2, by + bh / 2);
        ctx.scale(scale, scale);
        ctx.translate(-bx - bw / 2 + shakeOffset, -by - bh / 2);
        
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#19a819';
        this.roundRectPath(ctx, bx, by, bw, bh, br);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        
        ctx.fillStyle = '#e8ffe8';
        ctx.beginPath();
        ctx.moveTo(bx + 15, by + bh / 2);
        ctx.lineTo(bx + bw - 15, by + 8);
        ctx.lineTo(bx + bw - 15, by + bh - 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    static drawLevelSwitcher(ctx) {
        const arrowY = 10, arrowSize = 30;
        const leftX = Constants.SCREEN_WIDTH - 100;
        const rightX = Constants.SCREEN_WIDTH - 40;
        
        // Left arrow
        ctx.fillStyle = State.currentLevelIndex > 0 ? '#3498db' : '#7f8c8d';
        ctx.beginPath();
        ctx.moveTo(leftX + arrowSize, arrowY);
        ctx.lineTo(leftX, arrowY + arrowSize / 2);
        ctx.lineTo(leftX + arrowSize, arrowY + arrowSize);
        ctx.closePath();
        ctx.fill();
        
        // Right arrow
        ctx.fillStyle = State.currentLevelIndex < State.levels.length - 1 ? '#3498db' : '#7f8c8d';
        ctx.beginPath();
        ctx.moveTo(rightX, arrowY);
        ctx.lineTo(rightX + arrowSize, arrowY + arrowSize / 2);
        ctx.lineTo(rightX, arrowY + arrowSize);
        ctx.closePath();
        ctx.fill();
        
        // Level indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${State.currentLevelIndex + 1}/${State.levels.length}`, (leftX + rightX + arrowSize) / 2, arrowY + arrowSize / 2 + 5);
    }

    static drawEditorUI(ctx) {
        // Editor toolbar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(70, 0, Constants.SCREEN_WIDTH, 35);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EDITOR', Constants.SCREEN_WIDTH / 2, 24);
        
        // Tool buttons
        const tools = [
            { mode: 'build', y: 367, label: 'Build' },
            { mode: 'edit', y: 412, label: 'Edit' },
            { mode: 'delete', y: 457, label: 'Delete' }
        ];

        tools.forEach(tool => {
            const isActive = State.editorToolMode === tool.mode;
            ctx.fillStyle = isActive ? '#ffff00' : '#cccccc';
            ctx.fillRect(10, tool.y, 80, 40);
            
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, tool.y, 80, 40);
            
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(tool.label, 50, tool.y + 25);
        });
        
        // Block type selectors
        if (State.editorToolMode !== 'delete') {
            const types = [
                { type: 'solid', color: '#666' },
                { type: 'end', color: 'green' },
                { type: 'kill', color: '#ff4500' }
            ];

            types.forEach((block, i) => {
                const x = 200 + i * 70;
                const y = 367;

                ctx.fillStyle = block.color;
                ctx.fillRect(x, y, 60, 30);

                const isSelected = State.currentBlockType === block.type ||
                    (State.editorToolMode === 'edit' && State.selectedBlockIndex >= 0 &&
                     State.blocks[State.selectedBlockIndex]?.type === block.type);

                ctx.strokeStyle = isSelected ? '#ffff00' : '#333';
                ctx.lineWidth = isSelected ? 3 : 2;
                ctx.strokeRect(x, y, 60, 30);
            });
        }
    }

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
}
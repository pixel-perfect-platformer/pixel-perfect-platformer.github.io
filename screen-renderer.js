import State from './state.js';
import Constants from './constants.js';
import { UIManager } from './ui-manager.js';

export class ScreenRenderer {
    static drawTitleScreen(ctx) {
        ctx.globalAlpha = 1;
        
        if (Constants.titleMusic && Constants.titleMusic.paused) {
            UIManager.fadeInMusic();
        }

        const gradient = ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(0.5, '#330066');
        gradient.addColorStop(1, '#004d99');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

        const time = Date.now() * 0.001;

        ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(100 + Math.sin(time) * 20, 100 + Math.cos(time * 0.7) * 30, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 200, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(400 + Math.cos(time * 1.3) * 25, 80 + Math.sin(time * 0.9) * 35, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PLATFORMER', Constants.SCREEN_WIDTH / 2, 120);

        const playX = Constants.SCREEN_WIDTH / 4;
        const playY = Constants.SCREEN_HEIGHT / 2 - 50;
        const playRadius = 40;

        const editorX = 3 * Constants.SCREEN_WIDTH / 4;
        const editorY = Constants.SCREEN_HEIGHT / 2 - 50;
        const editorRadius = 40;

        UIManager.animateButton(ctx, playX, playY, playRadius, { value: State.isAnimating }, { value: State.animationStartTime }, 'play');
        UIManager.animateButton(ctx, editorX, editorY, editorRadius, { value: State.isAnimatingEditor }, { value: State.animationStartTimeEditor }, 'editor');

        this.drawCustomizeButton(ctx);
        this.drawCreditsButton(ctx);
        this.drawAccountButton(ctx);

        ctx.globalAlpha = 1;
    }

    static drawCustomizeButton(ctx) {
        const customizeX = Constants.SCREEN_WIDTH / 4;
        const customizeY = Constants.SCREEN_HEIGHT / 2 + 50;
        const customizeRadius = 40;

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
                ctx.globalAlpha = 1 - State.fadeOpacity;
            }
            if (progress >= 1) {
                State.isAnimatingCustomize = false;
                State.showTitleScreen = false;
                State.showCustomizationScreen = true;
                if (Constants.titleMusic) UIManager.fadeOutMusic();
                State.fadeOpacity = 1;
                return;
            }

            ctx.save();
            ctx.translate(customizeX, customizeY);
            ctx.scale(scale, scale);
            ctx.translate(-customizeX, -customizeY);
            ctx.translate(shakeOffset, 0);

            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(customizeX, customizeY, customizeRadius + 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(customizeX, customizeY, customizeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚙', customizeX, customizeY + 7);

            ctx.restore();
        } else {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(customizeX, customizeY, customizeRadius + 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(customizeX, customizeY, customizeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚙', customizeX, customizeY + 7);
        }
    }

    static drawCreditsButton(ctx) {
        const creditsX = Constants.SCREEN_WIDTH / 2;
        const creditsY = Constants.SCREEN_HEIGHT / 2 - 50;
        const creditsRadius = 40;

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
                ctx.globalAlpha = 1 - State.fadeOpacity;
            }
            if (progress >= 1) {
                State.isAnimatingCredits = false;
                State.showTitleScreen = false;
                State.showCreditsScreen = true;
                if (Constants.titleMusic) UIManager.fadeOutMusic();
                State.fadeOpacity = 1;
                return;
            }

            ctx.save();
            ctx.translate(creditsX, creditsY);
            ctx.scale(scale, scale);
            ctx.translate(-creditsX, -creditsY);
            ctx.translate(shakeOffset, 0);

            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(creditsX, creditsY, creditsRadius + 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(creditsX, creditsY, creditsRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⭐', creditsX, creditsY + 7);

            ctx.restore();
        } else {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(creditsX, creditsY, creditsRadius + 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(creditsX, creditsY, creditsRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⭐', creditsX, creditsY + 7);
        }
    }

    static drawAccountButton(ctx) {
        const accountX = Constants.SCREEN_WIDTH / 2;
        const accountY = Constants.SCREEN_HEIGHT / 2 + 50;
        const accountRadius = 40;

        if (State.isAnimatingSignIn) {
            const progress = Math.min((Date.now() - State.animationStartTimeSignIn) / Constants.animationDuration, 1);
            let scale = 1;
            let shakeOffset = 0;
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
                State.isAnimatingSignIn = false;
                State.showTitleScreen = false;
                State.showSignInScreen = true;
                if (Constants.titleMusic) UIManager.fadeOutMusic();
                State.fadeOpacity = 1;
                return;
            }
            
            ctx.save();
            ctx.translate(accountX, accountY);
            ctx.scale(scale, scale);
            ctx.translate(-accountX, -accountY);
            ctx.translate(shakeOffset, 0);
            
            ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(accountX, accountY, accountRadius + 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffa500';
            ctx.beginPath();
            ctx.arc(accountX, accountY, accountRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(State.currentUser ? '👤' : '🔓', accountX, accountY + 8);
            
            ctx.restore();
        } else {
            ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(accountX, accountY, accountRadius + 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffa500';
            ctx.beginPath();
            ctx.arc(accountX, accountY, accountRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(State.currentUser ? '👤' : '🔓', accountX, accountY + 8);
        }
    }

    static drawCustomizationScreen(ctx) {
        const time = Date.now() * 0.001;
        const gradient = ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(0.5, '#34495e');
        gradient.addColorStop(1, '#2c3e50');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

        for (let i = 0; i < 5; i++) {
            const x = (i * 100 + time * 30) % Constants.SCREEN_WIDTH;
            const y = 50 + Math.sin(time + i) * 20;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time + i) * 0.05})`;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawBackArrow(ctx);

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Customize Player', Constants.SCREEN_WIDTH / 2, 60);
        ctx.restore();

        this.drawCustomizationTabs(ctx);
        this.drawPlayerPreview(ctx);
        this.drawColorOptions(ctx);

        ctx.globalAlpha = 1;
    }

    static drawCustomizationTabs(ctx) {
        const tabY = 80;
        const tabWidth = 100;
        const tabHeight = 35;
        const tabSpacing = 10;
        const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;

        ctx.fillStyle = State.customizeColorMode === 'inner' ? '#3498db' : '#7f8c8d';
        UIManager.roundRectPath(ctx, tabStartX, tabY, tabWidth, tabHeight, 5);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Inner', tabStartX + tabWidth / 2, tabY + tabHeight / 2 + 5);

        ctx.fillStyle = State.customizeColorMode === 'outer' ? '#3498db' : '#7f8c8d';
        UIManager.roundRectPath(ctx, tabStartX + tabWidth + tabSpacing, tabY, tabWidth, tabHeight, 5);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Outer', tabStartX + tabWidth + tabSpacing + tabWidth / 2, tabY + tabHeight / 2 + 5);
    }

    static drawPlayerPreview(ctx) {
        const previewX = Constants.SCREEN_WIDTH - 80;
        const previewY = 80;
        const previewSize = 40;
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = State.currentPlayerOuterColor;
        ctx.fillRect(previewX, previewY, previewSize, previewSize);
        ctx.fillStyle = State.currentPlayerColor;
        ctx.fillRect(previewX + 5, previewY + 5, previewSize - 10, previewSize - 10);
        ctx.restore();
        
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Preview', previewX + previewSize / 2, previewY + previewSize + 15);
    }

    static drawColorOptions(ctx) {
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
        const time = Date.now() * 0.001;

        const currentColor = State.customizeColorMode === 'inner' ? State.currentPlayerColor : State.currentPlayerOuterColor;

        for (let i = 0; i < colors.length; i++) {
            const row = Math.floor(i / colorsPerRow);
            const col = i % colorsPerRow;
            const x = startX + col * (buttonWidth + spacing);
            const y = startY + row * rowSpacing;

            const hoverScale = 1 + Math.sin(time * 2 + i) * 0.05;
            
            ctx.save();
            ctx.translate(x + buttonWidth / 2, y + buttonHeight / 2);
            ctx.scale(hoverScale, hoverScale);
            ctx.translate(-(x + buttonWidth / 2), -(y + buttonHeight / 2));

            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 4;

            ctx.fillStyle = colors[i].color;
            ctx.beginPath();
            ctx.arc(x + buttonWidth / 2, y + buttonHeight / 2, buttonWidth / 2 - 5, 0, Math.PI * 2);
            ctx.fill();

            if (currentColor === colors[i].color) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(x + buttonWidth / 2, y + buttonHeight / 2, buttonWidth / 2 - 2, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('✓', x + buttonWidth / 2, y + buttonHeight / 2 + 8);
            }

            ctx.restore();

            ctx.fillStyle = '#ecf0f1';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(colors[i].name, x + buttonWidth / 2, y + buttonHeight + 15);
        }
    }

    static drawBackArrow(ctx) {
        const bx = 10, by = 10, bw = 60, bh = 40, br = 6;
        
        if (State.isAnimatingBack) {
            const progress = Math.min((Date.now() - State.animationStartTimeBack) / Constants.animationDuration, 1);
            if (progress === 0) console.log('Back animation started, duration:', Constants.animationDuration);
            let scale = 1;
            let shakeOffsetX = 0;
            let shakeOffsetY = 0;
            if (progress < 0.25) {
                const p = progress / 0.25;
                if (p < 0.5) {
                    scale = 1 + p * 1;
                } else {
                    scale = 1.5 - (p - 0.5) * 2;
                }
            } else if (progress < 0.5) {
                shakeOffsetX = Math.sin((progress - 0.25) * 40) * 5;
                shakeOffsetY = Math.cos((progress - 0.25) * 40) * 3;
            } else if (progress > 0.75) {
                State.fadeOpacity = (progress - 0.75) / 0.25;
                ctx.globalAlpha = 1 - State.fadeOpacity;
            }
            if (progress >= 1) {
                State.isAnimatingBack = false;
                State.isRunning = false;
                State.showCompletionScreen = false;
                State.showDeathScreen = false;
                State.editorMode = false;
                if (State.backFromLevel) {
                    State.showLevelsScreen = true;
                    State.backFromLevel = false;
                } else {
                    State.showTitleScreen = true;
                }
                State.showCustomizationScreen = false;
                State.showCreditsScreen = false;
                State.showSignInScreen = false;
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

            ctx.save();
            const centerX = bx + bw / 2;
            const centerY = by + bh / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);
            ctx.translate(shakeOffsetX, shakeOffsetY);

            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            UIManager.roundRectPath(ctx, bx - 10, by - 10, bw + 20, bh + 20, br + 5);
            ctx.fill();

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = '#19a819';
            UIManager.roundRectPath(ctx, bx, by, bw, bh, br);
            ctx.fill();
            ctx.restore();
            
            ctx.fillStyle = '#e8ffe8';
            ctx.beginPath();
            ctx.moveTo(bx + 15, by + bh / 2);
            ctx.lineTo(bx + bw - 15, by + 8);
            ctx.lineTo(bx + bw - 15, by + bh - 8);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        } else {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#19a819';
            UIManager.roundRectPath(ctx, bx, by, bw, bh, br);
            ctx.fill();
            ctx.restore();
            
            ctx.fillStyle = '#e8ffe8';
            ctx.beginPath();
            ctx.moveTo(bx + 15, by + bh / 2);
            ctx.lineTo(bx + bw - 15, by + 8);
            ctx.lineTo(bx + bw - 15, by + bh - 8);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    static drawCreditsScreen(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        
        this.drawBackArrow(ctx);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Credits', Constants.SCREEN_WIDTH / 2, 60);
        
        // Credits content
        const credits = [
            'Game Developer: Vihaan Krishnan',
            'Title Screen Composer: Scott Joplin',
            'Title Screen Performer: IE',
            'Engine: HTML5 Canvas',
            'First player: Tejas Deepak',
            'Inspiration: Aneerudh (Krrish) Joshi, GD',
            'Contributors: Aneerudh (Krrish) Joshi',
            'Thanks for playing!'
        ];
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        credits.forEach((credit, i) => {
            ctx.fillText(credit, Constants.SCREEN_WIDTH / 2, 150 + i * 40);
        });
        
        ctx.globalAlpha = 1;
    }
    
    static drawSignInScreen(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        
        this.drawBackArrow(ctx);
        
        ctx.fillStyle = '#007bff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(State.currentUser ? 'Account' : 'Sign In', Constants.SCREEN_WIDTH / 2, 60);
        
        if (State.currentUser) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px Arial';
            const username = State.currentUser.email ? State.currentUser.email.replace('@platformer.local', '') : State.currentUser.displayName;
            ctx.fillText(`Signed in as: ${username}`, Constants.SCREEN_WIDTH / 2, 150);
            
            ctx.fillStyle = '#dc3545';
            UIManager.roundRectPath(ctx, Constants.SCREEN_WIDTH / 2 - 60, 200, 120, 40, 5);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('Sign Out', Constants.SCREEN_WIDTH / 2, 225);
        } else {
            ctx.fillStyle = '#4285f4';
            UIManager.roundRectPath(ctx, Constants.SCREEN_WIDTH / 2 - 80, 110, 160, 40, 5);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('Sign in with Google', Constants.SCREEN_WIDTH / 2, 135);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.fillText('- or -', Constants.SCREEN_WIDTH / 2, 175);
            
            ctx.fillStyle = '#28a745';
            UIManager.roundRectPath(ctx, Constants.SCREEN_WIDTH / 2 - 80, 195, 160, 40, 5);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('Sign In (Email)', Constants.SCREEN_WIDTH / 2, 220);
            
            ctx.fillStyle = '#17a2b8';
            UIManager.roundRectPath(ctx, Constants.SCREEN_WIDTH / 2 - 80, 250, 160, 40, 5);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('Sign Up (Email)', Constants.SCREEN_WIDTH / 2, 275);
        }
        
        ctx.globalAlpha = 1;
    }
    
    static drawLevelsScreen(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        
        if (State.isAnimatingLevelStart) {
            const progress = Math.min((Date.now() - State.animationStartTimeLevelStart) / 400, 1);
            const scale = 1 + progress * 0.5;
            ctx.globalAlpha = 1 - progress;
            
            if (progress >= 1) {
                State.isAnimatingLevelStart = false;
                const filteredLevels = State.levels.filter(l => (l.category || 'official') === State.levelCategory);
                const level = filteredLevels[State.currentLevelView];
                const actualIndex = State.levels.indexOf(level);
                window.LevelManager?.loadLevel(actualIndex);
                State.showLevelsScreen = false;
                if (!State.editorMode) {
                    State.isRunning = true;
                }
                ctx.globalAlpha = 1;
                return;
            }
            
            this.drawBackArrow(ctx);
            
            if (!State.editorMode) {
                const tabY = 15;
                const tabWidth = 100;
                const tabHeight = 30;
                const tabSpacing = 10;
                const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;
                ctx.fillStyle = State.levelCategory === 'official' ? '#3498db' : '#7f8c8d';
                UIManager.roundRectPath(ctx, tabStartX, tabY, tabWidth, tabHeight, 5);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Official', tabStartX + tabWidth / 2, tabY + tabHeight / 2 + 4);
                
                ctx.fillStyle = State.levelCategory === 'community' ? '#3498db' : '#7f8c8d';
                UIManager.roundRectPath(ctx, tabStartX + tabWidth + tabSpacing, tabY, tabWidth, tabHeight, 5);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('Community', tabStartX + tabWidth + tabSpacing + tabWidth / 2, tabY + tabHeight / 2 + 4);
            }
            
            const filteredLevels = State.levels.filter(l => (l.category || 'official') === State.levelCategory);
            const level = filteredLevels[State.currentLevelView];
            const actualIndex = State.levels.indexOf(level);
            const completed = State.levelCompletions[`level_${actualIndex}`];
            
            const boxSize = 150;
            const boxX = Constants.SCREEN_WIDTH / 2 - boxSize / 2;
            const boxY = Constants.SCREEN_HEIGHT / 2 - boxSize / 2;
            
            ctx.save();
            ctx.translate(Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2);
            ctx.scale(scale, scale);
            ctx.translate(-Constants.SCREEN_WIDTH / 2, -Constants.SCREEN_HEIGHT / 2);
            
            ctx.fillStyle = completed ? '#28a745' : '#6c757d';
            UIManager.roundRectPath(ctx, boxX, boxY, boxSize, boxSize, 10);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(State.currentLevelView + 1, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 15);
            
            ctx.restore();
            
            ctx.globalAlpha = 1;
            return;
        }
        
        if (State.isLevelAnimating) {
            const diff = State.levelSlideTarget - State.levelSlideOffset;
            State.levelSlideVelocity += diff * 0.02;
            State.levelSlideVelocity *= 0.85;
            State.levelSlideOffset += State.levelSlideVelocity;
            
            if (Math.abs(diff) < 0.5 && Math.abs(State.levelSlideVelocity) < 0.1) {
                State.levelSlideOffset = State.levelSlideTarget;
                State.levelSlideVelocity = 0;
                State.isLevelAnimating = false;
            }
        }
        
        this.drawBackArrow(ctx);
        
        if (State.editorMode || State.selectingForEditor) {
            const btnX = Constants.SCREEN_WIDTH - 120;
            const btnY = 15;
            const btnW = 110;
            const btnH = 30;
            ctx.fillStyle = '#28a745';
            UIManager.roundRectPath(ctx, btnX, btnY, btnW, btnH, 5);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('+ New Level', btnX + btnW / 2, btnY + btnH / 2 + 5);
        }
        
        if (!State.editorMode && !State.selectingForEditor) {
            const tabY = 15;
            const tabWidth = 100;
            const tabHeight = 30;
            const tabSpacing = 10;
            const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;
            
            ctx.fillStyle = State.levelCategory === 'official' ? '#3498db' : '#7f8c8d';
            UIManager.roundRectPath(ctx, tabStartX, tabY, tabWidth, tabHeight, 5);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Official', tabStartX + tabWidth / 2, tabY + tabHeight / 2 + 4);
            
            ctx.fillStyle = State.levelCategory === 'community' ? '#3498db' : '#7f8c8d';
            UIManager.roundRectPath(ctx, tabStartX + tabWidth + tabSpacing, tabY, tabWidth, tabHeight, 5);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Community', tabStartX + tabWidth + tabSpacing + tabWidth / 2, tabY + tabHeight / 2 + 4);
        }
        
        const filteredLevels = State.levels.filter(l => (l.category || 'official') === State.levelCategory);
        
        if ((State.editorMode || State.selectingForEditor) && filteredLevels.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No levels yet. Click "+ New Level" to create one.', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2);
            ctx.globalAlpha = 1;
            return;
        }
        
        if (filteredLevels.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No levels in this category', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2);
            ctx.globalAlpha = 1;
            return;
        }
        
        if (State.editorMode || State.selectingForEditor) {
            const itemHeight = 50;
            const startY = 60;
            const itemWidth = 400;
            const startX = (Constants.SCREEN_WIDTH - itemWidth) / 2;
            const itemsPerPage = Math.floor((Constants.SCREEN_HEIGHT - startY - 60) / itemHeight);
            const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);
            const currentPage = State.levelListPage + 1;
            
            if (totalPages > 1) {
                const arrowSize = 30;
                const arrowY = Constants.SCREEN_HEIGHT - 30;
                const leftArrowX = Constants.SCREEN_WIDTH / 2 - 80;
                const rightArrowX = Constants.SCREEN_WIDTH / 2 + 80;
                
                if (State.levelListPage > 0) {
                    ctx.fillStyle = '#3498db';
                    ctx.beginPath();
                    ctx.moveTo(leftArrowX + arrowSize, arrowY - arrowSize / 2);
                    ctx.lineTo(leftArrowX, arrowY);
                    ctx.lineTo(leftArrowX + arrowSize, arrowY + arrowSize / 2);
                    ctx.closePath();
                    ctx.fill();
                }
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Page ${currentPage} of ${totalPages}`, Constants.SCREEN_WIDTH / 2, arrowY + 5);
                
                if (State.levelListPage < totalPages - 1) {
                    ctx.fillStyle = '#3498db';
                    ctx.beginPath();
                    ctx.moveTo(rightArrowX, arrowY - arrowSize / 2);
                    ctx.lineTo(rightArrowX + arrowSize, arrowY);
                    ctx.lineTo(rightArrowX, arrowY + arrowSize / 2);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            
            const startIndex = State.levelListPage * itemsPerPage;
            const visibleLevels = filteredLevels.slice(startIndex, startIndex + itemsPerPage);
            
            visibleLevels.forEach((level, i) => {
                const y = startY + i * itemHeight;
                
                ctx.fillStyle = '#34495e';
                UIManager.roundRectPath(ctx, startX, y, itemWidth, itemHeight - 10, 5);
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '18px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(level.name || `Level ${startIndex + i + 1}`, startX + 15, y + 27);
            });
            
            ctx.globalAlpha = 1;
            return;
        }
        
        ctx.save();
        ctx.translate(State.levelSlideOffset, 0);
        
        const levelIndex = State.currentLevelView;
        if (levelIndex >= filteredLevels.length) {
            State.currentLevelView = 0;
            ctx.restore();
            return;
        }
        
        const level = filteredLevels[levelIndex];
        const actualIndex = State.levels.indexOf(level);
        const completed = State.levelCompletions[`level_${actualIndex}`];
        
        ctx.fillStyle = completed ? '#28a745' : '#6c757d';
        const boxSize = 150;
        const boxX = Constants.SCREEN_WIDTH / 2 - boxSize / 2;
        const boxY = Constants.SCREEN_HEIGHT / 2 - boxSize / 2;
        UIManager.roundRectPath(ctx, boxX, boxY, boxSize, boxSize, 10);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(levelIndex + 1, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 15);
        
        ctx.font = '20px Arial';
        ctx.fillText(level.name || `Level ${levelIndex + 1}`, Constants.SCREEN_WIDTH / 2, boxY + boxSize + 40);
        
        if (completed) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '16px Arial';
            ctx.fillText('✓ Completed', Constants.SCREEN_WIDTH / 2, boxY + boxSize + 65);
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('Click level to play', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT - 50);
        
        const arrowY = Constants.SCREEN_HEIGHT / 2;
        const arrowSize = 40;
        
        const leftX = 50;
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.moveTo(leftX + arrowSize, arrowY - arrowSize / 2);
        ctx.lineTo(leftX, arrowY);
        ctx.lineTo(leftX + arrowSize, arrowY + arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        
        const rightX = Constants.SCREEN_WIDTH - 50 - arrowSize;
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.moveTo(rightX, arrowY - arrowSize / 2);
        ctx.lineTo(rightX + arrowSize, arrowY);
        ctx.lineTo(rightX, arrowY + arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        ctx.globalAlpha = 1;
    }
}
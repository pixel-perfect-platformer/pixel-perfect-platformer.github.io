import State from './state.js';
import Constants from './constants.js';

export class EventHandlers {
    static keyMap = {
        up: ['ArrowUp', 'KeyW', 'Space'],
        left: ['ArrowLeft', 'KeyA'],
        right: ['ArrowRight', 'KeyD']
    };

    static setupKeyboardEvents() {
        let leftKeyPressed = false;
        let rightKeyPressed = false;
        
        document.addEventListener('keydown', (e) => {
            const { up, left, right } = this.keyMap;
            
            if (up.includes(e.code)) {
                State.upPressed = State.jumpBuffered = true;
                if (State.showTitleScreen && e.code === 'Space') {
                    e.preventDefault();
                    State.showTitleScreen = false;
                    State.isRunning = true;
                }
            } else if (left.includes(e.code)) {
                State.leftPressed = true;
                if (State.showLevelsScreen && !leftKeyPressed) {
                    leftKeyPressed = true;
                    const filteredLevels = State.levels.filter(l => (l.category || 'official') === State.levelCategory);
                    if (filteredLevels.length > 0) {
                        State.levelSlideTarget = 300;
                        State.isLevelAnimating = true;
                        setTimeout(() => {
                            State.currentLevelView = (State.currentLevelView - 1 + filteredLevels.length) % filteredLevels.length;
                            State.levelSlideOffset = -300;
                            State.levelSlideTarget = 0;
                        }, 300);
                    }
                }
            } else if (right.includes(e.code)) {
                State.rightPressed = true;
                if (State.showLevelsScreen && !rightKeyPressed) {
                    rightKeyPressed = true;
                    const filteredLevels = State.levels.filter(l => (l.category || 'official') === State.levelCategory);
                    if (filteredLevels.length > 0) {
                        State.levelSlideTarget = -300;
                        State.isLevelAnimating = true;
                        setTimeout(() => {
                            State.currentLevelView = (State.currentLevelView + 1) % filteredLevels.length;
                            State.levelSlideOffset = 300;
                            State.levelSlideTarget = 0;
                        }, 300);
                    }
                }
            } else if (e.code === 'Escape' && !State.showTitleScreen && !State.isAnimating && !State.isAnimatingEditor && !State.isAnimatingBack) {
                State.isAnimatingBack = true;
                State.animationStartTimeBack = Date.now();
                State.backFromLevel = State.isRunning || State.editorMode || State.showCompletionScreen || State.showDeathScreen;
            }
        });

        document.addEventListener('keyup', (e) => {
            const { up, left, right } = this.keyMap;
            
            if (up.includes(e.code)) {
                State.upPressed = State.jumpBuffered = false;
            } else if (left.includes(e.code)) {
                State.leftPressed = false;
                leftKeyPressed = false;
            } else if (right.includes(e.code)) {
                State.rightPressed = false;
                rightKeyPressed = false;
            }
        });
    }

    static setupBrowserEvents() {
        history.pushState(null, '', '');
        history.pushState({ screen: 'title' }, '', '');

        document.addEventListener('visibilitychange', () => {
            const music = Constants.titleMusic;
            if (document.hidden && music && !music.paused) {
                this.fadeOutMusic(500);
            } else if (!document.hidden && State.showTitleScreen && music?.paused) {
                this.fadeInMusic(500);
            }
        });
    }

    static fadeMusic(fadeIn = false, duration = 1000) {
        const music = Constants.titleMusic;
        if (!music || (!fadeIn && music.paused)) return;
        
        const startVol = fadeIn ? 0 : music.volume || 1;
        const targetVol = fadeIn ? 1 : 0;
        const step = Math.abs(targetVol - startVol) / (duration / 50);
        
        if (fadeIn) {
            music.volume = 0;
            music.play().catch(e => console.log('Music autoplay blocked:', e));
        }
        
        const interval = setInterval(() => {
            const current = music.volume;
            const next = fadeIn ? current + step : current - step;
            
            if ((fadeIn && next >= targetVol) || (!fadeIn && next <= targetVol)) {
                music.volume = targetVol;
                if (!fadeIn) {
                    music.pause();
                    music.volume = startVol;
                }
                clearInterval(interval);
            } else {
                music.volume = next;
            }
        }, 50);
    }
    
    static fadeOutMusic(duration) { this.fadeMusic(false, duration); }
    static fadeInMusic(duration) { this.fadeMusic(true, duration); }

    static setupCanvasEvents(canvas) {
        const events = [
            ['mousedown', 'handleMouseDown'],
            ['mousemove', 'handleMouseMove'], 
            ['mouseup', 'handleMouseUp'],
            ['touchstart', 'handleTouchStart', { passive: false }],
            ['touchend', 'handleTouchEnd', { passive: false }],
            ['contextmenu', 'handleContextMenu'],
            ['dblclick', 'handleDoubleClick']
        ];
        
        events.forEach(([event, handler, options]) => {
            canvas.canvas.addEventListener(event, this[handler].bind(this), options);
        });
    }

    static handleMouseDown(e) {
        if (e.button !== 0) return;
        const pos = this.getGameCoords(e);

        if (State.showTitleScreen) {
            const button = this.getTitleButtonAt(pos);
            if (button) {
                State.pressedTitleButton = button;
                State.titleButtonIsDown = true;
            }
        } else if (State.showCompletionScreen) {
            this.handleCompletionClick();
        } else if (State.showDeathScreen) {
            this.handleDeathClick();
        } else if (State.showCustomizationScreen) {
            if (this.isBackArrowClick(pos)) {
                this.triggerBackAnimation();
            } else {
                EventHandlers.handleCustomizationClick(pos);
            }
        } else if (State.showCreditsScreen || State.showSignInScreen) {
            if (this.isBackArrowClick(pos)) {
                this.triggerBackAnimation();
            } else if (State.showSignInScreen) {
                EventHandlers.handleSignInClick(pos);
            }
        } else if (State.showLevelsScreen) {
            if (this.isBackArrowClick(pos)) {
                this.triggerBackAnimation();
            } else {
                EventHandlers.handleLevelsClick(pos);
            }
        } else if (this.isBackArrowClick(pos)) {
            this.triggerBackAnimation();
        } else if (State.editorMode) {
            this.handleEditorClick(pos);
        } else if (!State.editorMode && State.levels.length > 1) {
            this.handleLevelSwitcherClick(pos);
        }
    }
    
    static handleMouseMove(e) {
        if (!State.showLevelsScreen) return;
        
        const pos = this.getGameCoords(e);
        const arrowY = Constants.SCREEN_HEIGHT / 2;
        const arrowSize = 40;
        
        const wasHoverLeft = State.levelHoverLeft;
        const wasHoverRight = State.levelHoverRight;
        
        State.levelHoverLeft = false;
        State.levelHoverRight = false;
        
        if (State.currentLevelView > 0) {
            const leftX = 50;
            if (pos.x >= leftX && pos.x <= leftX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                State.levelHoverLeft = true;
                const centerX = leftX + arrowSize / 2;
                const centerY = arrowY;
                const dist = Math.sqrt((pos.x - centerX) ** 2 + (pos.y - centerY) ** 2);
                const slideAmount = Math.max(5, 100 - dist * 2);
                State.levelSlideTarget = slideAmount;
                State.isLevelAnimating = true;
            }
        }
        
        if (State.currentLevelView < State.levels.length - 1) {
            const rightX = Constants.SCREEN_WIDTH - 50 - arrowSize;
            if (pos.x >= rightX && pos.x <= rightX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                State.levelHoverRight = true;
                const centerX = rightX + arrowSize / 2;
                const centerY = arrowY;
                const dist = Math.sqrt((pos.x - centerX) ** 2 + (pos.y - centerY) ** 2);
                const slideAmount = Math.max(5, 100 - dist * 2);
                State.levelSlideTarget = -slideAmount;
                State.isLevelAnimating = true;
            }
        }
        
        if (!State.levelHoverLeft && !State.levelHoverRight && (wasHoverLeft || wasHoverRight)) {
            State.levelSlideTarget = 0;
            State.isLevelAnimating = true;
        }
    }
    
    static handleMouseUp(e) {
        const pos = this.getGameCoords(e);
        
        if (State.showLevelsScreen) {
            State.levelHoverLeft = false;
            State.levelHoverRight = false;
            const arrowY = Constants.SCREEN_HEIGHT / 2;
            const arrowSize = 40;
            const filteredLevels = State.levels.filter(l => (l.category || 'official') === State.levelCategory);
            if (State.currentLevelView > 0) {
                const leftX = 50;
                if (pos.x >= leftX && pos.x <= leftX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                    State.levelSlideTarget = 300;
                    State.isLevelAnimating = true;
                    setTimeout(() => {
                        State.currentLevelView--;
                        State.levelSlideOffset = -300;
                        State.levelSlideTarget = 0;
                    }, 300);
                }
            }
            if (State.currentLevelView < filteredLevels.length - 1) {
                const rightX = Constants.SCREEN_WIDTH - 50 - arrowSize;
                if (pos.x >= rightX && pos.x <= rightX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                    State.levelSlideTarget = -300;
                    State.isLevelAnimating = true;
                    setTimeout(() => {
                        State.currentLevelView++;
                        State.levelSlideOffset = 300;
                        State.levelSlideTarget = 0;
                    }, 300);
                }
            }
        }
        
        if (State.showTitleScreen && State.pressedTitleButton) {
            const button = this.getTitleButtonAt(pos);
            if (button === State.pressedTitleButton) {
                this.triggerButtonAnimation(button);
            }
            State.pressedTitleButton = null;
            State.titleButtonIsDown = false;
        }
    }
    
    static handleTouchStart(e) {}
    static handleTouchEnd(e) {}
    static handleContextMenu(e) { e.preventDefault(); }
    static handleDoubleClick(e) {}
    
    static triggerButtonAnimation(button) {
        if (button === 'github') {
            window.open('https://github.com/pixel-perfect-platformer/pixel-perfect-platformer.github.io/issues', '_blank');
        } else if (button === 'play' && !State.isAnimating) {
            State.isAnimating = true;
            State.animationStartTime = Date.now();
        } else if (button === 'editor' && !State.isAnimatingEditor) {
            State.isAnimatingEditor = true;
            State.animationStartTimeEditor = Date.now();
        } else if (button === 'customize' && !State.isAnimatingCustomize) {
            State.isAnimatingCustomize = true;
            State.animationStartTimeCustomize = Date.now();
        } else if (button === 'credits' && !State.isAnimatingCredits) {
            State.isAnimatingCredits = true;
            State.animationStartTimeCredits = Date.now();
        } else if (button === 'account' && !State.isAnimatingSignIn) {
            State.isAnimatingSignIn = true;
            State.animationStartTimeSignIn = Date.now();
        }
    }
    
    static getTitleButtonAt(pos) {
        const buttons = [
            { x: Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 - 50, type: 'play' },
            { x: 3 * Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 - 50, type: 'editor' },
            { x: Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 + 50, type: 'customize' },
            { x: Constants.SCREEN_WIDTH / 2, y: Constants.SCREEN_HEIGHT / 2 - 50, type: 'credits' },
            { x: Constants.SCREEN_WIDTH / 2, y: Constants.SCREEN_HEIGHT / 2 + 50, type: 'account' },
            { x: 3 * Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 + 50, type: 'github' }
        ];

        for (const btn of buttons) {
            const dist = Math.sqrt((pos.x - btn.x) ** 2 + (pos.y - btn.y) ** 2);
            if (dist <= 40) return btn.type;
        }
        return null;
    }
    
    static getGameCoords(evt) {
        const canvas = document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();
        const scaleX = Constants.scaleX || 1;
        const scaleY = Constants.scaleY || 1;
        return {
            x: (evt.clientX - rect.left) / scaleX,
            y: (evt.clientY - rect.top) / scaleY
        };
    }
    
    static isBackArrowClick(pos) {
        return pos.x >= 10 && pos.x <= 70 && pos.y >= 10 && pos.y <= 50;
    }
    
    static triggerBackAnimation() {
        if (!State.isAnimatingBack) {
            State.isAnimatingBack = true;
            State.animationStartTimeBack = Date.now();
            State.backFromLevel = State.isRunning || State.editorMode || State.showCompletionScreen || State.showDeathScreen;
        }
    }
    
    static handleCompletionClick() {
        State.showCompletionScreen = false;
        State.levelCompleted = false;
        State.showLevelsScreen = true;
        State.isRunning = false;
    }
    
    static handleDeathClick() {
        State.showDeathScreen = false;
        window.LevelManager?.loadLevel(State.currentLevelIndex);
        State.isRunning = true;
    }
    
    static handleLevelSwitcherClick(pos) {
        const arrowY = 10, arrowSize = 30;
        const leftX = Constants.SCREEN_WIDTH - 100;
        const rightX = Constants.SCREEN_WIDTH - 40;
        
        if (pos.y >= arrowY && pos.y <= arrowY + arrowSize) {
            if (pos.x >= leftX && pos.x <= leftX + arrowSize && State.currentLevelIndex > 0) {
                window.LevelManager?.loadLevel(State.currentLevelIndex - 1);
                State.isRunning = true;
            } else if (pos.x >= rightX && pos.x <= rightX + arrowSize && State.currentLevelIndex < State.levels.length - 1) {
                window.LevelManager?.loadLevel(State.currentLevelIndex + 1);
                State.isRunning = true;
            }
        }
    }
    
    static handleEditorClick(pos) {
        const blockTypes = ['solid', 'end', 'kill'];
        for (let i = 0; i < blockTypes.length; i++) {
            const bx = 200 + i * 70, by = 367;
            if (pos.x >= bx && pos.x <= bx + 60 && pos.y >= by && pos.y <= by + 30) {
                if (State.editorToolMode === 'edit' && State.selectedBlockIndex >= 0) {
                    State.blocks[State.selectedBlockIndex].type = blockTypes[i];
                } else {
                    State.currentBlockType = blockTypes[i];
                }
                return;
            }
        }

        const tools = [{ mode: 'build', y: 367 }, { mode: 'edit', y: 412 }, { mode: 'delete', y: 457 }];
        for (const tool of tools) {
            if (pos.x >= 10 && pos.x <= 90 && pos.y >= tool.y && pos.y <= tool.y + 40) {
                State.editorToolMode = tool.mode;
                State.selectedBlockIndex = -1;
                return;
            }
        }

        const blockIndex = this.findBlockAt(pos.x, pos.y);
        if (blockIndex >= 0) {
            if (State.editorToolMode === 'delete') {
                State.blocks.splice(blockIndex, 1);
            } else if (State.editorToolMode === 'edit') {
                State.selectedBlockIndex = blockIndex;
            }
        } else if (State.editorToolMode === 'build' && pos.y < 367) {
            const grid = 10;
            const gx = Math.floor(pos.x / grid) * grid;
            const gy = Math.floor(pos.y / grid) * grid;
            State.blocks.push({ x: gx, y: gy, width: 40, height: 10, type: State.currentBlockType });
        } else if (State.editorToolMode === 'edit') {
            State.selectedBlockIndex = -1;
        }
    }
    
    static findBlockAt(x, y) {
        for (let i = 0; i < State.blocks.length; i++) {
            const b = State.blocks[i];
            if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                return i;
            }
        }
        return -1;
    }
    
    static handleCustomizationClick(pos) {
        const colors = ['#000000', '#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080', '#ffa500', '#ffc0cb'];
        const size = 70, spacing = 15, perRow = 4;
        const startX = (Constants.SCREEN_WIDTH - (perRow * (size + spacing) - spacing)) / 2;
        const startY = 150, rowSpacing = 90;

        colors.forEach((color, i) => {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            const x = startX + col * (size + spacing) + size / 2;
            const y = startY + row * rowSpacing + size / 2;
            const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);

            if (dist <= size / 2) {
                if (State.customizeColorMode === 'inner') {
                    State.currentPlayerColor = color;
                } else {
                    State.currentPlayerOuterColor = color;
                }
                try {
                    localStorage.setItem('platformer_player_colors', JSON.stringify({
                        inner: State.currentPlayerColor,
                        outer: State.currentPlayerOuterColor
                    }));
                } catch (e) {}
            }
        });
        
        const tabY = 80, tabWidth = 100, tabHeight = 35, tabSpacing = 10;
        const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;
        ['inner', 'outer'].forEach((mode, i) => {
            const x = tabStartX + i * (tabWidth + tabSpacing);
            if (pos.x >= x && pos.x <= x + tabWidth && pos.y >= tabY && pos.y <= tabY + tabHeight) {
                State.customizeColorMode = mode;
            }
        });
    }
    
    static async handleSignInClick(pos) {
        const { AuthService } = await import('./auth-service.js');
        
        if (State.currentUser) {
            if (pos.x >= Constants.SCREEN_WIDTH / 2 - 60 && pos.x <= Constants.SCREEN_WIDTH / 2 + 60 &&
                pos.y >= 200 && pos.y <= 240) {
                await AuthService.signOut();
            }
        } else {
            if (pos.x >= Constants.SCREEN_WIDTH / 2 - 80 && pos.x <= Constants.SCREEN_WIDTH / 2 + 80) {
                if (pos.y >= 110 && pos.y <= 150) {
                    await AuthService.signInWithGoogle();
                } else if (pos.y >= 195 && pos.y <= 235) {
                    const username = prompt('Enter username:');
                    if (!username) return;
                    const password = prompt('Enter password:');
                    if (!password) return;
                    await AuthService.signInWithEmail(username + '@platformer.local', password);
                } else if (pos.y >= 250 && pos.y <= 290) {
                    const username = prompt('Enter username:');
                    if (!username) return;
                    const password = prompt('Enter password:');
                    if (!password) return;
                    await AuthService.signUpWithEmail(username + '@platformer.local', password);
                }
            }
        }
    }
    
    static handleLevelsClick(pos) {
        if (State.isAnimatingLevelStart) return;
        
        if (State.selectingForEditor) {
            const btnX = Constants.SCREEN_WIDTH - 120;
            const btnY = 15;
            const btnW = 110;
            const btnH = 30;
            if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
                const name = prompt('Enter level name:') || 'New Level';
                State.levels.push({ name, blocks: [], texts: [], category: State.levelCategory });
                window.LevelManager?.saveLevelsToStorage();
                return;
            }
            
            const isAdmin = State.currentUser && (State.currentUser.email === 'krisvih32@platformer.local' || State.currentUser.displayName === 'krisvih32');
            if (isAdmin) {
                const tabY = 15;
                const tabWidth = 100;
                const tabHeight = 30;
                const tabSpacing = 10;
                const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;
                
                if (pos.y >= tabY && pos.y <= tabY + tabHeight) {
                    if (pos.x >= tabStartX && pos.x <= tabStartX + tabWidth) {
                        State.levelCategory = 'official';
                        State.levelListPage = 0;
                        return;
                    } else if (pos.x >= tabStartX + tabWidth + tabSpacing && pos.x <= tabStartX + 2 * tabWidth + tabSpacing) {
                        State.levelCategory = 'community';
                        State.levelListPage = 0;
                        return;
                    }
                }
            }
            
            const filteredLevels = State.levels.filter(l => (l.category || 'official') === State.levelCategory);
            const itemHeight = 50;
            const startY = 60;
            const itemWidth = 400;
            const startX = (Constants.SCREEN_WIDTH - itemWidth) / 2;
            const itemsPerPage = Math.floor((Constants.SCREEN_HEIGHT - startY - 60) / itemHeight);
            const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);
            
            if (totalPages > 1) {
                const arrowSize = 30;
                const arrowY = Constants.SCREEN_HEIGHT - 30;
                const leftArrowX = Constants.SCREEN_WIDTH / 2 - 80;
                const rightArrowX = Constants.SCREEN_WIDTH / 2 + 80;
                
                if (State.levelListPage > 0 && pos.x >= leftArrowX && pos.x <= leftArrowX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                    State.levelListPage--;
                    return;
                }
                
                if (State.levelListPage < totalPages - 1 && pos.x >= rightArrowX && pos.x <= rightArrowX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                    State.levelListPage++;
                    return;
                }
            }
            
            const startIndex = State.levelListPage * itemsPerPage;
            const visibleLevels = filteredLevels.slice(startIndex, startIndex + itemsPerPage);
            
            visibleLevels.forEach((level, i) => {
                const y = startY + i * itemHeight;
                const deleteX = startX + itemWidth - 35;
                const deleteY = y + 5;
                
                if (pos.x >= deleteX && pos.x <= deleteX + 30 && pos.y >= deleteY && pos.y <= deleteY + 30) {
                    if (confirm(`Delete "${level.name || `Level ${startIndex + i + 1}`}"?`)) {
                        const actualIndex = State.levels.indexOf(level);
                        State.levels.splice(actualIndex, 1);
                        window.LevelManager?.saveLevelsToStorage();
                        if (State.levelListPage > 0 && filteredLevels.length - 1 <= State.levelListPage * itemsPerPage) {
                            State.levelListPage--;
                        }
                    }
                    return;
                }
                
                if (pos.x >= startX && pos.x <= startX + itemWidth && pos.y >= y && pos.y <= y + itemHeight - 10) {
                    if (State.editorMode && State.levels[State.currentLevelIndex]) {
                        State.levels[State.currentLevelIndex].blocks = window.LevelManager.cloneData(State.blocks);
                        State.levels[State.currentLevelIndex].texts = window.LevelManager.cloneData(State.texts);
                    }
                    const actualIndex = State.levels.indexOf(level);
                    window.LevelManager?.loadLevel(actualIndex);
                    State.showLevelsScreen = false;
                    State.selectingForEditor = false;
                    State.editorMode = true;
                }
            });
            return;
        }
        
        if (State.editorMode) {
            const btnX = Constants.SCREEN_WIDTH - 120;
            const btnY = 15;
            const btnW = 110;
            const btnH = 30;
            if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
                const name = prompt('Enter level name:') || 'New Level';
                State.levels.push({ name, blocks: [], texts: [], category: State.levelCategory });
                window.LevelManager?.saveLevelsToStorage();
                return;
            }
            
            const isAdmin = State.currentUser && (State.currentUser.email === 'krisvih32@platformer.local' || State.currentUser.displayName === 'krisvih32');
            if (isAdmin) {
                const tabY = 15;
                const tabWidth = 100;
                const tabHeight = 30;
                const tabSpacing = 10;
                const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;
                
                if (pos.y >= tabY && pos.y <= tabY + tabHeight) {
                    if (pos.x >= tabStartX && pos.x <= tabStartX + tabWidth) {
                        State.levelCategory = 'official';
                        State.levelListPage = 0;
                        return;
                    } else if (pos.x >= tabStartX + tabWidth + tabSpacing && pos.x <= tabStartX + 2 * tabWidth + tabSpacing) {
                        State.levelCategory = 'community';
                        State.levelListPage = 0;
                        return;
                    }
                }
            }
            
            const filteredLevels = State.levels.filter(l => (l.category || 'official') === State.levelCategory);
            const itemHeight = 50;
            const startY = 60;
            const itemWidth = 400;
            const startX = (Constants.SCREEN_WIDTH - itemWidth) / 2;
            const itemsPerPage = Math.floor((Constants.SCREEN_HEIGHT - startY - 60) / itemHeight);
            const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);
            
            if (totalPages > 1) {
                const arrowSize = 30;
                const arrowY = Constants.SCREEN_HEIGHT - 30;
                const leftArrowX = Constants.SCREEN_WIDTH / 2 - 80;
                const rightArrowX = Constants.SCREEN_WIDTH / 2 + 80;
                
                if (State.levelListPage > 0 && pos.x >= leftArrowX && pos.x <= leftArrowX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                    State.levelListPage--;
                    return;
                }
                
                if (State.levelListPage < totalPages - 1 && pos.x >= rightArrowX && pos.x <= rightArrowX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                    State.levelListPage++;
                    return;
                }
            }
            
            const startIndex = State.levelListPage * itemsPerPage;
            const visibleLevels = filteredLevels.slice(startIndex, startIndex + itemsPerPage);
            
            visibleLevels.forEach((level, i) => {
                const y = startY + i * itemHeight;
                const deleteX = startX + itemWidth - 35;
                const deleteY = y + 5;
                
                if (pos.x >= deleteX && pos.x <= deleteX + 30 && pos.y >= deleteY && pos.y <= deleteY + 30) {
                    if (confirm(`Delete "${level.name || `Level ${startIndex + i + 1}`}"?`)) {
                        const actualIndex = State.levels.indexOf(level);
                        State.levels.splice(actualIndex, 1);
                        window.LevelManager?.saveLevelsToStorage();
                        if (State.levelListPage > 0 && filteredLevels.length - 1 <= State.levelListPage * itemsPerPage) {
                            State.levelListPage--;
                        }
                    }
                    return;
                }
                
                if (pos.x >= startX && pos.x <= startX + itemWidth && pos.y >= y && pos.y <= y + itemHeight - 10) {
                    if (State.editorMode && State.levels[State.currentLevelIndex]) {
                        State.levels[State.currentLevelIndex].blocks = window.LevelManager.cloneData(State.blocks);
                        State.levels[State.currentLevelIndex].texts = window.LevelManager.cloneData(State.texts);
                    }
                    const actualIndex = State.levels.indexOf(level);
                    window.LevelManager?.loadLevel(actualIndex);
                    State.showLevelsScreen = false;
                }
            });
            return;
        }
        
        const tabY = 15;
        const tabWidth = 100;
        const tabHeight = 30;
        const tabSpacing = 10;
        const isAdmin = State.currentUser && (State.currentUser.email === 'krisvih32@platformer.local' || State.currentUser.displayName === 'krisvih32');
        const numTabs = isAdmin ? 3 : 2;
        const tabStartX = Constants.SCREEN_WIDTH / 2 - (numTabs * tabWidth + (numTabs - 1) * tabSpacing) / 2;
        
        if (pos.y >= tabY && pos.y <= tabY + tabHeight) {
            if (pos.x >= tabStartX && pos.x <= tabStartX + tabWidth) {
                State.levelCategory = 'official';
                State.currentLevelView = 0;
                return;
            } else if (pos.x >= tabStartX + tabWidth + tabSpacing && pos.x <= tabStartX + tabWidth * 2 + tabSpacing) {
                State.levelCategory = 'community';
                State.currentLevelView = 0;
                return;
            } else if (isAdmin && pos.x >= tabStartX + 2 * (tabWidth + tabSpacing) && pos.x <= tabStartX + 3 * tabWidth + 2 * tabSpacing) {
                State.levelCategory = 'admin';
                State.currentLevelView = 0;
                return;
            }
        }
        
        const filteredLevels = State.levels.filter(l => (l.category || 'official') === State.levelCategory);
        const boxSize = 150;
        const boxX = Constants.SCREEN_WIDTH / 2 - boxSize / 2;
        const boxY = Constants.SCREEN_HEIGHT / 2 - boxSize / 2;
        
        if (pos.x >= boxX && pos.x <= boxX + boxSize && pos.y >= boxY && pos.y <= boxY + boxSize) {
            State.isAnimatingLevelStart = true;
            State.animationStartTimeLevelStart = Date.now();
            return;
        }
        
        const arrowY = Constants.SCREEN_HEIGHT / 2;
        const arrowSize = 40;
        
        State.levelHoverLeft = false;
        State.levelHoverRight = false;
        
        if (State.currentLevelView > 0) {
            const leftX = 50;
            if (pos.x >= leftX && pos.x <= leftX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                State.levelHoverLeft = true;
            }
        }
        
        if (State.currentLevelView < filteredLevels.length - 1) {
            const rightX = Constants.SCREEN_WIDTH - 50 - arrowSize;
            if (pos.x >= rightX && pos.x <= rightX + arrowSize && pos.y >= arrowY - arrowSize / 2 && pos.y <= arrowY + arrowSize / 2) {
                State.levelHoverRight = true;
            }
        }
    }
}
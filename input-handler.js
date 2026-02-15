import State from './state.js';
import Constants from './constants.js';

export class InputHandler {
    constructor(canvas, editor) {
        this.canvas = canvas;
        this.editor = editor;
        this.setupKeyboardListeners();
        this.setupMouseListeners();
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
            State.upPressed = true;
            State.jumpBuffered = true;
            
            if (State.showTitleScreen && e.code === 'Space') {
                e.preventDefault();
                State.showTitleScreen = false;
                State.isRunning = true;
            }
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            State.leftPressed = true;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            State.rightPressed = true;
        } else if (e.code === 'Escape') {
            this.handleEscape();
        }
    }

    handleKeyUp(e) {
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
            State.upPressed = false;
            State.jumpBuffered = false;
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            State.leftPressed = false;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            State.rightPressed = false;
        }
    }

    handleEscape() {
        if (!State.showTitleScreen && !State.isAnimating && 
            !State.isAnimatingEditor && !State.isAnimatingBack) {
            State.isRunning = false;
            State.editorMode = false;
            State.isAnimatingBack = true;
            State.animationStartTimeBack = Date.now();
        }
    }

    setupMouseListeners() {
        this.canvas.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    handleMouseDown(e) {
        if (e.button !== 0) return;
        const pos = this.getGameCoords(e);

        if (State.showTitleScreen) {
            this.handleTitleScreenClick(pos);
            return;
        }

        if (this.isBackArrowClick(pos)) {
            this.triggerBackAnimation();
            return;
        }

        if (State.editorMode) {
            this.handleEditorClick(pos);
        }
    }

    handleMouseMove(e) {
        if (!State.editorMode) return;
        const pos = this.getGameCoords(e);

        if (State.draggingBlockIndex >= 0 && State.blocks[State.draggingBlockIndex]) {
            this.dragBlock(pos);
        }
    }

    handleMouseUp(e) {
        const pos = this.getGameCoords(e);

        if (State.showCustomizationScreen) {
            this.handleCustomizationClick(pos);
            return;
        }

        if (State.draggingBlockIndex >= 0) {
            State.draggingBlockIndex = -1;
            // Save level after dragging
        }
    }

    handleTitleScreenClick(pos) {
        const button = this.getTitleButtonAt(pos);
        if (button) {
            State.pressedTitleButton = button;
            State.titleButtonIsDown = true;
        }
    }

    handleEditorClick(pos) {
        const toolBtn = this.editor.getToolButtonAt(pos.x, pos.y);
        if (toolBtn) {
            if (['solid', 'end', 'kill'].includes(toolBtn)) {
                if (State.editorToolMode === 'edit' && State.selectedBlockIndex >= 0) {
                    State.blocks[State.selectedBlockIndex].type = toolBtn;
                } else {
                    State.currentBlockType = toolBtn;
                }
            } else {
                this.editor.setToolMode(toolBtn);
            }
            return;
        }

        const blockIndex = this.editor.findBlockAt(pos.x, pos.y);
        
        if (blockIndex >= 0) {
            if (State.editorToolMode === 'delete') {
                State.blocks.splice(blockIndex, 1);
            } else if (State.editorToolMode === 'edit') {
                State.selectedBlockIndex = blockIndex;
                State.draggingBlockIndex = blockIndex;
                const b = State.blocks[blockIndex];
                State.dragBlockOffsetX = pos.x - b.x;
                State.dragBlockOffsetY = pos.y - b.y;
            }
        } else if (State.editorToolMode === 'build') {
            this.editor.addBlock(pos.x, pos.y);
        } else if (State.editorToolMode === 'edit') {
            State.selectedBlockIndex = -1;
        }
    }

    handleCustomizationClick(pos) {
        if (this.isBackArrowClick(pos)) {
            this.triggerBackAnimation();
            return;
        }

        const colors = ['#000000', '#ff0000', '#0000ff', '#00ff00', 
                       '#ffff00', '#800080', '#ffa500', '#ffc0cb'];
        const size = 70, spacing = 15, perRow = 4;
        const startX = (Constants.SCREEN_WIDTH - (perRow * (size + spacing) - spacing)) / 2;

        colors.forEach((color, i) => {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            const x = startX + col * (size + spacing) + size / 2;
            const y = 150 + row * 90 + size / 2;
            const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);

            if (dist <= size / 2) {
                if (State.customizeColorMode === 'inner') {
                    State.currentPlayerColor = color;
                } else {
                    State.currentPlayerOuterColor = color;
                }
                this.savePlayerColors();
            }
        });
    }

    dragBlock(pos) {
        const grid = 10;
        const nx = Math.floor((pos.x - State.dragBlockOffsetX) / grid) * grid;
        const ny = Math.floor((pos.y - State.dragBlockOffsetY) / grid) * grid;
        
        if (ny + State.blocks[State.draggingBlockIndex].height <= 367) {
            State.blocks[State.draggingBlockIndex].x = nx;
            State.blocks[State.draggingBlockIndex].y = ny;
        }
    }

    getGameCoords(evt) {
        const rect = this.canvas.canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) / Constants.scaleX,
            y: (evt.clientY - rect.top) / Constants.scaleY
        };
    }

    isBackArrowClick(pos) {
        return pos.x >= 10 && pos.x <= 70 && pos.y >= 10 && pos.y <= 50;
    }

    triggerBackAnimation() {
        State.isAnimating = false;
        State.isAnimatingEditor = false;
        State.isAnimatingCustomize = false;
        if (!State.isAnimatingBack) {
            State.isAnimatingBack = true;
            State.animationStartTimeBack = Date.now();
        }
    }

    getTitleButtonAt(pos) {
        const buttons = [
            { x: Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 - 50, type: 'play' },
            { x: 3 * Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 - 50, type: 'editor' },
            { x: Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 + 50, type: 'customize' },
            { x: Constants.SCREEN_WIDTH / 2, y: Constants.SCREEN_HEIGHT / 2 - 50, type: 'credits' },
            { x: Constants.SCREEN_WIDTH / 2, y: Constants.SCREEN_HEIGHT / 2 + 50, type: 'account' }
        ];

        for (const btn of buttons) {
            const dist = Math.sqrt((pos.x - btn.x) ** 2 + (pos.y - btn.y) ** 2);
            if (dist <= 40) return btn.type;
        }
        return null;
    }

    savePlayerColors() {
        try {
            localStorage.setItem('platformer_player_colors', JSON.stringify({
                inner: State.currentPlayerColor,
                outer: State.currentPlayerOuterColor
            }));
        } catch (e) {
            console.error('Failed to save player colors:', e);
        }
    }
}

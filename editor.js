import State from './state.js';
import Constants from './constants.js';

export class Editor {
    constructor(canvas, levelManager) {
        this.canvas = canvas;
        this.ctx = canvas.ctx;
        this.levelManager = levelManager;
    }

    drawUI() {
        if (!State.editorMode) return;

        this._drawToolbar();
        this._drawToolButtons();
        this._drawBlockTypeSelectors();
    }

    _drawToolbar() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(70, 0, Constants.SCREEN_WIDTH, 35);

        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('EDITOR', Constants.SCREEN_WIDTH / 2, 24);
    }

    _drawToolButtons() {
        const tools = [
            { mode: 'build', y: 367, label: 'Build' },
            { mode: 'edit', y: 412, label: 'Edit' },
            { mode: 'delete', y: 457, label: 'Delete' }
        ];

        tools.forEach(tool => {
            const isActive = State.editorToolMode === tool.mode;
            this.ctx.fillStyle = isActive ? '#ffff00' : '#cccccc';
            this.ctx.fillRect(10, tool.y, 80, 40);
            
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(10, tool.y, 80, 40);
            
            this.ctx.fillStyle = '#000';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(tool.label, 50, tool.y + 25);
        });
    }

    _drawBlockTypeSelectors() {
        if (State.editorToolMode === 'delete') return;

        const types = [
            { type: 'solid', color: '#666' },
            { type: 'end', color: 'green' },
            { type: 'kill', color: '#ff4500' }
        ];

        types.forEach((block, i) => {
            const x = 200 + i * 70;
            const y = 367;

            this.ctx.fillStyle = block.color;
            this.ctx.fillRect(x, y, 60, 30);

            const isSelected = State.currentBlockType === block.type ||
                (State.editorToolMode === 'edit' && State.selectedBlockIndex >= 0 &&
                 State.blocks[State.selectedBlockIndex]?.type === block.type);

            this.ctx.strokeStyle = isSelected ? '#ffff00' : '#333';
            this.ctx.lineWidth = isSelected ? 3 : 2;
            this.ctx.strokeRect(x, y, 60, 30);
        });
    }

    addBlock(x, y) {
        const grid = 10;
        const gx = Math.floor(x / grid) * grid;
        const gy = Math.floor(y / grid) * grid;
        
        if (gy + 10 > 367) return;

        if (State.currentBlockType === 'start') {
            State.blocks = State.blocks.filter(b => b.type !== 'start');
        }

        State.blocks.push({
            x: gx,
            y: gy,
            width: 40,
            height: 10,
            type: State.currentBlockType
        });
    }

    removeBlock(x, y) {
        for (let i = State.blocks.length - 1; i >= 0; i--) {
            const b = State.blocks[i];
            if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                State.blocks.splice(i, 1);
                return;
            }
        }
    }

    findBlockAt(x, y) {
        for (let i = 0; i < State.blocks.length; i++) {
            const b = State.blocks[i];
            if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                return i;
            }
        }
        return -1;
    }

    getToolButtonAt(x, y) {
        const blockTypes = ['solid', 'end', 'kill'];
        
        for (let i = 0; i < blockTypes.length; i++) {
            const bx = 200 + i * 70;
            const by = 367;
            if (x >= bx && x <= bx + 60 && y >= by && y <= by + 30) {
                return blockTypes[i];
            }
        }

        const tools = [
            { mode: 'build', y: 367 },
            { mode: 'edit', y: 412 },
            { mode: 'delete', y: 457 }
        ];

        for (const tool of tools) {
            if (x >= 10 && x <= 90 && y >= tool.y && y <= tool.y + 40) {
                return tool.mode;
            }
        }

        return null;
    }

    setToolMode(mode) {
        State.editorToolMode = mode;
        State.selectedBlockIndex = -1;
    }
}

import State from './state.js';
import Constants from './constants.js';

export class ScreenRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.ctx;
    }

    drawTitleScreen() {
        const gradient = this.ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(0.5, '#330066');
        gradient.addColorStop(1, '#004d99');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

        const time = Date.now() * 0.001;
        this._drawFloatingCircles(time);
        this._drawTitle();
        this._drawTitleButtons();
    }

    _drawFloatingCircles(time) {
        this.ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
        this.ctx.beginPath();
        this.ctx.arc(100 + Math.sin(time) * 20, 100 + Math.cos(time * 0.7) * 30, 40, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(0, 200, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(400 + Math.cos(time * 1.3) * 25, 80 + Math.sin(time * 0.9) * 35, 60, 0, Math.PI * 2);
        this.ctx.fill();
    }

    _drawTitle() {
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 56px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PLATFORMER', Constants.SCREEN_WIDTH / 2, 120);
    }

    _drawTitleButtons() {
        const buttons = [
            { x: Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 - 50, type: 'play', color: '#ff6600' },
            { x: 3 * Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 - 50, type: 'editor', color: '#00ccff' },
            { x: Constants.SCREEN_WIDTH / 4, y: Constants.SCREEN_HEIGHT / 2 + 50, type: 'customize', color: '#00ff00' },
            { x: Constants.SCREEN_WIDTH / 2, y: Constants.SCREEN_HEIGHT / 2 - 50, type: 'credits', color: '#ffd700' },
            { x: Constants.SCREEN_WIDTH / 2, y: Constants.SCREEN_HEIGHT / 2 + 50, type: 'account', color: '#ffa500' }
        ];

        buttons.forEach(btn => this._drawButton(btn));
    }

    _drawButton({ x, y, type, color }) {
        const radius = 40;
        this.ctx.fillStyle = `${color}33`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        this._drawButtonIcon(type, x, y);
    }

    _drawButtonIcon(type, x, y) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        
        const icons = {
            play: '▶',
            editor: '✎',
            customize: '⚙',
            credits: '⭐',
            account: State.currentUser ? '👤' : '🔓'
        };
        
        this.ctx.fillText(icons[type] || '', x, y + 8);
    }

    drawCustomizationScreen() {
        this._drawGradientBackground('#2c3e50', '#34495e');
        this._drawBackArrow();
        this._drawScreenTitle('Customize Player', '#ecf0f1');
        this._drawColorTabs();
        this._drawPlayerPreview();
        this._drawColorPalette();
    }

    drawCreditsScreen() {
        this._drawGradientBackground('#1a1a2e', '#0f3460');
        this._drawBackArrow();
        this._drawScreenTitle('Credits', '#ffd700');
        this._drawCreditsContent();
    }

    _drawGradientBackground(color1, color2) {
        const gradient = this.ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
    }

    _drawBackArrow() {
        const bx = 10, by = 10, bw = 60, bh = 40;
        this.ctx.fillStyle = '#19a819';
        this.ctx.fillRect(bx, by, bw, bh);
        
        this.ctx.fillStyle = '#e8ffe8';
        this.ctx.beginPath();
        this.ctx.moveTo(bx + 15, by + bh / 2);
        this.ctx.lineTo(bx + bw - 15, by + 8);
        this.ctx.lineTo(bx + bw - 15, by + bh - 8);
        this.ctx.closePath();
        this.ctx.fill();
    }

    _drawScreenTitle(text, color) {
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, Constants.SCREEN_WIDTH / 2, 60);
    }

    _drawColorTabs() {
        const tabY = 80, tabWidth = 100, tabHeight = 35, tabSpacing = 10;
        const tabStartX = Constants.SCREEN_WIDTH / 2 - tabWidth - tabSpacing / 2;

        ['inner', 'outer'].forEach((mode, i) => {
            this.ctx.fillStyle = State.customizeColorMode === mode ? '#3498db' : '#7f8c8d';
            this.ctx.fillRect(tabStartX + i * (tabWidth + tabSpacing), tabY, tabWidth, tabHeight);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(mode.charAt(0).toUpperCase() + mode.slice(1), 
                tabStartX + i * (tabWidth + tabSpacing) + tabWidth / 2, tabY + tabHeight / 2 + 5);
        });
    }

    _drawPlayerPreview() {
        const x = Constants.SCREEN_WIDTH - 80, y = 80, size = 40;
        this.ctx.fillStyle = State.currentPlayerOuterColor;
        this.ctx.fillRect(x, y, size, size);
        this.ctx.fillStyle = State.currentPlayerColor;
        this.ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    }

    _drawColorPalette() {
        const colors = [
            '#000000', '#ff0000', '#0000ff', '#00ff00',
            '#ffff00', '#800080', '#ffa500', '#ffc0cb'
        ];
        const size = 70, spacing = 15, perRow = 4;
        const startX = (Constants.SCREEN_WIDTH - (perRow * (size + spacing) - spacing)) / 2;

        colors.forEach((color, i) => {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            const x = startX + col * (size + spacing) + size / 2;
            const y = 150 + row * 90 + size / 2;

            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size / 2 - 5, 0, Math.PI * 2);
            this.ctx.fill();

            const currentColor = State.customizeColorMode === 'inner' ? 
                State.currentPlayerColor : State.currentPlayerOuterColor;
            
            if (currentColor === color) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
            }
        });
    }

    _drawCreditsContent() {
        const credits = [
            'Game Developer: Vihaan Krishnan',
            'Title Screen Composer: Scott Joplin',
            'Engine: HTML5 Canvas',
            'Thanks for playing!'
        ];

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        
        credits.forEach((credit, i) => {
            this.ctx.fillText(credit, Constants.SCREEN_WIDTH / 2, 150 + i * 40);
        });
    }
}

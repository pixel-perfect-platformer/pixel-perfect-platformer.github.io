import State from './state.js';
import Constants from './constants.js';
import { firebaseService } from './firebase-service.js';
import { ScreenRenderer } from './screen-renderer.js';
import { UIRenderer } from './ui-renderer.js';

export class UIHelpers {
    static bindButtonAction(el, action) {
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
            if (!pressed) return;
            clearPressed();
            const rect = el.getBoundingClientRect();
            const x = ev.changedTouches ? ev.changedTouches[0].clientX : ev.clientX;
            const y = ev.changedTouches ? ev.changedTouches[0].clientY : ev.clientY;
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                try { action(ev); } catch (e) { console.error(e); }
            }
        };
        el.addEventListener('mousedown', addPressed);
        el.addEventListener('touchstart', addPressed, { passive: false });
        el.addEventListener('mouseup', release);
        el.addEventListener('touchend', release);
        el.addEventListener('mouseleave', clearPressed);
        el.addEventListener('touchcancel', clearPressed);
    }

    static showStatus(msg, ms = 1800) {
        if (Constants.editorHint) Constants.editorHint.textContent = msg;
        clearTimeout(UIHelpers.showStatus._t);
    }

    static async loadPublishedLevels() {
        const levelsList = document.getElementById('levelsList');
        if (!levelsList) return;
        levelsList.innerHTML = '<p>Loading...</p>';
        try {
            const levels = await firebaseService.getPublishedLevels();
            levelsList.innerHTML = '';
            if (levels.length === 0) {
                levelsList.innerHTML = '<p>No published levels found</p>';
                return;
            }
            levels.forEach(level => {
                const div = document.createElement('div');
                div.style.cssText = 'padding:10px;margin:5px 0;border:1px solid #ddd;border-radius:4px;cursor:pointer;';
                div.innerHTML = `<strong>${level.name || 'Untitled'}</strong><br><small>by ${level.author || 'Unknown'}</small>`;
                div.onclick = () => {
                    State.blocks = level.blocks || [];
                    State.texts = level.texts || [];
                    document.getElementById('browseModal').style.display = 'none';
                    alert('Level loaded!');
                };
                levelsList.appendChild(div);
            });
        } catch (e) {
            levelsList.innerHTML = '<p>Failed to load levels</p>';
        }
    }

    static showLevelMenu() {
        const menu = document.getElementById('levelMenu');
        if (menu) {
            menu.style.display = 'block';
            State.showLevelMenu = true;
            this.populateMyLevels();
        }
    }

    static hideLevelMenu() {
        const menu = document.getElementById('levelMenu');
        if (menu) {
            menu.style.display = 'none';
            State.showLevelMenu = false;
        }
    }

    static populateMyLevels() {
        const levelList = document.getElementById('levelList');
        if (!levelList) return;
        levelList.innerHTML = '';
        State.levels.forEach((level, index) => {
            const div = document.createElement('div');
            div.style.cssText = 'margin:5px 0;padding:5px;border:1px solid #ccc;';
            div.innerHTML = `
                <span>${level.name || `Level ${index + 1}`}</span>
                <button onclick="loadLevelAndEdit(${index})" style="margin-left:10px;">Edit</button>
                <button onclick="renameLevel(${index})" style="margin-left:5px;">Rename</button>
                <button onclick="deleteLevel(${index})" style="margin-left:5px;color:red;">Delete</button>
            `;
            levelList.appendChild(div);
        });
    }

    static drawTitleScreen(ctx) { ScreenRenderer.drawTitleScreen(ctx); }
    static drawCustomizationScreen(ctx) { ScreenRenderer.drawCustomizationScreen(ctx); }
    static drawCreditsScreen(ctx) { ScreenRenderer.drawCreditsScreen(ctx); }
    static drawSignInScreen(ctx) { ScreenRenderer.drawSignInScreen(ctx); }
    static drawLevelsScreen(ctx) { ScreenRenderer.drawLevelsScreen(ctx); }
    
    static drawCompletionScreen(ctx) {
        this.drawBlocks(ctx);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Level Complete!', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 - 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText(`Jumps: ${State.jumpCount}`, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 - 10);
        ctx.fillText(`Time: ${State.completionTime}s`, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 20);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px Arial';
        ctx.fillText('Click to continue', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 60);
    }
    
    static drawDeathScreen(ctx) {
        this.drawBlocks(ctx);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('You Died', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 - 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText(`Jumps: ${State.jumpCount}`, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 - 10);
        ctx.fillText(`Time: ${State.deathTime}s`, Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 20);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px Arial';
        ctx.fillText('Click to try again', Constants.SCREEN_WIDTH / 2, Constants.SCREEN_HEIGHT / 2 + 60);
    }
    
    static updateEditorUI() {
        const editorTools = document.getElementById('editorTools');
        if (editorTools) editorTools.style.display = State.editorMode ? 'block' : 'none';
        if (Constants.publishBtn) Constants.publishBtn.hidden = !State.editorMode;
        if (Constants.saveBtn) Constants.saveBtn.hidden = !State.editorMode;
        if (Constants.clearBtn) Constants.clearBtn.hidden = !State.editorMode;
    }
    
    static drawBlocks(ctx) {
        const barHeight = 100;
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, Constants.SCREEN_HEIGHT - barHeight - 40, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

        for (let i = 0; i < State.blocks.length; i++) {
            const b = State.blocks[i];
            if (b.type === 'end') ctx.fillStyle = 'green';
            else if (b.type === 'kill') ctx.fillStyle = '#ff4500';
            else if (b.type === 'start') ctx.fillStyle = '#1e90ff';
            else ctx.fillStyle = '#666';
            ctx.fillRect(b.x, b.y, b.width, b.height);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(b.x, b.y, b.width, b.height);
            if (State.selectedBlockIndex === i) {
                ctx.save();
                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = 3;
                ctx.strokeRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
                ctx.restore();
            }
        }
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        for (let t of State.texts) ctx.fillText(t.text, t.x, t.y);
    }
    
    static drawHUD(ctx) {
        UIRenderer.drawHUD(ctx);
    }
}
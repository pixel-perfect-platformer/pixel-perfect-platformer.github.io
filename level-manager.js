import State from './state.js';
import Constants from './constants.js';
import { firebaseService } from './firebase-service.js';

export class LevelManager {
    static isLoading = false;
    
    static async saveLevelsToStorage() {
        try {
            if (State.editorMode && State.levels[State.currentLevelIndex]) {
                State.levels[State.currentLevelIndex].blocks = this.cloneData(State.blocks);
                State.levels[State.currentLevelIndex].texts = this.cloneData(State.texts);
            }
            localStorage.setItem('platformer_levels', JSON.stringify(State.levels));
            if (!State.currentUser) return;
            const isAdmin = State.currentUser.email === 'krisvih32@platformer.local' || State.currentUser.displayName === 'krisvih32';
            const existingLevels = await firebaseService.getAllLevels();
            const existingIds = new Set(existingLevels.map(l => l.id));
            for (let i = 0; i < State.levels.length; i++) {
                const levelId = `level_${i}`;
                if (State.levels[i].category !== 'official' || isAdmin) {
                    await firebaseService.saveLevelToCloud(i, State.levels[i]);
                    existingIds.delete(levelId);
                }
            }
            for (const oldId of existingIds) {
                const index = parseInt(oldId.split('_')[1]);
                if (index >= State.levels.length) {
                    const category = existingLevels.find(l => l.id === oldId)?.category || 'community';
                    await firebaseService.deleteLevel(index, category);
                }
            }
        } catch (e) {
            console.error('Failed to save levels:', e);
        }
    }

    static savePlayerColors() {
        try {
            localStorage.setItem('platformer_player_colors', JSON.stringify({
                inner: State.currentPlayerColor,
                outer: State.currentPlayerOuterColor
            }));
        } catch (e) {
            console.error('Failed to save player colors:', e);
        }
    }

    static loadPlayerColors() {
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

    static loadLevelCompletions() {
        try {
            const data = localStorage.getItem('platformer_completions');
            if (data) {
                State.levelCompletions = JSON.parse(data);
            } else {
                State.levelCompletions = {};
            }
        } catch (e) {
            console.error('Failed to load level completions:', e);
            State.levelCompletions = {};
        }
    }

    static async loadLevelsFromStorage() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            const cloudLevels = await firebaseService.getAllLevels();
            if (cloudLevels.length > 0) {
                const seen = new Set();
                const uniqueLevels = [];
                cloudLevels.sort((a, b) => {
                    const aIndex = parseInt(a.id.split('_')[1]) || 0;
                    const bIndex = parseInt(b.id.split('_')[1]) || 0;
                    return aIndex - bIndex;
                });
                for (const level of cloudLevels) {
                    if (!seen.has(level.id)) {
                        seen.add(level.id);
                        uniqueLevels.push(level);
                    }
                }
                State.levels = uniqueLevels.map(level => ({
                    name: level.name,
                    blocks: level.blocks || [],
                    texts: level.texts || [],
                    category: level.category || 'community',
                    official: level.category === 'official'
                }));
                this.populateLevelSelect();
                this.loadLevel(0);
                this.isLoading = false;
                return;
            }
        } catch (e) {
            console.log('No cloud levels found:', e);
        }
        
        try {
            const localData = localStorage.getItem('platformer_levels');
            if (localData) {
                State.levels = JSON.parse(localData);
                this.populateLevelSelect();
                this.loadLevel(0);
                this.isLoading = false;
                return;
            }
        } catch (e) {
            console.log('No local levels found:', e);
        }
        
        State.levels = [{ name: 'Level 1', blocks: [], texts: [], category: 'community', official: false }];
        this.populateLevelSelect();
        this.loadLevel(0);
        this.isLoading = false;
    }

    static populateLevelSelect() {
        Constants.levelSelect.innerHTML = '';
        State.levels.forEach((lv, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = lv.name || `Level ${i + 1}`;
            Constants.levelSelect.appendChild(opt);
        });
        Constants.levelSelect.value = State.currentLevelIndex;
    }

    static loadLevel(index) {
        if (!State.levels[index]) {
            console.error('Level not found at index:', index);
            return;
        }
        State.currentLevelIndex = index;
        State.blocks = this.cloneData(State.levels[index].blocks || []);
        State.texts = this.cloneData(State.levels[index].texts || []);
        
        const maxBlockBottom = Math.max(0, ...State.blocks.map(b => b.y + b.height));
        if (maxBlockBottom > 367) {
            this.shiftLevelUp(maxBlockBottom - 367);
        }
        
        if (this.removeStartBlocks()) {
            State.levels[index].blocks = this.cloneData(State.blocks);
            this.saveLevelsToStorage();
        }
        
        if (State.editorMode && State.levels[index].category === 'official') {
            State.levels[index].category = 'official';
        }
        
        this.positionPlayerOnSpawn();
        const player = window.player;
        if (player) {
            player.lateral_speed = player.vertical_speed = 0;
        }
        State.isRunning = false;
        State.levelCompleted = false;
        State.showCompletionScreen = false;
        State.showDeathScreen = false;
        State.levelStartTime = 0;
        State.jumpCount = 0;
        State.deathAnimationStartTime = 0;
        State.deathTime = 0;
        State.completionAnimationStartTime = 0;
        State.completionTime = 0;
        
        if (State.levelNameInput) {
            State.levelNameInput.value = State.levels[index].name || `Level ${index + 1}`;
        }
    }

    static cloneData(data) {
        return JSON.parse(JSON.stringify(data));
    }

    static shiftLevelUp(shiftAmount) {
        State.blocks.forEach(b => b.y -= shiftAmount);
        State.texts.forEach(t => t.y -= shiftAmount);
    }

    static removeStartBlocks() {
        const startBlocks = State.blocks.filter(b => b.type === 'start');
        if (startBlocks.length > 0) {
            alert('Compatibility issue: This level contains start blocks which are no longer supported. They will be removed.');
            State.blocks = State.blocks.filter(b => b.type !== 'start');
            return true;
        }
        return false;
    }

    static positionPlayerOnSpawn() {
        const player = window.player;
        if (!player) return;
        
        const grayRectangleTop = Constants.SCREEN_HEIGHT - 140;
        player.x = 0;
        player.y = grayRectangleTop - player.height;
        
        for (let b of State.blocks) {
            if (b.x <= player.x && b.x + b.width > player.x && 
                b.y <= player.y + player.height && b.y + b.height > player.y) {
                player.y = b.y - player.height;
                break;
            }
        }
    }

    static isOfficialLevel(levelIndex) {
        return State.levels[levelIndex]?.official === true;
    }
}
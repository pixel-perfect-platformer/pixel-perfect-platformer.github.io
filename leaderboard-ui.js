import State from './state.js';
import Constants from './constants.js';
import { LeaderboardService } from './leaderboard-service.js';
import { ReplayPlayer } from './replay-player.js';

export class LeaderboardUI {
    static currentLeaderboard = [];
    static selectedLevel = 0;
    static isLoading = false;
    static scrollOffset = 0;
    static hoveredEntry = -1;

    static async showLeaderboard(levelIndex = null) {
        State.showLeaderboardScreen = true;
        this.selectedLevel = levelIndex !== null ? levelIndex : State.currentLevelIndex;
        await this.loadLeaderboard();
    }

    static async loadLeaderboard() {
        this.isLoading = true;
        try {
            this.currentLeaderboard = await LeaderboardService.getLeaderboard(this.selectedLevel, 20);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.currentLeaderboard = [];
        }
        this.isLoading = false;
    }

    static hide() {
        State.showLeaderboardScreen = false;
        this.scrollOffset = 0;
        this.hoveredEntry = -1;
    }

    static handleClick(x, y) {
        if (!State.showLeaderboardScreen) return false;

        // Back button
        if (x >= 20 && x <= 80 && y >= 20 && y <= 60) {
            this.hide();
            return true;
        }

        // Level selector buttons
        const levelBtnY = 80;
        if (y >= levelBtnY && y <= levelBtnY + 30) {
            if (x >= 200 && x <= 230 && this.selectedLevel > 0) {
                this.selectedLevel--;
                this.loadLeaderboard();
                return true;
            }
            if (x >= 370 && x <= 400 && this.selectedLevel < State.levels.length - 1) {
                this.selectedLevel++;
                this.loadLeaderboard();
                return true;
            }
        }

        // Leaderboard entries
        const startY = 140;
        const entryHeight = 60;
        const entryIndex = Math.floor((y - startY + this.scrollOffset) / entryHeight);
        
        if (entryIndex >= 0 && entryIndex < this.currentLeaderboard.length) {
            const entry = this.currentLeaderboard[entryIndex];
            
            // Check if clicking on replay button
            const replayBtnX = Constants.SCREEN_WIDTH - 80;
            const replayBtnY = startY + entryIndex * entryHeight - this.scrollOffset + 20;
            
            if (x >= replayBtnX && x <= replayBtnX + 60 && 
                y >= replayBtnY && y <= replayBtnY + 20) {
                this.playReplay(entry);
                return true;
            }
        }

        return false;
    }

    static handleScroll(deltaY) {
        if (!State.showLeaderboardScreen) return false;
        
        const maxScroll = Math.max(0, this.currentLeaderboard.length * 60 - 300);
        this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + deltaY * 30));
        return true;
    }

    static handleMouseMove(x, y) {
        if (!State.showLeaderboardScreen) return;

        const startY = 140;
        const entryHeight = 60;
        const entryIndex = Math.floor((y - startY + this.scrollOffset) / entryHeight);
        
        this.hoveredEntry = (entryIndex >= 0 && entryIndex < this.currentLeaderboard.length) ? entryIndex : -1;
    }

    static playReplay(entry) {
        if (entry.replay) {
            this.hide();
            ReplayPlayer.startReplay(entry.replay, this.selectedLevel);
        }
    }

    static draw(ctx) {
        if (!State.showLeaderboardScreen) return;

        // Background
        const gradient = ctx.createLinearGradient(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT);

        // Back button
        ctx.fillStyle = '#28a745';
        ctx.fillRect(20, 20, 60, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Back', 50, 45);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Leaderboard', Constants.SCREEN_WIDTH / 2, 50);

        // Level selector
        const levelName = State.levels[this.selectedLevel]?.name || `Level ${this.selectedLevel + 1}`;
        ctx.font = '20px Arial';
        ctx.fillText(levelName, Constants.SCREEN_WIDTH / 2, 100);

        // Level navigation buttons
        if (this.selectedLevel > 0) {
            ctx.fillStyle = '#007bff';
            ctx.fillRect(200, 80, 30, 30);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('<', 215, 100);
        }

        if (this.selectedLevel < State.levels.length - 1) {
            ctx.fillStyle = '#007bff';
            ctx.fillRect(370, 80, 30, 30);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('>', 385, 100);
        }

        // Loading indicator
        if (this.isLoading) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loading...', Constants.SCREEN_WIDTH / 2, 200);
            return;
        }

        // Headers
        const headerY = 130;
        ctx.fillStyle = '#cccccc';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Rank', 30, headerY);
        ctx.fillText('Player', 80, headerY);
        ctx.fillText('Time', 200, headerY);
        ctx.fillText('Jumps', 280, headerY);
        ctx.fillText('Date', 350, headerY);
        ctx.textAlign = 'center';
        ctx.fillText('Replay', Constants.SCREEN_WIDTH - 50, headerY);

        // Leaderboard entries
        const startY = 140;
        const entryHeight = 60;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, startY, Constants.SCREEN_WIDTH, Constants.SCREEN_HEIGHT - startY - 50);
        ctx.clip();

        this.currentLeaderboard.forEach((entry, index) => {
            const y = startY + index * entryHeight - this.scrollOffset;
            
            if (y < startY - entryHeight || y > Constants.SCREEN_HEIGHT) return;

            // Entry background
            if (index === this.hoveredEntry) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(20, y, Constants.SCREEN_WIDTH - 40, entryHeight - 5);
            }

            // Rank background
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666666';
            ctx.fillStyle = rankColor;
            ctx.fillRect(25, y + 10, 40, 30);

            // Rank text
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${index + 1}`, 45, y + 30);

            // Player name
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            const displayName = entry.username || 'Anonymous';
            ctx.fillText(displayName.substring(0, 15), 80, y + 30);

            // Time
            ctx.fillText(`${entry.time}s`, 200, y + 30);

            // Jumps
            ctx.fillText(entry.jumps.toString(), 280, y + 30);

            // Date
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString();
            ctx.fillText(dateStr, 350, y + 30);

            // Replay button
            if (entry.replay) {
                const btnX = Constants.SCREEN_WIDTH - 80;
                const btnY = y + 20;
                
                ctx.fillStyle = index === this.hoveredEntry ? '#ff8800' : '#ff6600';
                ctx.fillRect(btnX, btnY, 60, 20);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Watch', btnX + 30, btnY + 14);
            }
        });

        ctx.restore();

        // No entries message
        if (this.currentLeaderboard.length === 0 && !this.isLoading) {
            ctx.fillStyle = '#888888';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No scores yet. Be the first!', Constants.SCREEN_WIDTH / 2, 250);
        }

        // Scroll indicator
        if (this.currentLeaderboard.length * entryHeight > 300) {
            const scrollBarHeight = 200;
            const scrollBarY = 150;
            const scrollProgress = this.scrollOffset / Math.max(1, this.currentLeaderboard.length * entryHeight - 300);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(Constants.SCREEN_WIDTH - 10, scrollBarY, 5, scrollBarHeight);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            const thumbY = scrollBarY + scrollProgress * (scrollBarHeight - 20);
            ctx.fillRect(Constants.SCREEN_WIDTH - 10, thumbY, 5, 20);
        }
    }
}
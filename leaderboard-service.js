// Leaderboard service with anti-cheat validation
import { firebaseService } from './firebase-service.js';
import State from './state.js';

export class LeaderboardService {
    static async submitScore(levelIndex, time, jumps) {
        if (!State.currentUser) return { success: false, error: 'Not authenticated' };
        
        const levelData = State.levels[levelIndex];
        if (!levelData) return { success: false, error: 'Invalid level' };
        
        // Client-side validation
        if (time < 0.5 || jumps < 0) return { success: false, error: 'Invalid data' };
        
        const submission = {
            uid: State.currentUser.uid,
            username: State.currentUser.email?.replace('@platformer.local', '') || State.currentUser.displayName || 'Anonymous',
            levelIndex,
            levelName: levelData.name || `Level ${levelIndex + 1}`,
            time: parseFloat(time.toFixed(2)),
            jumps,
            timestamp: Date.now()
        };
        
        try {
            const db = firebaseService.db;
            const scoresRef = db.ref(`leaderboards/level_${levelIndex}/scores`);
            await scoresRef.push(submission);
            return { success: true };
        } catch (error) {
            console.error('Failed to submit score:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getLeaderboard(levelIndex, limit = 10) {
        try {
            const db = firebaseService.db;
            const scoresRef = db.ref(`leaderboards/level_${levelIndex}/scores`);
            const snapshot = await scoresRef.orderByChild('time').limitToFirst(limit).once('value');
            
            const scores = [];
            snapshot.forEach(child => {
                scores.push({ id: child.key, ...child.val() });
            });
            
            return scores;
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            return [];
        }
    }
}

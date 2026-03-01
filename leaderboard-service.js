// Leaderboard service with advanced anti-cheat validation
import { firebaseService } from './firebase-service.js';
import { AntiCheatValidator } from './anti-cheat-validator.js';
import State from './state.js';

export class LeaderboardService {
    static async submitScore(levelIndex, time, jumps, replay) {
        if (!State.currentUser) return { success: false, error: 'Not authenticated' };
        
        const levelData = State.levels[levelIndex];
        if (!levelData) return { success: false, error: 'Invalid level' };
        
        // Enhanced client-side validation
        if (time < 0.5 || time > 3600 || jumps < 0 || jumps > 10000) {
            return { success: false, error: 'Invalid score data' };
        }
        
        if (!replay || replay.length < 10) {
            return { success: false, error: 'Invalid replay data' };
        }
        
        // Anti-cheat validation
        const validation = AntiCheatValidator.validateReplay(replay, levelData, time, jumps);
        if (!validation.isValid) {
            console.warn('Anti-cheat validation failed:', validation.errors);
            return { success: false, error: 'Score validation failed' };
        }
        
        // Log suspicious patterns for monitoring
        if (validation.suspiciousPatterns.length > 0) {
            console.warn('Suspicious patterns detected:', validation.suspiciousPatterns);
        }
        
        const timestamp = Date.now();
        const securityHash = AntiCheatValidator.generateSecurityHash(
            levelIndex, time, jumps, timestamp, State.currentUser.uid
        );
        
        const submission = {
            uid: State.currentUser.uid,
            username: State.currentUser.email?.replace('@platformer.local', '') || State.currentUser.displayName || 'Anonymous',
            levelIndex,
            levelName: levelData.name || `Level ${levelIndex + 1}`,
            time: parseFloat(time.toFixed(2)),
            jumps,
            timestamp,
            replay,
            securityHash,
            clientVersion: '1.0.0',
            suspiciousPatterns: validation.suspiciousPatterns
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

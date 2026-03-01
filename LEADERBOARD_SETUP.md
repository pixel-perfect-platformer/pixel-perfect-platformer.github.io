# Firebase Leaderboard Setup Instructions

## 1. Copy Database Rules
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to "Realtime Database" → "Rules" tab
4. Copy the contents of `firebase-rules.json` and paste into the rules editor
5. Click "Publish"

## 2. Security Features
The rules enforce:
- Only authenticated users can submit scores
- Time must be between 0.5s and 3600s (1 hour)
- Jumps must be between 0 and 10,000
- User can only submit scores with their own UID
- Anyone can read leaderboards

## 3. How It Works
- When a player completes a level, their time and jump count are automatically submitted
- Scores are stored in: `leaderboards/level_{index}/scores/{scoreId}`
- Leaderboards are sorted by time (fastest first)
- Firebase validates all submissions server-side

## 4. Testing
1. Complete a level while signed in
2. Check Firebase Console → Realtime Database to see the score
3. Try to manually edit a score - it should be rejected by the rules

## 5. Future Enhancements
- Add Cloud Functions for additional validation (detect impossible times)
- Add replay validation (store input sequence, verify on server)
- Add rate limiting (max 1 submission per level per minute)

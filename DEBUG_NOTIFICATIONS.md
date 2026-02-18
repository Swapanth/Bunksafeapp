# Notification Debugging Guide

## Recent Fixes Applied

### 1. Added NEW_MESSAGE Notification Template
- Created a proper notification template in `NotificationTemplates.ts`
- Template includes conversation ID and sender name for proper routing
- Priority set to "high" to ensure immediate delivery

### 2. Removed Web Platform Check
- **Previous Issue**: The code was checking `window.location` which blocked notifications even on native devices
- **Fix**: Removed the web platform check since Expo handles platform differences automatically
- Push notifications now work on both iOS and Android native builds

### 3. Added Message Notification Channel (Android)
- Created dedicated "messages" channel with HIGH importance
- Configured vibration pattern and sound
- Ensures Android properly displays message notifications

### 4. Added Message Notification Handler
- Client service now handles `new_message` notification type
- Properly routes to conversation when notification is tapped

## How to Test Message Notifications

### Prerequisites
1. **Use a physical device** (not emulator/simulator for push notifications)
2. **Use development build** (not Expo Go - push notifications don't work in Expo Go)
3. Ensure you have notification permissions granted

### Testing Steps

1. **Check User Has Push Token**
   ```typescript
   // In your app, check console logs for:
   ✅ Expo push token obtained: ExponentPushToken[...]
   ```

2. **Verify Settings in Firestore**
   - Open Firebase Console
   - Go to Firestore Database
   - Check `userNotificationSettings` collection
   - Your user document should have:
     ```
     {
       userId: "your-user-id",
       messageNotifications: true,
       expoPushToken: "ExponentPushToken[...]"
     }
     ```

3. **Send a Test Message**
   - Open chat with another user
   - Have that user send you a message
   - Check console logs for:
     ```
     🔔 Triggering message notification for: [userId]
     📱 Message notifications enabled: true
     ✅ Push token found: ExponentPushToken...
     📤 Sending push notification: 💬 [Sender Name] - [Message]
     📤 Sending push to Expo: {...}
     ✅ Push notification sent successfully
     ```

4. **Background App Test**
   - Put app in background
   - Have someone send you a message
   - You should receive notification immediately

### Common Issues & Solutions

#### Issue 1: "No push token found for user"
**Cause**: Push token not registered  
**Solution**: 
- Restart app
- Check device has internet connection
- Verify you're on a physical device
- Rebuild app with EAS

#### Issue 2: "Message notifications disabled for user"
**Cause**: Settings have messageNotifications: false  
**Solution**: 
- Check Firestore settings document
- Update or delete the document to reset to defaults
- Or manually set `messageNotifications: true`

#### Issue 3: "Notification received but no sound/vibration"
**Cause**: Android channel not properly configured  
**Solution**:
- Uninstall and reinstall app
- Android caches notification channel settings

#### Issue 4: Notifications only work when app is open
**Cause**: Using Expo Go instead of development build  
**Solution**:
- Create EAS development build: `eas build --profile development --platform android`
- Install the generated APK/IPA

### Manual Test Push Notification

You can test push notifications manually using this curl command:

```bash
curl -H "Content-Type: application/json" \\
     -X POST https://exp.host/--/api/v2/push/send \\
     -d '{
       "to": "YOUR_EXPO_PUSH_TOKEN_HERE",
       "title": "💬 Test User",
       "body": "This is a test message",
       "sound": "default",
       "priority": "high",
       "channelId": "messages",
       "data": {
         "type": "new_message",
         "conversationId": "test123",
         "senderName": "Test User"
       }
     }'
```

Replace `YOUR_EXPO_PUSH_TOKEN_HERE` with your actual token.

### Console Log Checklist

When a message is sent, you should see these logs in order:

```
💬 Sending message in conversation: [conversationId]
📨 Message sent to: [recipientId] | Should suppress notification: false
📩 Attempting to send message notification to: [recipientId]
🔔 Triggering message notification for: [recipientId]
🔥 Getting notification settings for user: [recipientId]
✅ Found notification settings for user: [recipientId]
📱 Message notifications enabled: true
✅ Push token found: ExponentPushToken...
📤 Sending push notification: 💬 [Sender] - [Message]
📤 Sending push to Expo: {...}
✅ Push notification sent successfully
✅ Message notification sent successfully to: [recipientId]
```

### Verify in Firebase

Check the `notifications` collection in Firestore after sending a message. You should see a new document with:
```json
{
  "id": "[userId]_new_message_[timestamp]",
  "userId": "[recipientId]",
  "type": "new_message",
  "title": "💬 [Sender Name]",
  "body": "[Message content]",
  "sent": false,
  "createdAt": "[timestamp]"
}
```

## Next Steps if Still Not Working

1. **Check Expo project configuration**
   - Verify projectId in `app.json` matches EAS project
   - Check `expo-notifications` version is compatible

2. **Enable verbose logging**
   - Set `EXPO_PUBLIC_ENABLE_DEBUG_LOGS=true` in your `.env`

3. **Test with Expo Push Notification Tool**
   - Visit: https://expo.dev/notifications
   - Enter your push token
   - Send test notification

4. **Rebuild the app**
   - Sometimes changes require a fresh build:
   ```bash
   eas build --profile development --platform android
   eas build --profile development --platform ios
   ```

## Code Changes Summary

### Files Modified:
1. `src/core/constants/NotificationTemplates.ts` - Added NEW_MESSAGE template
2. `src/data/services/NotificationBackendService.ts` - Removed web check, improved logging
3. `src/data/services/NotificationClientService.ts` - Added message channel and handler

### Configuration:
- Message notifications: **Enabled by default**
- Priority: **High** (for immediate delivery)
- Sound: **Default**
- Vibration: **Enabled on Android**

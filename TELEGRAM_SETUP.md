# Telegram Notifications Setup

This application can send Telegram notifications when payments are declared. Follow these steps to set it up:

## 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat and send `/newbot`
3. Follow the instructions to create your bot
4. Save the bot token (it looks like `1234567890:AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPPQQ`)

## 2. Get Your Chat ID

### Option A: For Personal Chat

1. Start a chat with your bot
2. Send any message to your bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `"id"` field in the response (it will be a number)

### Option B: For Group Chat

1. Add your bot to a group
2. Send a message in the group mentioning your bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `"id"` field in the chat object (it will be negative for groups)

## 3. Set Environment Variables

Create a `.env` file in the root directory:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## 4. Build and Deploy

### For Development

Just set the environment variables and run `ng serve`. The bot will work in development.

### For Production Build

```bash
# Set environment variables in your deployment platform
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_CHAT_ID=your_chat_id

# Build with environment injection
npm run build:prod
```

## 5. Testing

The service includes a test method. You can call it from the browser console:

```typescript
// In browser dev tools
const telegramService = document.querySelector("app-root")?._injector?.get("TelegramNotificationService");
telegramService?.testConnection().subscribe(console.log);
```

## Notification Format

When a payment is declared, you'll receive a message like:

```
🔔 Payment Declared

📋 Order: ORD-123456
👤 Customer: John Doe
💰 Amount: ₦15,000.00
📞 Phone: +234 123 456 7890
📧 Email: john@example.com
⏰ Declared At: December 13, 2025 at 3:45 PM

⚠️ Action Required: Please review and confirm this payment in the admin panel.
```

## Error Handling

- If bot token or chat ID is missing, notifications are silently skipped
- If sending fails, it's logged but doesn't affect the payment process
- The main payment flow continues regardless of notification status

## Security Notes

- Never commit your `.env` file to version control
- Keep your bot token secure
- Consider using environment variables in your deployment platform
- The bot token gives access to send messages on behalf of your bot

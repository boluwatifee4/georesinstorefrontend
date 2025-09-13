export const environment = {
  production: true,
  apiUrl: 'https://georesinstore-api.onrender.com', // Your production API URL
  adminApiKey: 'your-production-admin-key-here', // Change this for production
  telegram: {
    botToken: (globalThis as any)?.process?.env?.['TELEGRAM_BOT_TOKEN'] || '',
    chatId: (globalThis as any)?.process?.env?.['TELEGRAM_CHAT_ID'] || ''
  }
};

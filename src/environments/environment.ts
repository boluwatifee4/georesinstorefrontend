export const environment = {
  production: false,
  apiUrl: 'https://georesinstore-api.onrender.com', // Your NestJS backend URL
  adminApiKey: 'changeme-dev-key',
  telegram: {
    botToken: (globalThis as any)?.process?.env?.['TELEGRAM_BOT_TOKEN'] || '',
    chatId: (globalThis as any)?.process?.env?.['TELEGRAM_CHAT_ID'] || ''
  }
};

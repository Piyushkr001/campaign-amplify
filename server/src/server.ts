import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`
🚀 Campaign Amplify API running!
📡 Environment : ${env.NODE_ENV}
🌐 Port        : ${env.PORT}
🩺 Health Check: http://localhost:${env.PORT}/api/v1/health
📢 Campaigns   : http://localhost:${env.PORT}/api/v1/campaigns
  `);
});

const gracefulShutdown = () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

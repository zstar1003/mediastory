import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/project.js';
import { setupWebSocket } from './services/websocket.js';

const app = express();
const server = createServer(app);

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 设置 WebSocket
const io = setupWebSocket(server);

// 连接数据库并启动服务器
async function start() {
  try {
    // 连接 MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mediastory';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 连接成功');

    // 启动服务器
    const port = parseInt(process.env.PORT || '3001');
    server.listen(port, () => {
      console.log(`✅ 服务器运行在 http://localhost:${port}`);
      console.log(`✅ WebSocket 服务已启动`);
    });
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

start();

export { app, server, io };

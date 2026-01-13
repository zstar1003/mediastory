import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Project, EditHistory } from '../models/index.js';
import type { JWTPayload, OnlineUser, ProjectChange } from '../types/index.js';
import mongoose from 'mongoose';

// 用户颜色池
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
];

// 在线用户管理
interface RoomUsers {
  [odId: string]: OnlineUser;
}

interface ProjectRooms {
  [projectId: string]: RoomUsers;
}

const projectRooms: ProjectRooms = {};
let colorIndex = 0;

function getNextColor(): string {
  const color = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return color;
}

export function setupWebSocket(server: HTTPServer): Server {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // 认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('认证失败：未提供令牌'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('认证失败：令牌无效'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload;
    console.log(`用户连接: ${user.nickname} (${socket.id})`);

    // 加入项目房间
    socket.on('join-project', async ({ projectId }: { projectId: string }) => {
      try {
        // 验证用户对项目的访问权限
        const project = await Project.findOne({
          _id: projectId,
          $or: [
            { ownerId: new mongoose.Types.ObjectId(user.userId) },
            { 'collaborators.userId': new mongoose.Types.ObjectId(user.userId) },
          ],
        });

        if (!project) {
          socket.emit('error', { message: '无权访问该项目' });
          return;
        }

        // 加入房间
        socket.join(projectId);

        // 初始化房间
        if (!projectRooms[projectId]) {
          projectRooms[projectId] = {};
        }

        // 创建在线用户对象
        const onlineUser: OnlineUser = {
          odId: socket.id,
          userId: user.userId,
          nickname: user.nickname,
          color: getNextColor(),
        };

        projectRooms[projectId][socket.id] = onlineUser;

        // 通知房间内其他用户
        socket.to(projectId).emit('user-joined', { user: onlineUser });

        // 发送当前在线用户列表给新加入的用户
        const onlineUsers = Object.values(projectRooms[projectId]);
        socket.emit('users-online', { users: onlineUsers });

        console.log(`用户 ${user.nickname} 加入项目 ${projectId}`);
      } catch (error) {
        console.error('加入项目失败:', error);
        socket.emit('error', { message: '加入项目失败' });
      }
    });

    // 离开项目房间
    socket.on('leave-project', ({ projectId }: { projectId: string }) => {
      leaveProject(socket, projectId);
    });

    // 光标移动
    socket.on('cursor-move', ({ projectId, cursor }: { projectId: string; cursor: OnlineUser['cursor'] }) => {
      if (projectRooms[projectId]?.[socket.id]) {
        projectRooms[projectId][socket.id].cursor = cursor;
        socket.to(projectId).emit('cursor-updated', {
          odId: socket.id,
          cursor,
        });
      }
    });

    // 选区变化
    socket.on('selection-change', ({ projectId, selection }: { projectId: string; selection: OnlineUser['selection'] }) => {
      if (projectRooms[projectId]?.[socket.id]) {
        projectRooms[projectId][socket.id].selection = selection;
        socket.to(projectId).emit('selection-updated', {
          odId: socket.id,
          selection,
        });
      }
    });

    // 项目数据更新
    socket.on('project-update', async ({ projectId, changes, data }: {
      projectId: string;
      changes: ProjectChange[];
      data: Record<string, unknown>;
    }) => {
      try {
        // 更新数据库
        const project = await Project.findById(projectId);
        if (project) {
          project.data = data;
          project.version += 1;
          await project.save();

          // 记录历史
          for (const change of changes) {
            await EditHistory.create({
              projectId,
              userId: user.userId,
              userNickname: user.nickname,
              action: change.type === 'delete' ? 'delete' : change.type === 'insert' ? 'create' : 'update',
              targetType: 'storyboard',
              changes: [{
                field: change.path.join('.'),
                newValue: change.value,
              }],
            });
          }
        }

        // 广播给房间内其他用户
        socket.to(projectId).emit('project-changed', {
          changes,
          userId: user.userId,
          version: project?.version,
        });
      } catch (error) {
        console.error('更新项目失败:', error);
        socket.emit('error', { message: '更新项目失败' });
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`用户断开连接: ${user.nickname} (${socket.id})`);

      // 从所有房间中移除
      for (const projectId of Object.keys(projectRooms)) {
        if (projectRooms[projectId][socket.id]) {
          leaveProject(socket, projectId);
        }
      }
    });
  });

  function leaveProject(socket: Socket, projectId: string) {
    if (projectRooms[projectId]?.[socket.id]) {
      delete projectRooms[projectId][socket.id];
      socket.leave(projectId);
      socket.to(projectId).emit('user-left', { odId: socket.id });

      // 如果房间为空，清理房间
      if (Object.keys(projectRooms[projectId]).length === 0) {
        delete projectRooms[projectId];
      }

      console.log(`用户 ${socket.data.user.nickname} 离开项目 ${projectId}`);
    }
  }

  return io;
}

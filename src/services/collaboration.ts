import { io, Socket } from 'socket.io-client';
import type { OnlineUser, ProjectChange } from '@/types/cloud';
import type { Project } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

type EventCallback<T> = (data: T) => void;

interface CollaborationEvents {
  'user-joined': EventCallback<{ user: OnlineUser }>;
  'user-left': EventCallback<{ odId: string }>;
  'users-online': EventCallback<{ users: OnlineUser[] }>;
  'cursor-updated': EventCallback<{ odId: string; cursor: OnlineUser['cursor'] }>;
  'selection-updated': EventCallback<{ odId: string; selection: OnlineUser['selection'] }>;
  'project-changed': EventCallback<{ changes: ProjectChange[]; userId: string; version: number }>;
  'error': EventCallback<{ message: string }>;
}

class CollaborationService {
  private socket: Socket | null = null;
  private currentProjectId: string | null = null;
  private listeners: Partial<CollaborationEvents> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // 连接到服务器
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket 已连接');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket 连接错误:', error.message);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('无法连接到协作服务器'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket 断开连接:', reason);
      });

      // 设置事件监听
      this.setupEventListeners();
    });
  }

  // 断开连接
  disconnect(): void {
    if (this.currentProjectId) {
      this.leaveProject();
    }
    this.socket?.disconnect();
    this.socket = null;
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    if (!this.socket) return;

    const events: (keyof CollaborationEvents)[] = [
      'user-joined',
      'user-left',
      'users-online',
      'cursor-updated',
      'selection-updated',
      'project-changed',
      'error',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data: unknown) => {
        const callback = this.listeners[event];
        if (callback) {
          (callback as EventCallback<unknown>)(data);
        }
      });
    });
  }

  // 注册事件监听器
  on<K extends keyof CollaborationEvents>(
    event: K,
    callback: CollaborationEvents[K]
  ): void {
    this.listeners[event] = callback;
  }

  // 移除事件监听器
  off<K extends keyof CollaborationEvents>(event: K): void {
    delete this.listeners[event];
  }

  // 加入项目房间
  joinProject(projectId: string): void {
    if (!this.socket?.connected) {
      console.error('WebSocket 未连接');
      return;
    }

    if (this.currentProjectId) {
      this.leaveProject();
    }

    this.currentProjectId = projectId;
    this.socket.emit('join-project', { projectId });
  }

  // 离开项目房间
  leaveProject(): void {
    if (!this.socket?.connected || !this.currentProjectId) return;

    this.socket.emit('leave-project', { projectId: this.currentProjectId });
    this.currentProjectId = null;
  }

  // 发送光标位置
  sendCursorMove(cursor: OnlineUser['cursor']): void {
    if (!this.socket?.connected || !this.currentProjectId) return;

    this.socket.emit('cursor-move', {
      projectId: this.currentProjectId,
      cursor,
    });
  }

  // 发送选区变化
  sendSelectionChange(selection: OnlineUser['selection']): void {
    if (!this.socket?.connected || !this.currentProjectId) return;

    this.socket.emit('selection-change', {
      projectId: this.currentProjectId,
      selection,
    });
  }

  // 发送项目更新
  sendProjectUpdate(changes: ProjectChange[], data: Project): void {
    if (!this.socket?.connected || !this.currentProjectId) return;

    this.socket.emit('project-update', {
      projectId: this.currentProjectId,
      changes,
      data,
    });
  }

  // 检查是否已连接
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // 获取当前项目ID
  getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }
}

// 导出单例
export const collaborationService = new CollaborationService();

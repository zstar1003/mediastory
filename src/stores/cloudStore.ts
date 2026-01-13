import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CloudUser, OnlineUser, CloudProject } from '@/types/cloud';
import * as api from '@/services/api';
import { collaborationService } from '@/services/collaboration';

interface CloudStore {
  // 用户状态
  user: CloudUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 协作状态
  onlineUsers: OnlineUser[];
  currentCloudProjectId: string | null;
  permission: 'read' | 'edit' | 'owner' | null;

  // 云端项目列表
  cloudProjects: CloudProject[];

  // 认证方法
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;

  // 协作方法
  joinCloudProject: (cloudProjectId: string) => Promise<void>;
  leaveCloudProject: () => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (odId: string) => void;
  updateUserCursor: (odId: string, cursor: OnlineUser['cursor']) => void;
  updateUserSelection: (odId: string, selection: OnlineUser['selection']) => void;

  // 云端项目方法
  loadCloudProjects: () => Promise<void>;
  uploadProject: (project: unknown) => Promise<string>;
}

export const useCloudStore = create<CloudStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      onlineUsers: [],
      currentCloudProjectId: null,
      permission: null,
      cloudProjects: [],

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const result = await api.login(email, password);
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email, password, nickname) => {
        set({ isLoading: true });
        try {
          const result = await api.register(email, password, nickname);
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        api.logout();
        collaborationService.disconnect();
        set({
          user: null,
          isAuthenticated: false,
          onlineUsers: [],
          currentCloudProjectId: null,
          permission: null,
        });
      },

      checkAuth: async () => {
        if (!api.isLoggedIn()) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const user = await api.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch {
          api.logout();
          set({ isAuthenticated: false, user: null });
        }
      },

      joinCloudProject: async (cloudProjectId) => {
        const { user } = get();
        if (!user) return;

        try {
          // 获取项目信息
          const project = await api.getCloudProject(cloudProjectId);

          // 连接 WebSocket
          const token = localStorage.getItem('auth_token');
          if (token) {
            await collaborationService.connect(token);

            // 设置事件监听
            collaborationService.on('users-online', ({ users }) => {
              get().setOnlineUsers(users);
            });

            collaborationService.on('user-joined', ({ user }) => {
              get().addOnlineUser(user);
            });

            collaborationService.on('user-left', ({ odId }) => {
              get().removeOnlineUser(odId);
            });

            collaborationService.on('cursor-updated', ({ odId, cursor }) => {
              get().updateUserCursor(odId, cursor);
            });

            collaborationService.on('selection-updated', ({ odId, selection }) => {
              get().updateUserSelection(odId, selection);
            });

            // 加入项目房间
            collaborationService.joinProject(cloudProjectId);
          }

          set({
            currentCloudProjectId: cloudProjectId,
            permission: project.permission,
          });
        } catch (error) {
          console.error('加入云端项目失败:', error);
          throw error;
        }
      },

      leaveCloudProject: () => {
        collaborationService.leaveProject();
        set({
          currentCloudProjectId: null,
          permission: null,
          onlineUsers: [],
        });
      },

      setOnlineUsers: (users) => set({ onlineUsers: users }),

      addOnlineUser: (user) =>
        set((state) => ({
          onlineUsers: [...state.onlineUsers, user],
        })),

      removeOnlineUser: (odId) =>
        set((state) => ({
          onlineUsers: state.onlineUsers.filter((u) => u.odId !== odId),
        })),

      updateUserCursor: (odId, cursor) =>
        set((state) => ({
          onlineUsers: state.onlineUsers.map((u) =>
            u.odId === odId ? { ...u, cursor } : u
          ),
        })),

      updateUserSelection: (odId, selection) =>
        set((state) => ({
          onlineUsers: state.onlineUsers.map((u) =>
            u.odId === odId ? { ...u, selection } : u
          ),
        })),

      loadCloudProjects: async () => {
        try {
          const projects = await api.getCloudProjects();
          set({ cloudProjects: projects });
        } catch (error) {
          console.error('加载云端项目失败:', error);
        }
      },

      uploadProject: async (project) => {
        const result = await api.uploadProject(project as Parameters<typeof api.uploadProject>[0]);
        await get().loadCloudProjects();
        return result.id;
      },
    }),
    {
      name: 'cloud-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 云端协作相关类型

// 用户
export interface CloudUser {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
}

// 权限
export type Permission = 'read' | 'edit' | 'owner';

// 协作者
export interface Collaborator {
  userId: string;
  email: string;
  nickname: string;
  avatar?: string;
  permission: Permission;
  addedAt: string;
}

// 在线用户
export interface OnlineUser {
  odId: string;
  userId: string;
  nickname: string;
  avatar?: string;
  color: string;
  cursor?: {
    storyboardId?: string;
    field?: string;
    position?: number;
  };
  selection?: {
    storyboardId?: string;
    field?: string;
    start?: number;
    end?: number;
  };
}

// 云端项目
export interface CloudProject {
  id: string;
  localId: string;
  name: string;
  isOwner: boolean;
  owner: CloudUser;
  collaborators: Collaborator[];
  version: number;
  permission: Permission;
  createdAt: string;
  updatedAt: string;
}

// 分享链接
export interface ShareLink {
  id: string;
  token: string;
  permission: 'read' | 'edit';
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  url: string;
  createdAt: string;
}

// 编辑历史
export interface EditHistoryItem {
  _id: string;
  userId: CloudUser;
  userNickname: string;
  action: 'create' | 'update' | 'delete' | 'reorder';
  targetType: 'storyboard' | 'material' | 'reference' | 'info';
  targetId?: string;
  changes: {
    field: string;
    oldValue?: unknown;
    newValue?: unknown;
  }[];
  timestamp: string;
}

// API 响应
export interface AuthResponse {
  token: string;
  user: CloudUser;
}

export interface ProjectChange {
  type: 'set' | 'delete' | 'insert' | 'move';
  path: string[];
  value?: unknown;
  index?: number;
  from?: number;
  to?: number;
}

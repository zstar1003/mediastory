// 用户类型
export interface User {
  _id: string;
  email: string;
  nickname: string;
  avatar?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// 权限类型
export type Permission = 'read' | 'edit' | 'owner';

// 项目协作者
export interface Collaborator {
  userId: string;
  email: string;
  nickname: string;
  avatar?: string;
  permission: Permission;
  addedAt: Date;
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

// 编辑历史记录
export interface EditHistory {
  _id: string;
  projectId: string;
  userId: string;
  userNickname: string;
  action: 'create' | 'update' | 'delete' | 'reorder';
  targetType: 'storyboard' | 'material' | 'reference' | 'info';
  targetId?: string;
  changes: {
    field: string;
    oldValue?: unknown;
    newValue?: unknown;
  }[];
  timestamp: Date;
}

// 分享链接
export interface ShareLink {
  _id: string;
  projectId: string;
  token: string;
  permission: 'read' | 'edit';
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
}

// 云端项目
export interface CloudProject {
  _id: string;
  localId: string;
  name: string;
  ownerId: string;
  collaborators: Collaborator[];
  data: ProjectData;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// 项目数据（与前端类型一致）
export interface ProjectData {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  storyboards: Storyboard[];
  info: ProjectInfo;
  sceneReferences: ReferenceImage[];
  characterReferences: ReferenceImage[];
  materials: Material[];
}

export interface Storyboard {
  id: string;
  shotNumber: string;
  imageData?: string;
  description: string;
  dialogue: string;
  shotSize: string;
  cameraMovement: string;
  duration: number;
  notes: string;
  videoData?: string;
}

export interface ProjectInfo {
  synopsis: string;
  style: string;
  notes: string;
}

export interface ReferenceImage {
  id: string;
  name: string;
  data: string;
}

export interface Material {
  id: string;
  name: string;
  type: 'image' | 'video';
  data: string;
  createdAt: number;
}

// WebSocket 事件类型
export interface WSEvents {
  // 客户端发送
  'join-project': { projectId: string; token: string };
  'leave-project': { projectId: string };
  'cursor-move': { projectId: string; cursor: OnlineUser['cursor'] };
  'selection-change': { projectId: string; selection: OnlineUser['selection'] };
  'project-update': { projectId: string; changes: ProjectChange[] };

  // 服务端发送
  'user-joined': { user: OnlineUser };
  'user-left': { odId: string };
  'users-online': { users: OnlineUser[] };
  'cursor-updated': { odId: string; cursor: OnlineUser['cursor'] };
  'selection-updated': { odId: string; selection: OnlineUser['selection'] };
  'project-changed': { changes: ProjectChange[]; userId: string };
  'error': { message: string };
}

export interface ProjectChange {
  type: 'set' | 'delete' | 'insert' | 'move';
  path: string[];
  value?: unknown;
  index?: number;
  from?: number;
  to?: number;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  nickname: string;
}

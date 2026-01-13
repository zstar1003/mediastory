import mongoose, { Schema, Document } from 'mongoose';

// 用户模型
export interface IUser extends Document {
  email: string;
  nickname: string;
  avatar?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  nickname: { type: String, required: true },
  avatar: { type: String },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);

// 项目模型
export interface IProject extends Document {
  localId: string;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  collaborators: {
    userId: mongoose.Types.ObjectId;
    permission: 'read' | 'edit';
    addedAt: Date;
  }[];
  data: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  localId: { type: String, required: true },
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['read', 'edit'], default: 'read' },
    addedAt: { type: Date, default: Date.now },
  }],
  data: { type: Schema.Types.Mixed, required: true },
  version: { type: Number, default: 1 },
}, { timestamps: true });

// 创建索引
ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ 'collaborators.userId': 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);

// 分享链接模型
export interface IShareLink extends Document {
  projectId: mongoose.Types.ObjectId;
  token: string;
  permission: 'read' | 'edit';
  createdBy: mongoose.Types.ObjectId;
  expiresAt?: Date;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
}

const ShareLinkSchema = new Schema<IShareLink>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  token: { type: String, required: true, unique: true },
  permission: { type: String, enum: ['read', 'edit'], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date },
  maxUses: { type: Number },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ShareLinkSchema.index({ token: 1 });
ShareLinkSchema.index({ projectId: 1 });

export const ShareLink = mongoose.model<IShareLink>('ShareLink', ShareLinkSchema);

// 编辑历史模型
export interface IEditHistory extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
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

const EditHistorySchema = new Schema<IEditHistory>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userNickname: { type: String, required: true },
  action: { type: String, enum: ['create', 'update', 'delete', 'reorder'], required: true },
  targetType: { type: String, enum: ['storyboard', 'material', 'reference', 'info'], required: true },
  targetId: { type: String },
  changes: [{
    field: { type: String },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
  }],
  timestamp: { type: Date, default: Date.now },
});

EditHistorySchema.index({ projectId: 1, timestamp: -1 });

export const EditHistory = mongoose.model<IEditHistory>('EditHistory', EditHistorySchema);

import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { Project, ShareLink, EditHistory, User } from '../models/index.js';
import mongoose from 'mongoose';

// 获取用户的所有项目（包括协作项目）
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    // 获取用户拥有的项目和协作项目
    const projects = await Project.find({
      $or: [
        { ownerId: userId },
        { 'collaborators.userId': userId },
      ],
    }).populate('ownerId', 'nickname email avatar')
      .populate('collaborators.userId', 'nickname email avatar')
      .sort({ updatedAt: -1 });

    const result = projects.map(p => ({
      id: p._id,
      localId: p.localId,
      name: p.name,
      isOwner: p.ownerId._id.toString() === req.user!.userId,
      owner: p.ownerId,
      collaborators: p.collaborators,
      version: p.version,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.json(result);
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({ error: '获取项目列表失败' });
  }
};

// 获取单个项目
export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const project = await Project.findOne({
      _id: id,
      $or: [
        { ownerId: userId },
        { 'collaborators.userId': userId },
      ],
    }).populate('ownerId', 'nickname email avatar')
      .populate('collaborators.userId', 'nickname email avatar');

    if (!project) {
      res.status(404).json({ error: '项目不存在或无权访问' });
      return;
    }

    // 判断用户权限
    let permission: 'owner' | 'edit' | 'read' = 'read';
    if (project.ownerId._id.toString() === req.user!.userId) {
      permission = 'owner';
    } else {
      const collaborator = project.collaborators.find(
        c => c.userId._id.toString() === req.user!.userId
      );
      if (collaborator) {
        permission = collaborator.permission;
      }
    }

    res.json({
      id: project._id,
      localId: project.localId,
      name: project.name,
      owner: project.ownerId,
      collaborators: project.collaborators,
      data: project.data,
      version: project.version,
      permission,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    console.error('获取项目失败:', error);
    res.status(500).json({ error: '获取项目失败' });
  }
};

// 创建/上传项目
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { localId, name, data } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    // 检查是否已存在
    let project = await Project.findOne({ localId, ownerId: userId });

    if (project) {
      // 更新现有项目
      project.name = name;
      project.data = data;
      project.version += 1;
      await project.save();
    } else {
      // 创建新项目
      project = new Project({
        localId,
        name,
        ownerId: userId,
        data,
        collaborators: [],
      });
      await project.save();
    }

    res.json({
      id: project._id,
      localId: project.localId,
      name: project.name,
      version: project.version,
    });
  } catch (error) {
    console.error('创建/更新项目失败:', error);
    res.status(500).json({ error: '创建/更新项目失败' });
  }
};

// 更新项目数据
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, changes } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const project = await Project.findOne({
      _id: id,
      $or: [
        { ownerId: userId },
        { 'collaborators.userId': userId, 'collaborators.permission': 'edit' },
      ],
    });

    if (!project) {
      res.status(404).json({ error: '项目不存在或无编辑权限' });
      return;
    }

    project.data = data;
    project.version += 1;
    await project.save();

    // 记录编辑历史
    if (changes && Array.isArray(changes)) {
      for (const change of changes) {
        await EditHistory.create({
          projectId: project._id,
          userId,
          userNickname: req.user!.nickname,
          action: change.action || 'update',
          targetType: change.targetType || 'storyboard',
          targetId: change.targetId,
          changes: change.changes || [],
        });
      }
    }

    res.json({
      id: project._id,
      version: project.version,
    });
  } catch (error) {
    console.error('更新项目失败:', error);
    res.status(500).json({ error: '更新项目失败' });
  }
};

// 删除项目
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const project = await Project.findOneAndDelete({
      _id: id,
      ownerId: userId, // 只有所有者可以删除
    });

    if (!project) {
      res.status(404).json({ error: '项目不存在或无权删除' });
      return;
    }

    // 删除相关的分享链接和历史记录
    await ShareLink.deleteMany({ projectId: project._id });
    await EditHistory.deleteMany({ projectId: project._id });

    res.json({ success: true });
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({ error: '删除项目失败' });
  }
};

// 创建分享链接
export const createShareLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { permission, expiresIn, maxUses } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    // 验证项目所有权
    const project = await Project.findOne({ _id: id, ownerId: userId });
    if (!project) {
      res.status(404).json({ error: '项目不存在或无权创建分享链接' });
      return;
    }

    // 生成唯一令牌
    const token = nanoid(32);

    // 计算过期时间
    let expiresAt: Date | undefined;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    const shareLink = new ShareLink({
      projectId: project._id,
      token,
      permission: permission || 'read',
      createdBy: userId,
      expiresAt,
      maxUses,
      isActive: true,
    });
    await shareLink.save();

    res.json({
      id: shareLink._id,
      token: shareLink.token,
      permission: shareLink.permission,
      expiresAt: shareLink.expiresAt,
      maxUses: shareLink.maxUses,
      url: `${process.env.FRONTEND_URL}/share/${shareLink.token}`,
    });
  } catch (error) {
    console.error('创建分享链接失败:', error);
    res.status(500).json({ error: '创建分享链接失败' });
  }
};

// 获取项目的分享链接列表
export const getShareLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    // 验证项目所有权
    const project = await Project.findOne({ _id: id, ownerId: userId });
    if (!project) {
      res.status(404).json({ error: '项目不存在或无权查看' });
      return;
    }

    const links = await ShareLink.find({ projectId: id, isActive: true })
      .sort({ createdAt: -1 });

    res.json(links.map(link => ({
      id: link._id,
      token: link.token,
      permission: link.permission,
      expiresAt: link.expiresAt,
      maxUses: link.maxUses,
      usedCount: link.usedCount,
      createdAt: link.createdAt,
      url: `${process.env.FRONTEND_URL}/share/${link.token}`,
    })));
  } catch (error) {
    console.error('获取分享链接失败:', error);
    res.status(500).json({ error: '获取分享链接失败' });
  }
};

// 删除分享链接
export const deleteShareLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, linkId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    // 验证项目所有权
    const project = await Project.findOne({ _id: id, ownerId: userId });
    if (!project) {
      res.status(404).json({ error: '项目不存在或无权操作' });
      return;
    }

    await ShareLink.findByIdAndDelete(linkId);
    res.json({ success: true });
  } catch (error) {
    console.error('删除分享链接失败:', error);
    res.status(500).json({ error: '删除分享链接失败' });
  }
};

// 通过分享链接加入项目
export const joinByShareLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const shareLink = await ShareLink.findOne({ token, isActive: true });
    if (!shareLink) {
      res.status(404).json({ error: '分享链接无效或已失效' });
      return;
    }

    // 检查是否过期
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      res.status(400).json({ error: '分享链接已过期' });
      return;
    }

    // 检查使用次数
    if (shareLink.maxUses && shareLink.usedCount >= shareLink.maxUses) {
      res.status(400).json({ error: '分享链接已达到最大使用次数' });
      return;
    }

    const project = await Project.findById(shareLink.projectId);
    if (!project) {
      res.status(404).json({ error: '项目不存在' });
      return;
    }

    // 检查是否是项目所有者
    if (project.ownerId.toString() === req.user!.userId) {
      res.status(400).json({ error: '您已经是该项目的所有者' });
      return;
    }

    // 检查是否已是协作者
    const existingCollaborator = project.collaborators.find(
      c => c.userId.toString() === req.user!.userId
    );

    if (existingCollaborator) {
      // 更新权限（如果新权限更高）
      if (shareLink.permission === 'edit' && existingCollaborator.permission === 'read') {
        existingCollaborator.permission = 'edit';
        await project.save();
      }
    } else {
      // 添加为协作者
      project.collaborators.push({
        userId,
        permission: shareLink.permission,
        addedAt: new Date(),
      });
      await project.save();
    }

    // 更新使用次数
    shareLink.usedCount += 1;
    await shareLink.save();

    res.json({
      projectId: project._id,
      permission: shareLink.permission,
      message: '成功加入项目',
    });
  } catch (error) {
    console.error('加入项目失败:', error);
    res.status(500).json({ error: '加入项目失败' });
  }
};

// 获取项目协作者列表
export const getCollaborators = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const project = await Project.findOne({
      _id: id,
      $or: [{ ownerId: userId }, { 'collaborators.userId': userId }],
    }).populate('ownerId', 'nickname email avatar')
      .populate('collaborators.userId', 'nickname email avatar');

    if (!project) {
      res.status(404).json({ error: '项目不存在或无权查看' });
      return;
    }

    res.json({
      owner: project.ownerId,
      collaborators: project.collaborators,
    });
  } catch (error) {
    console.error('获取协作者列表失败:', error);
    res.status(500).json({ error: '获取协作者列表失败' });
  }
};

// 更新协作者权限
export const updateCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, collaboratorId } = req.params;
    const { permission } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const project = await Project.findOne({ _id: id, ownerId: userId });
    if (!project) {
      res.status(404).json({ error: '项目不存在或无权操作' });
      return;
    }

    const collaborator = project.collaborators.find(
      c => c.userId.toString() === collaboratorId
    );

    if (!collaborator) {
      res.status(404).json({ error: '协作者不存在' });
      return;
    }

    collaborator.permission = permission;
    await project.save();

    res.json({ success: true });
  } catch (error) {
    console.error('更新协作者权限失败:', error);
    res.status(500).json({ error: '更新协作者权限失败' });
  }
};

// 移除协作者
export const removeCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const project = await Project.findOne({ _id: id, ownerId: userId });
    if (!project) {
      res.status(404).json({ error: '项目不存在或无权操作' });
      return;
    }

    project.collaborators = project.collaborators.filter(
      c => c.userId.toString() !== collaboratorId
    );
    await project.save();

    res.json({ success: true });
  } catch (error) {
    console.error('移除协作者失败:', error);
    res.status(500).json({ error: '移除协作者失败' });
  }
};

// 获取编辑历史
export const getEditHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    // 验证访问权限
    const project = await Project.findOne({
      _id: id,
      $or: [{ ownerId: userId }, { 'collaborators.userId': userId }],
    });

    if (!project) {
      res.status(404).json({ error: '项目不存在或无权查看' });
      return;
    }

    const history = await EditHistory.find({ projectId: id })
      .sort({ timestamp: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate('userId', 'nickname avatar');

    const total = await EditHistory.countDocuments({ projectId: id });

    res.json({
      items: history,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('获取编辑历史失败:', error);
    res.status(500).json({ error: '获取编辑历史失败' });
  }
};

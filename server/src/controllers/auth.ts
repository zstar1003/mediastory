import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import type { JWTPayload } from '../types/index.js';

// 注册
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
      res.status(400).json({ error: '请提供邮箱、密码和昵称' });
      return;
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: '该邮箱已被注册' });
      return;
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const user = new User({
      email: email.toLowerCase(),
      nickname,
      passwordHash,
    });
    await user.save();

    // 生成 JWT
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      nickname: user.nickname,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
};

// 登录
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: '请提供邮箱和密码' });
      return;
    }

    // 查找用户
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    // 生成 JWT
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      nickname: user.nickname,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json({
      id: user._id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
};

// 更新用户信息
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nickname, avatar } = req.body;
    const updates: Record<string, string> = {};

    if (nickname) updates.nickname = nickname;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      updates,
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json({
      id: user._id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
};

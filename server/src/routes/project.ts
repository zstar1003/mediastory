import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  createShareLink,
  getShareLinks,
  deleteShareLink,
  joinByShareLink,
  getCollaborators,
  updateCollaborator,
  removeCollaborator,
  getEditHistory,
} from '../controllers/project.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 项目 CRUD
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// 分享链接
router.post('/:id/share', createShareLink);
router.get('/:id/share', getShareLinks);
router.delete('/:id/share/:linkId', deleteShareLink);

// 通过分享链接加入
router.post('/join/:token', joinByShareLink);

// 协作者管理
router.get('/:id/collaborators', getCollaborators);
router.put('/:id/collaborators/:collaboratorId', updateCollaborator);
router.delete('/:id/collaborators/:collaboratorId', removeCollaborator);

// 编辑历史
router.get('/:id/history', getEditHistory);

export default router;

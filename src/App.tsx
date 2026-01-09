import { useEffect, useRef, useState } from 'react';
import { useStoryboardStore } from '@/stores/storyboardStore';
import { StoryboardTable } from '@/components/StoryboardTable';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { ProjectInfoPanel } from '@/components/ProjectInfoPanel';
import { MaterialPanel } from '@/components/MaterialPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project } from '@/types';
import {
  Film,
  Plus,
  Clock,
  Layers,
} from 'lucide-react';

function App() {
  const {
    projects,
    currentProject,
    previewImage,
    isLoading,
    loadProjects,
    loadProject,
    createProject,
    deleteCurrentProject,
    save,
    setPreviewImage,
  } = useStoryboardStore();

  const tableRef = useRef<HTMLDivElement>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const saveTimeoutRef = useRef<number>(undefined);

  // 加载项目列表
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 自动保存
  useEffect(() => {
    if (currentProject) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        save();
      }, 1000);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentProject, save]);

  // 监听删除对话框事件（来自 Header）
  useEffect(() => {
    const handleOpenDeleteDialog = () => {
      setShowDeleteDialog(true);
    };
    window.addEventListener('open-delete-dialog', handleOpenDeleteDialog);
    return () => {
      window.removeEventListener('open-delete-dialog', handleOpenDeleteDialog);
    };
  }, []);

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      await createProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectDialog(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    await loadProject(project.id);
  };

  const handleDeleteProject = async () => {
    await deleteCurrentProject();
    setShowDeleteDialog(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header 已移到独立的 React root，不在这里渲染 */}

      {/* 主内容区 - 使用 CSS 切换 */}
      {/* 项目编辑页 */}
      <main
        className="px-6 py-4"
        style={{ display: currentProject ? 'block' : 'none' }}
      >
        {currentProject && (
          <>
            {/* 项目信息面板 */}
            <div>
              <ProjectInfoPanel />
            </div>

            {/* 统计信息 */}
            <div className="mb-4 flex items-center gap-6 text-sm text-muted-foreground">
              <span>共 {currentProject.storyboards.length} 个分镜</span>
              <span>
                总时长：
                {currentProject.storyboards.reduce((sum, sb) => sum + (sb.duration || 0), 0)} 秒
              </span>
            </div>

            {/* 分镜表格 */}
            <div>
              <StoryboardTable ref={tableRef} />
            </div>

            {/* 素材面板 */}
            <MaterialPanel onPreview={setPreviewImage} />
          </>
        )}
      </main>

      {/* 首页 */}
      <main
        className="max-w-7xl mx-auto px-6 py-6"
        style={{ display: currentProject ? 'none' : 'block' }}
      >
          {/* 主页：项目列表 */}
          <div className="py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">我的项目</h2>
                <p className="text-muted-foreground mt-1">选择一个项目继续编辑，或创建新项目</p>
              </div>
              <Button onClick={() => setShowNewProjectDialog(true)} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                新建项目
              </Button>
            </div>

            {projects.length === 0 ? (
              <Card className="max-w-md mx-auto mt-12">
                <CardContent className="p-12 text-center">
                  <Film className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-medium mb-2">还没有项目</h3>
                  <p className="text-muted-foreground mb-6">创建您的第一个分镜项目开始创作</p>
                  <Button onClick={() => setShowNewProjectDialog(true)} className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    创建新项目
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                    onClick={() => handleSelectProject(project)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Layers className="h-4 w-4" />
                          <span>{project.storyboards.length} 个分镜</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* 新建项目卡片 */}
                <Card
                  className="cursor-pointer border-dashed hover:border-primary/50 hover:bg-muted/50 transition-all"
                  onClick={() => setShowNewProjectDialog(true)}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full min-h-[120px] text-muted-foreground">
                    <Plus className="h-8 w-8 mb-2" />
                    <span>新建项目</span>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>

      {/* 新建项目对话框 */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建项目</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="请输入项目名称"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)} className="cursor-pointer">
              取消
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="cursor-pointer">
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除项目</DialogTitle>
            <DialogDescription>
              确定要删除项目 "{currentProject?.name}" 吗？此操作不可撤销，所有分镜数据将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="cursor-pointer">
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject} className="cursor-pointer">
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 图片预览弹窗 */}
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}

export default App;

import { useEffect, useRef, useState } from 'react';
import { useStoryboardStore } from '@/stores/storyboardStore';
import { StoryboardTable } from '@/components/StoryboardTable';
import { ExportButtons } from '@/components/ExportButtons';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import type { Project } from '@/types';
import {
  Film,
  FolderOpen,
  Plus,
  Trash2,
  ChevronDown,
  Pencil,
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
    updateProjectName,
    deleteCurrentProject,
    save,
    setPreviewImage,
  } = useStoryboardStore();

  const tableRef = useRef<HTMLDivElement>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [projectName, setProjectName] = useState('');
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

  // 同步项目名称
  useEffect(() => {
    if (currentProject) {
      setProjectName(currentProject.name);
    }
  }, [currentProject?.name]);

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
    if (confirm('确定要删除当前项目吗？此操作不可撤销。')) {
      await deleteCurrentProject();
    }
  };

  const handleNameBlur = () => {
    setEditingName(false);
    if (projectName !== currentProject?.name) {
      updateProjectName(projectName);
    }
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
      {/* 顶部导航 */}
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 左侧：Logo 和项目名 */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Film className="w-6 h-6 text-primary" />
                闪电分镜
              </h1>

              {currentProject && (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                  {editingName ? (
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onBlur={handleNameBlur}
                      onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                      className="h-8 w-48"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      {currentProject.name}
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-3">
              {currentProject && <ExportButtons tableRef={tableRef} />}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    项目
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={() => setShowNewProjectDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建项目
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {projects.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      暂无项目
                    </div>
                  ) : (
                    projects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        className={currentProject?.id === project.id ? 'bg-accent' : ''}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate">{project.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {project.storyboards.length} 个分镜
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {currentProject && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteProject}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentProject ? (
          <>
            {/* 统计信息 */}
            <div className="mb-4 flex items-center gap-6 text-sm text-muted-foreground">
              <span>共 {currentProject.storyboards.length} 个分镜</span>
              <span>
                总时长：
                {currentProject.storyboards.reduce((sum, sb) => sum + (sb.duration || 0), 0)} 秒
              </span>
            </div>

            {/* 分镜表格 */}
            <StoryboardTable ref={tableRef} />
          </>
        ) : (
          <Card className="max-w-md mx-auto mt-20">
            <CardContent className="p-12 text-center">
              <Film className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-medium mb-2">欢迎使用闪电分镜</h2>
              <p className="text-muted-foreground mb-6">快速创建和管理您的分镜脚本</p>
              <Button onClick={() => setShowNewProjectDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                创建新项目
              </Button>
            </CardContent>
          </Card>
        )}
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
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              创建
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

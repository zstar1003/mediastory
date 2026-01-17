import { useState, useCallback } from 'react';
import { ChevronRight, Pencil, Download, Upload, Share2, Cloud, LogOut, User, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useStoryboardStore } from '@/stores/storyboardStore';
import { useCloudStore } from '@/stores/cloudStore';
import { exportProject, importProject } from '@/utils/projectIO';
import logoImg from '/logo.png';

// Logo 组件 - 完全静态
function LogoStatic() {
  const handleClick = async () => {
    const state = useStoryboardStore.getState();
    if (state.currentProject) {
      await state.save();
    }
    state.setCurrentProject(null);
    await state.loadProjects();
  };

  return (
    <button
      onClick={handleClick}
      className="text-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
    >
      <img src={logoImg} alt="极速分镜" className="w-8 h-8" />
      <span className="text-foreground">极速分镜</span>
    </button>
  );
}

// 项目名称编辑组件
function ProjectNameEditor() {
  const currentProject = useStoryboardStore((state) => state.currentProject);
  const updateProjectName = useStoryboardStore((state) => state.updateProjectName);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const projectName = currentProject?.name ?? null;
  const isInProject = projectName !== null;

  const handleStartEdit = useCallback(() => {
    if (projectName) {
      setTempName(projectName);
      setEditingName(true);
    }
  }, [projectName]);

  const handleFinishEdit = useCallback(() => {
    setEditingName(false);
    if (tempName && tempName !== projectName) {
      updateProjectName(tempName);
    }
  }, [tempName, projectName, updateProjectName]);

  return (
    <div
      className={`flex items-center gap-2 pl-4 border-l transition-opacity duration-200 ${
        isInProject ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      {editingName ? (
        <Input
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleFinishEdit}
          onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit()}
          className="h-8 w-48"
          autoFocus
        />
      ) : (
        <button
          onClick={handleStartEdit}
          className="text-foreground hover:text-primary flex items-center gap-1 transition-colors font-medium cursor-pointer"
        >
          <span className="max-w-[200px] truncate">{projectName}</span>
          <Pencil className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </button>
      )}
    </div>
  );
}

// 右侧操作按钮组件 - 需要从 App 获取 tableRef 和 onDeleteProject
function HeaderActions() {
  const currentProject = useStoryboardStore((state) => state.currentProject);
  const addImportedProject = useStoryboardStore((state) => state.addImportedProject);
  const { user, isAuthenticated, logout } = useCloudStore();
  const isInProject = currentProject !== null;

  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);

  // 导出项目
  const handleExport = () => {
    if (currentProject) {
      // 先保存当前项目
      useStoryboardStore.getState().save();
      exportProject(currentProject);
    }
  };

  // 导入项目
  const handleImport = async () => {
    const project = await importProject();
    if (project) {
      await addImportedProject(project);
    }
  };

  // 显示功能暂不支持提示
  const handleFeatureNotSupported = () => {
    setFeatureDialogOpen(true);
  };

  return (
    <div className="flex items-center gap-2">
      {/* 项目内操作 */}
      <div
        className={`flex items-center gap-2 transition-opacity duration-200 ${
          isInProject ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={handleFeatureNotSupported}
        >
          <Share2 className="h-4 w-4 mr-1" />
          分享
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-1" />
          导出
        </Button>
      </div>

      {/* 导入按钮 - 始终显示 */}
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer"
        onClick={handleImport}
      >
        <Upload className="h-4 w-4 mr-1" />
        导入
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* 云端账户 */}
      {isAuthenticated ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <User className="h-4 w-4" />
            {user?.nickname}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={logout}
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={handleFeatureNotSupported}
        >
          <Cloud className="h-4 w-4 mr-1" />
          登录
        </Button>
      )}

      {/* 功能暂不支持提示弹窗 */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              功能提示
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              暂不支持云同步和分享功能，敬请期待！
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setFeatureDialogOpen(false)}>
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 独立的 Header Portal 组件 - 渲染到独立的 React root
export function HeaderPortal() {
  return (
    <header className="bg-background border-b sticky top-0 z-40">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between h-10">
          <div className="flex items-center gap-4">
            <LogoStatic />
            <ProjectNameEditor />
          </div>
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}

// 保留原来的 Header 接口以便兼容
interface HeaderProps {
  onDeleteProject: () => void;
  tableRef: React.RefObject<HTMLDivElement | null>;
}

export function Header(_props: HeaderProps) {
  return null; // 不再渲染，由 HeaderPortal 接管
}

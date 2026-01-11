import { useState, useCallback } from 'react';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStoryboardStore } from '@/stores/storyboardStore';

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
      <img src="/logo.png" alt="极速分镜" className="w-8 h-8" />
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
  const isInProject = currentProject !== null;

  // 通过全局事件触发删除对话框
  const handleDelete = () => {
    window.dispatchEvent(new CustomEvent('open-delete-dialog'));
  };

  return (
    <div
      className={`flex items-center gap-3 transition-opacity duration-200 ${
        isInProject ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* 导出按钮暂时移除，因为需要 tableRef */}
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
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

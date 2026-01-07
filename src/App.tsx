import { useEffect, useRef, useState } from 'react';
import { useStoryboardStore } from './stores/storyboardStore';
import { StoryboardTable } from './components/StoryboardTable';
import { ExportButtons } from './components/ExportButtons';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import type { Project } from './types';

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
  const [showProjectList, setShowProjectList] = useState(false);
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
    const name = prompt('请输入项目名称:', '新建分镜项目');
    if (name) {
      await createProject(name);
    }
  };

  const handleSelectProject = async (project: Project) => {
    await loadProject(project.id);
    setShowProjectList(false);
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 左侧：Logo 和项目名 */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                闪电分镜
              </h1>

              {currentProject && (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
                  {editingName ? (
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onBlur={handleNameBlur}
                      onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                      className="px-2 py-1 border rounded focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => setEditingName(true)}
                      className="text-gray-600 cursor-pointer hover:text-gray-800"
                    >
                      {currentProject.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-3">
              {currentProject && <ExportButtons tableRef={tableRef} />}

              <div className="w-px h-6 bg-gray-300" />

              <div className="relative">
                <button
                  onClick={() => setShowProjectList(!showProjectList)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  项目列表
                </button>

                {/* 项目列表下拉 */}
                {showProjectList && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <div className="p-2 border-b border-gray-100">
                      <button
                        onClick={handleCreateProject}
                        className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        新建项目
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {projects.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          暂无项目
                        </div>
                      ) : (
                        projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => handleSelectProject(project)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between
                              ${currentProject?.id === project.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                          >
                            <span className="truncate">{project.name}</span>
                            <span className="text-xs text-gray-400">
                              {project.storyboards.length} 个分镜
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {currentProject && (
                <button
                  onClick={handleDeleteProject}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除项目"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
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
            <div className="mb-4 flex items-center gap-6 text-sm text-gray-500">
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
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <h2 className="text-xl font-medium text-gray-600 mb-2">欢迎使用闪电分镜</h2>
            <p className="text-gray-400 mb-6">快速创建和管理您的分镜脚本</p>
            <button
              onClick={handleCreateProject}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              创建新项目
            </button>
          </div>
        )}
      </main>

      {/* 图片预览弹窗 */}
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* 点击其他区域关闭项目列表 */}
      {showProjectList && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowProjectList(false)}
        />
      )}
    </div>
  );
}

export default App;

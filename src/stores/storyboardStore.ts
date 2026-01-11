import { create } from 'zustand';
import { createEmptyStoryboard } from '../types';
import type { Project, Storyboard, ReferenceImage, Material, ProjectInfo } from '../types';
import { saveProject, getProject, getAllProjects, deleteProject, createNewProject } from '../utils/db';

interface StoryboardStore {
  // 状态
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  previewImage: string | null;

  // 项目操作
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (name?: string) => Promise<Project>;
  updateProjectName: (name: string) => void;
  updateProjectInfo: (info: Partial<ProjectInfo>) => void;
  deleteCurrentProject: () => Promise<void>;
  addImportedProject: (project: Project) => Promise<void>;

  // 分镜操作
  addStoryboard: (index?: number) => void;
  updateStoryboard: (id: string, updates: Partial<Storyboard>) => void;
  deleteStoryboard: (id: string) => void;
  moveStoryboard: (fromIndex: number, toIndex: number) => void;
  duplicateStoryboard: (id: string) => void;

  // 参考图操作
  addSceneReference: (ref: ReferenceImage) => void;
  removeSceneReference: (id: string) => void;
  addCharacterReference: (ref: ReferenceImage) => void;
  removeCharacterReference: (id: string) => void;

  // 素材箱操作
  addMaterial: (material: Material) => void;
  removeMaterial: (id: string) => void;

  // 图片预览
  setPreviewImage: (image: string | null) => void;

  // 设置当前项目
  setCurrentProject: (project: Project | null) => void;

  // 保存
  save: () => Promise<void>;
}

export const useStoryboardStore = create<StoryboardStore>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  previewImage: null,

  loadProjects: async () => {
    set({ isLoading: true });
    const projects = await getAllProjects();
    set({ projects, isLoading: false });
  },

  loadProject: async (id: string) => {
    set({ isLoading: true });
    const project = await getProject(id);
    if (project) {
      set({ currentProject: project, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  createProject: async (name?: string) => {
    const project = createNewProject(name);
    // 添加一个空的分镜作为起始
    project.storyboards = [createEmptyStoryboard()];
    await saveProject(project);
    set({ currentProject: project });
    await get().loadProjects();
    return project;
  },

  updateProjectName: (name: string) => {
    const { currentProject } = get();
    if (currentProject) {
      set({ currentProject: { ...currentProject, name } });
    }
  },

  updateProjectInfo: (info: Partial<ProjectInfo>) => {
    const { currentProject } = get();
    if (currentProject) {
      set({
        currentProject: {
          ...currentProject,
          info: { ...currentProject.info, ...info },
        },
      });
    }
  },

  deleteCurrentProject: async () => {
    const { currentProject } = get();
    if (currentProject) {
      await deleteProject(currentProject.id);
      set({ currentProject: null });
      await get().loadProjects();
    }
  },

  addImportedProject: async (project: Project) => {
    await saveProject(project);
    set({ currentProject: project });
    await get().loadProjects();
  },

  addStoryboard: (index?: number) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const storyboards = [...currentProject.storyboards];
    const insertIndex = index !== undefined ? index + 1 : storyboards.length;

    // 自动计算镜头号
    let shotNumber = '1';
    if (storyboards.length > 0) {
      const prevBoard = storyboards[insertIndex - 1] || storyboards[storyboards.length - 1];
      shotNumber = String(parseInt(prevBoard.shotNumber || '0') + 1);
    }

    const newBoard = createEmptyStoryboard(shotNumber);
    storyboards.splice(insertIndex, 0, newBoard);

    set({ currentProject: { ...currentProject, storyboards } });
  },

  updateStoryboard: (id: string, updates: Partial<Storyboard>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const storyboards = currentProject.storyboards.map((sb) =>
      sb.id === id ? { ...sb, ...updates } : sb
    );
    set({ currentProject: { ...currentProject, storyboards } });
  },

  deleteStoryboard: (id: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const storyboards = currentProject.storyboards.filter((sb) => sb.id !== id);
    set({ currentProject: { ...currentProject, storyboards } });
  },

  moveStoryboard: (fromIndex: number, toIndex: number) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const storyboards = [...currentProject.storyboards];
    const [moved] = storyboards.splice(fromIndex, 1);
    storyboards.splice(toIndex, 0, moved);
    set({ currentProject: { ...currentProject, storyboards } });
  },

  duplicateStoryboard: (id: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const index = currentProject.storyboards.findIndex((sb) => sb.id === id);
    if (index === -1) return;

    const original = currentProject.storyboards[index];
    const duplicate: Storyboard = {
      ...original,
      id: crypto.randomUUID(),
      shotNumber: String(parseInt(original.shotNumber || '0') + 1),
    };

    const storyboards = [...currentProject.storyboards];
    storyboards.splice(index + 1, 0, duplicate);
    set({ currentProject: { ...currentProject, storyboards } });
  },

  // 场景参考图
  addSceneReference: (ref: ReferenceImage) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({
      currentProject: {
        ...currentProject,
        sceneReferences: [...currentProject.sceneReferences, ref],
      },
    });
  },

  removeSceneReference: (id: string) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({
      currentProject: {
        ...currentProject,
        sceneReferences: currentProject.sceneReferences.filter((r) => r.id !== id),
      },
    });
  },

  // 人物参考图
  addCharacterReference: (ref: ReferenceImage) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({
      currentProject: {
        ...currentProject,
        characterReferences: [...currentProject.characterReferences, ref],
      },
    });
  },

  removeCharacterReference: (id: string) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({
      currentProject: {
        ...currentProject,
        characterReferences: currentProject.characterReferences.filter((r) => r.id !== id),
      },
    });
  },

  // 素材箱
  addMaterial: (material: Material) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({
      currentProject: {
        ...currentProject,
        materials: [...currentProject.materials, material],
      },
    });
  },

  removeMaterial: (id: string) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({
      currentProject: {
        ...currentProject,
        materials: currentProject.materials.filter((m) => m.id !== id),
      },
    });
  },

  setPreviewImage: (image: string | null) => {
    set({ previewImage: image });
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  save: async () => {
    const { currentProject } = get();
    if (currentProject) {
      await saveProject(currentProject);
      // 不再每次保存都刷新项目列表，避免界面闪烁
    }
  },
}));

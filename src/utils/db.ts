import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Project } from '../types';
import { createEmptyProjectInfo } from '../types';

interface StoryboardDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-updated': number };
  };
}

const DB_NAME = 'storyboard-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<StoryboardDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<StoryboardDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<StoryboardDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('projects', { keyPath: 'id' });
      store.createIndex('by-updated', 'updatedAt');
    },
  });

  return dbInstance;
}

// 确保项目有新字段（向后兼容）
function ensureProjectFields(project: Project): Project {
  return {
    ...project,
    info: project.info || createEmptyProjectInfo(),
    sceneReferences: project.sceneReferences || [],
    characterReferences: project.characterReferences || [],
    materials: project.materials || [],
  };
}

// 获取所有项目
export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  const projects = await db.getAllFromIndex('projects', 'by-updated');
  return projects.reverse().map(ensureProjectFields); // 最新的在前面
}

// 获取单个项目
export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  const project = await db.get('projects', id);
  return project ? ensureProjectFields(project) : undefined;
}

// 保存项目
export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  project.updatedAt = Date.now();
  await db.put('projects', project);
}

// 删除项目
export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
}

// 创建新项目
export function createNewProject(name = '未命名项目'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    storyboards: [],
    info: createEmptyProjectInfo(),
    sceneReferences: [],
    characterReferences: [],
    materials: [],
  };
}

import type {
  CloudUser,
  CloudProject,
  ShareLink,
  EditHistoryItem,
  AuthResponse,
} from '@/types/cloud';
import type { Project } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 获取存储的 token
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

// 设置 token
export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

// 清除 token
export function clearToken(): void {
  localStorage.removeItem('auth_token');
}

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

// ========== 认证 API ==========

export async function register(
  email: string,
  password: string,
  nickname: string
): Promise<AuthResponse> {
  const result = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  });
  setToken(result.token);
  return result;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const result = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(result.token);
  return result;
}

export async function getCurrentUser(): Promise<CloudUser> {
  return request<CloudUser>('/api/auth/me');
}

export async function updateProfile(
  data: { nickname?: string; avatar?: string }
): Promise<CloudUser> {
  return request<CloudUser>('/api/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function logout(): void {
  clearToken();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ========== 项目 API ==========

export async function getCloudProjects(): Promise<CloudProject[]> {
  return request<CloudProject[]>('/api/projects');
}

export async function getCloudProject(id: string): Promise<CloudProject & { data: Project }> {
  return request<CloudProject & { data: Project }>(`/api/projects/${id}`);
}

export async function uploadProject(project: Project): Promise<{ id: string; version: number }> {
  return request<{ id: string; version: number }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      localId: project.id,
      name: project.name,
      data: project,
    }),
  });
}

export async function updateCloudProject(
  id: string,
  data: Project,
  changes?: { action: string; targetType: string; targetId?: string; changes?: unknown[] }[]
): Promise<{ id: string; version: number }> {
  return request<{ id: string; version: number }>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ data, changes }),
  });
}

export async function deleteCloudProject(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

// ========== 分享 API ==========

export async function createShareLink(
  projectId: string,
  options: { permission: 'read' | 'edit'; expiresIn?: number; maxUses?: number }
): Promise<ShareLink> {
  return request<ShareLink>(`/api/projects/${projectId}/share`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

export async function getShareLinks(projectId: string): Promise<ShareLink[]> {
  return request<ShareLink[]>(`/api/projects/${projectId}/share`);
}

export async function deleteShareLink(projectId: string, linkId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/projects/${projectId}/share/${linkId}`, {
    method: 'DELETE',
  });
}

export async function joinByShareLink(token: string): Promise<{ projectId: string; permission: string }> {
  return request<{ projectId: string; permission: string }>(`/api/projects/join/${token}`, {
    method: 'POST',
  });
}

// ========== 协作者 API ==========

export async function getCollaborators(projectId: string): Promise<{
  owner: CloudUser;
  collaborators: { userId: CloudUser; permission: string; addedAt: string }[];
}> {
  return request(`/api/projects/${projectId}/collaborators`);
}

export async function updateCollaboratorPermission(
  projectId: string,
  collaboratorId: string,
  permission: 'read' | 'edit'
): Promise<void> {
  await request<{ success: boolean }>(`/api/projects/${projectId}/collaborators/${collaboratorId}`, {
    method: 'PUT',
    body: JSON.stringify({ permission }),
  });
}

export async function removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/projects/${projectId}/collaborators/${collaboratorId}`, {
    method: 'DELETE',
  });
}

// ========== 历史记录 API ==========

export async function getEditHistory(
  projectId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ items: EditHistoryItem[]; total: number }> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', String(options.limit));
  if (options.offset) params.set('offset', String(options.offset));

  return request<{ items: EditHistoryItem[]; total: number }>(
    `/api/projects/${projectId}/history?${params.toString()}`
  );
}

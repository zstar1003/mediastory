import type { Project } from '@/types';

// 文件格式版本
const FORMAT_VERSION = '1.0';
const FORMAT_NAME = 'jsfj'; // 极速分镜

// 导出文件结构
interface ExportedProject {
  version: string;
  format: string;
  exportedAt: number;
  project: Project;
}

/**
 * 导出项目为 .jsfj 文件
 */
export const exportProject = (project: Project): void => {
  const exportData: ExportedProject = {
    version: FORMAT_VERSION,
    format: FORMAT_NAME,
    exportedAt: Date.now(),
    project: project,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name}_${formatDate(new Date())}.jsfj`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 导入 .jsfj 文件
 */
export const importProject = (): Promise<Project | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jsfj';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text) as ExportedProject;

        // 验证文件格式
        if (data.format !== FORMAT_NAME) {
          alert('无效的文件格式');
          resolve(null);
          return;
        }

        // 生成新的项目ID以避免冲突
        const importedProject: Project = {
          ...data.project,
          id: crypto.randomUUID(),
          name: `${data.project.name} (导入)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        resolve(importedProject);
      } catch (err) {
        console.error('导入失败:', err);
        alert('文件解析失败，请确保文件格式正确');
        resolve(null);
      }
    };

    input.click();
  });
};

/**
 * 格式化日期为 YYYYMMDD_HHmmss
 */
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

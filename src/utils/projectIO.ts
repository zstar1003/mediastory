import JSZip from 'jszip';
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

/**
 * 将 base64 data URL 转换为 Blob
 */
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * 根据 MIME 类型获取文件扩展名
 */
const getVideoExtension = (dataURL: string): string => {
  const mimeMatch = dataURL.match(/data:(.*?);/);
  if (!mimeMatch) return '.mp4';

  const mime = mimeMatch[1];
  const mimeToExt: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogg',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/x-matroska': '.mkv',
  };

  return mimeToExt[mime] || '.mp4';
};

/**
 * 导出项目所有视频为 zip 文件
 */
export const exportVideosAsZip = async (project: Project): Promise<void> => {
  const videosWithShot = project.storyboards
    .filter((sb) => sb.videoData)
    .map((sb) => ({
      shotNumber: sb.shotNumber,
      videoData: sb.videoData!,
    }));

  if (videosWithShot.length === 0) {
    alert('当前项目没有视频可下载');
    return;
  }

  const zip = new JSZip();

  // 按分镜顺序添加视频到 zip
  videosWithShot.forEach((item, index) => {
    const blob = dataURLtoBlob(item.videoData);
    const ext = getVideoExtension(item.videoData);
    // 使用序号和镜头号作为文件名，如 "001_镜头1.mp4"
    const fileName = `${String(index + 1).padStart(3, '0')}_镜头${item.shotNumber}${ext}`;
    zip.file(fileName, blob);
  });

  // 生成 zip 文件并下载
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name}_视频_${formatDate(new Date())}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

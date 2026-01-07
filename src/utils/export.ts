import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Project } from '../types';

// 导出为 JSON
export function exportToJSON(project: Project): void {
  const dataStr = JSON.stringify(project, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  downloadBlob(blob, `${project.name}.json`);
}

// 从 JSON 导入
export async function importFromJSON(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target?.result as string) as Project;
        // 生成新的 ID 以避免冲突
        project.id = crypto.randomUUID();
        project.createdAt = Date.now();
        project.updatedAt = Date.now();
        resolve(project);
      } catch (err) {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

// 导出为 PNG
export async function exportToPNG(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, `${filename}.png`);
    }
  }, 'image/png');
}

// 导出为 PDF
export async function exportToPDF(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // A4 尺寸 (pt)
  const pdfWidth = 595.28;
  const pdfHeight = 841.89;

  // 计算缩放比例
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const finalWidth = imgWidth * ratio;
  const finalHeight = imgHeight * ratio;

  // 如果内容超出一页，创建多页 PDF
  if (finalHeight > pdfHeight) {
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageCount = Math.ceil(imgHeight / (pdfHeight / ratio));

    for (let i = 0; i < pageCount; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      // 裁剪画布的对应部分
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.min(pdfHeight / ratio, imgHeight - i * (pdfHeight / ratio));

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          i * (pdfHeight / ratio),
          imgWidth,
          pageCanvas.height,
          0,
          0,
          imgWidth,
          pageCanvas.height
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const pageImgHeight = pageCanvas.height * ratio;
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, pageImgHeight);
      }
    }

    pdf.save(`${filename}.pdf`);
  } else {
    const pdf = new jsPDF({
      orientation: finalWidth > finalHeight ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [finalWidth, finalHeight],
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight);
    pdf.save(`${filename}.pdf`);
  }
}

// 下载 Blob
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

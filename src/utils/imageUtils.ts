// 压缩图片
export async function compressImage(
  file: File | Blob,
  maxWidth = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 等比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

// 从剪贴板获取图片
export async function getImageFromClipboard(
  clipboardData: DataTransfer
): Promise<File | null> {
  const items = clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();
      return blob;
    }
  }
  return null;
}

// 从拖拽事件获取图片
export function getImageFromDrop(
  dataTransfer: DataTransfer
): File | null {
  const files = dataTransfer.files;
  for (let i = 0; i < files.length; i++) {
    if (files[i].type.startsWith('image/')) {
      return files[i];
    }
  }
  return null;
}

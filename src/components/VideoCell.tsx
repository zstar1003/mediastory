import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Video, Trash2, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface VideoCellProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  storyboardId?: string; // 用于分镜间拖拽
}

// 读取视频文件为 base64
const readVideoFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => reject(new Error('视频读取失败'));
    reader.readAsDataURL(file);
  });
};

// 从视频提取首帧缩略图
const extractVideoThumbnail = (videoSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.onloadeddata = () => {
      // 确保视频已加载
      video.currentTime = 0;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          reject(new Error('无法创建canvas上下文'));
        }
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = () => reject(new Error('视频加载失败'));
    video.src = videoSrc;
  });
};

export const VideoCell = ({ value, onChange, storyboardId }: VideoCellProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragImageRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  // 当视频值变化时，提取缩略图
  useEffect(() => {
    if (value) {
      extractVideoThumbnail(value)
        .then(setThumbnail)
        .catch((err) => {
          console.error('提取视频缩略图失败:', err);
          setThumbnail(null);
        });
    } else {
      setThumbnail(null);
    }
  }, [value]);

  const handleFile = useCallback(async (file: File) => {
    // 限制文件大小为 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('视频文件不能超过 50MB');
      return;
    }
    try {
      const dataUrl = await readVideoFile(file);
      onChange(dataUrl);
    } catch (err) {
      console.error('视频处理失败:', err);
    }
  }, [onChange]);

  const handleClick = () => {
    if (value) {
      setShowPreview(true);
    } else {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // 检查是否是从素材箱或其他分镜拖入的
    const materialData = e.dataTransfer.getData('application/json');
    if (materialData) {
      try {
        const material = JSON.parse(materialData);
        if (material.type === 'video' && material.data) {
          onChange(material.data);

          // 如果是从其他分镜拖入的，通知源分镜清除视频
          if (material.fromStoryboard && material.sourceStoryboardId && material.sourceStoryboardId !== storyboardId) {
            window.dispatchEvent(new CustomEvent('storyboard-video-cleared', {
              detail: { storyboardId: material.sourceStoryboardId }
            }));
          } else if (!material.fromStoryboard && !material.fromReference) {
            // 从素材箱拖入的，通知素材箱移除该素材
            window.dispatchEvent(new CustomEvent('material-dropped', {
              detail: { materialId: material.id }
            }));
          }
          return;
        }
      } catch {
        // 不是有效的素材数据，继续处理文件拖拽
      }
    }

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  // 处理视频拖出到素材箱或其他分镜
  const handleVideoDragStart = (e: React.DragEvent) => {
    if (!value) {
      e.preventDefault();
      return;
    }
    const material = {
      id: `storyboard-video-${Date.now()}`,
      name: '分镜视频',
      type: 'video',
      data: value,
      thumbnail: thumbnail,
      createdAt: Date.now(),
      fromStoryboard: true,
      sourceStoryboardId: storyboardId,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(material));
    e.dataTransfer.effectAllowed = 'copy';

    // 创建自定义拖拽图像（使用缩略图）
    if (dragImageRef.current && thumbnail) {
      const dragImage = dragImageRef.current;
      dragImage.innerHTML = '';
      const img = document.createElement('img');
      img.src = thumbnail;
      img.style.cssText = 'width: 100px; height: 60px; object-fit: cover; border-radius: 8px; opacity: 0.8; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
      dragImage.appendChild(img);
      e.dataTransfer.setDragImage(dragImage, 50, 30);
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          value && "border-solid border-border"
        )}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {value ? (
          <div
            className="w-full h-full cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={handleVideoDragStart}
          >
            {thumbnail ? (
              <div className="relative w-full h-full">
                <img
                  src={thumbnail}
                  alt="视频缩略图"
                  className="w-full h-full object-contain rounded-lg pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="h-5 w-5 text-white ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Play className="h-8 w-8 mx-auto text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">加载中...</span>
                </div>
              </div>
            )}
            <div className="absolute top-1 right-1 flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6"
                onClick={handleReplace}
              >
                <Video className="h-3 w-3" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Plus className="h-6 w-6 mb-1" />
            <span className="text-xs">上传视频</span>
          </div>
        )}
      </div>

      {/* 隐藏的拖拽图像容器 */}
      <div
        ref={dragImageRef}
        style={{
          position: 'fixed',
          top: '-1000px',
          left: '-1000px',
          pointerEvents: 'none',
        }}
      />

      {/* 视频预览弹窗 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {value && (
            <video
              src={value}
              controls
              autoPlay
              className="w-full max-h-[80vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

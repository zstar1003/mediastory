import { useRef, useState, useEffect } from 'react';
import { useStoryboardStore } from '@/stores/storyboardStore';
import type { Material } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Image,
  Video,
  Plus,
  Trash2,
  FolderOpen,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 从视频提取首帧缩略图
const extractVideoThumbnail = (videoSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.onloadeddata = () => {
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

// 素材拖放区组件
interface MaterialDropZoneProps {
  type: 'image' | 'video';
  materials: Material[];
  onPreview: (image: string) => void;
}

const MaterialDropZone = ({ type, materials, onPreview }: MaterialDropZoneProps) => {
  const { addMaterial, removeMaterial } = useStoryboardStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragImageRef = useRef<HTMLDivElement>(null);

  // 处理拖放进入素材箱
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const materialData = e.dataTransfer.getData('application/json');
    if (materialData) {
      try {
        const data = JSON.parse(materialData);
        // 只接受对应类型的素材
        if (data.type === type && data.data) {
          // 检查是否来自分镜或参考图（不是素材箱自己的）
          if (data.fromStoryboard || data.fromReference) {
            const material: Material = {
              id: crypto.randomUUID(),
              name: data.name || (type === 'image' ? '图片素材' : '视频素材'),
              type: type,
              data: data.data,
              createdAt: Date.now(),
            };
            addMaterial(material);

            // 如果来自分镜，通知源分镜清除图片/视频
            if (data.fromStoryboard && data.sourceStoryboardId) {
              if (data.type === 'image') {
                window.dispatchEvent(new CustomEvent('storyboard-image-cleared', {
                  detail: { storyboardId: data.sourceStoryboardId }
                }));
              } else if (data.type === 'video') {
                window.dispatchEvent(new CustomEvent('storyboard-video-cleared', {
                  detail: { storyboardId: data.sourceStoryboardId }
                }));
              }
            }
          }
        }
      } catch {
        // 忽略无效数据
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // 处理素材拖出
  const handleDragStart = (e: React.DragEvent, material: Material) => {
    e.dataTransfer.setData('application/json', JSON.stringify(material));
    e.dataTransfer.effectAllowed = 'move';

    // 创建自定义拖拽图像
    if (dragImageRef.current) {
      const dragImage = dragImageRef.current;
      dragImage.innerHTML = '';

      if (material.type === 'image') {
        const img = document.createElement('img');
        img.src = material.data;
        img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 8px; opacity: 0.8; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        dragImage.appendChild(img);
      } else {
        const video = document.createElement('video');
        video.src = material.data;
        video.style.cssText = 'width: 100px; height: 60px; object-fit: cover; border-radius: 8px; opacity: 0.8; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        dragImage.appendChild(video);
      }

      e.dataTransfer.setDragImage(dragImage, 40, 40);
    }
  };

  if (type === 'image') {
    return (
      <div
        className={cn(
          'min-h-[200px] rounded-lg transition-colors',
          isDragging && 'bg-primary/10 ring-2 ring-primary/50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {materials.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无图片素材</p>
            <p className="text-sm">点击上方按钮添加，或从分镜拖入</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleDragStart(e, material)}
                onClick={() => onPreview(material.data)}
              >
                <img
                  src={material.data}
                  alt={material.name}
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {material.name}
                </div>
                <button
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMaterial(material.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
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
      </div>
    );
  }

  // 视频类型
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});

  // 为视频生成缩略图
  useEffect(() => {
    if (type !== 'video') return;

    materials.forEach(async (material) => {
      if (!videoThumbnails[material.id]) {
        try {
          const thumbnail = await extractVideoThumbnail(material.data);
          setVideoThumbnails(prev => ({ ...prev, [material.id]: thumbnail }));
        } catch (err) {
          console.error('生成视频缩略图失败:', err);
        }
      }
    });
  }, [materials, type, videoThumbnails]);

  // 处理视频素材拖出（使用缩略图）
  const handleVideoDragStart = (e: React.DragEvent, material: Material) => {
    const thumbnail = videoThumbnails[material.id];
    const materialWithThumbnail = { ...material, thumbnail };
    e.dataTransfer.setData('application/json', JSON.stringify(materialWithThumbnail));
    e.dataTransfer.effectAllowed = 'move';

    // 使用缩略图作为拖拽图像
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
    <div
      className={cn(
        'min-h-[200px] rounded-lg transition-colors',
        isDragging && 'bg-primary/10 ring-2 ring-primary/50'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {materials.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无视频素材</p>
          <p className="text-sm">点击上方按钮添加，或从分镜拖入</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => {
            const thumbnail = videoThumbnails[material.id];
            return (
              <div
                key={material.id}
                className="relative group rounded-lg overflow-hidden border bg-muted cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleVideoDragStart(e, material)}
              >
                {thumbnail ? (
                  <div className="relative w-full aspect-video">
                    <img
                      src={thumbnail}
                      alt={material.name}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-muted">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-2 truncate">
                  {material.name}
                </div>
                <button
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMaterial(material.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
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
    </div>
  );
};

interface MaterialPanelProps {
  onPreview: (image: string) => void;
}

export const MaterialPanel = ({ onPreview }: MaterialPanelProps) => {
  const { currentProject, addMaterial } = useStoryboardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 监听素材拖拽完成事件
  useEffect(() => {
    const handleMaterialDropped = (e: CustomEvent<{ materialId: string }>) => {
      const { removeMaterial } = useStoryboardStore.getState();
      removeMaterial(e.detail.materialId);
    };
    window.addEventListener('material-dropped', handleMaterialDropped as EventListener);
    return () => {
      window.removeEventListener('material-dropped', handleMaterialDropped as EventListener);
    };
  }, []);

  if (!currentProject) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) continue;

      // 文件大小限制：图片 10MB，视频 100MB
      const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`文件 ${file.name} 太大，${isImage ? '图片' : '视频'}最大 ${isImage ? '10' : '100'}MB`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const material: Material = {
          id: crypto.randomUUID(),
          name: file.name,
          type: isImage ? 'image' : 'video',
          data: reader.result as string,
          createdAt: Date.now(),
        };
        addMaterial(material);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const imageMaterials = currentProject.materials.filter((m) => m.type === 'image');
  const videoMaterials = currentProject.materials.filter((m) => m.type === 'video');

  return (
    <>
      {/* 展开/收起按钮 */}
      <button
        className={cn(
          'fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-primary text-primary-foreground p-2 rounded-l-lg shadow-lg cursor-pointer transition-all hover:bg-primary/90',
          isOpen && 'right-80'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* 素材面板 */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-80 bg-background border-l shadow-xl z-40 transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* 标题 */}
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              素材箱
            </h3>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加素材
            </Button>
          </div>

          {/* 标签页 */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'image' | 'video')}
            className="flex-1 flex flex-col"
          >
            <TabsList className="w-full justify-start rounded-none border-b px-4">
              <TabsTrigger value="image" className="flex items-center gap-1">
                <Image className="w-4 h-4" />
                图片 ({imageMaterials.length})
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-1">
                <Video className="w-4 h-4" />
                视频 ({videoMaterials.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="flex-1 overflow-auto p-4 m-0">
              <MaterialDropZone type="image" materials={imageMaterials} onPreview={onPreview} />
            </TabsContent>

            <TabsContent value="video" className="flex-1 overflow-auto p-4 m-0">
              <MaterialDropZone type="video" materials={videoMaterials} onPreview={onPreview} />
            </TabsContent>
          </Tabs>

          {/* 提示 */}
          <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
            拖拽素材到分镜表格中使用
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </>
  );
};

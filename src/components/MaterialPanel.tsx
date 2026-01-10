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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaterialPanelProps {
  onPreview: (image: string) => void;
}

export const MaterialPanel = ({ onPreview }: MaterialPanelProps) => {
  const { currentProject, addMaterial, removeMaterial } = useStoryboardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragImageRef = useRef<HTMLDivElement>(null);

  // 监听素材拖拽完成事件
  useEffect(() => {
    const handleMaterialDropped = (e: CustomEvent<{ materialId: string }>) => {
      removeMaterial(e.detail.materialId);
    };
    window.addEventListener('material-dropped', handleMaterialDropped as EventListener);
    return () => {
      window.removeEventListener('material-dropped', handleMaterialDropped as EventListener);
    };
  }, [removeMaterial]);

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
              {imageMaterials.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无图片素材</p>
                  <p className="text-sm">点击上方按钮添加</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {imageMaterials.map((material) => (
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
                        className="w-full h-full object-cover"
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
            </TabsContent>

            <TabsContent value="video" className="flex-1 overflow-auto p-4 m-0">
              {videoMaterials.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无视频素材</p>
                  <p className="text-sm">点击上方按钮添加</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {videoMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="relative group rounded-lg overflow-hidden border bg-muted cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => handleDragStart(e, material)}
                    >
                      <video
                        src={material.data}
                        className="w-full aspect-video object-cover"
                        muted
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
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
                  ))}
                </div>
              )}
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
    </>
  );
};

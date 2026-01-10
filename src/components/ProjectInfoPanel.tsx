import { useRef, useState } from 'react';
import { useStoryboardStore } from '@/stores/storyboardStore';
import type { ReferenceImage } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, ChevronDown, ChevronUp, Image, User, FileText, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceImageGridProps {
  images: ReferenceImage[];
  onAdd: (ref: ReferenceImage) => void;
  onRemove: (id: string) => void;
  onPreview: (image: string) => void;
  emptyText?: string;
}

const ReferenceImageGrid = ({ images, onAdd, onRemove, onPreview, emptyText = '添加图片' }: ReferenceImageGridProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = () => {
        const ref: ReferenceImage = {
          id: crypto.randomUUID(),
          name: file.name,
          data: reader.result as string,
        };
        onAdd(ref);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // 检查是否是从素材箱拖入的
    const materialData = e.dataTransfer.getData('application/json');
    if (materialData) {
      try {
        const material = JSON.parse(materialData);
        if (material.type === 'image' && material.data) {
          const ref: ReferenceImage = {
            id: crypto.randomUUID(),
            name: material.name || '素材图片',
            data: material.data,
          };
          onAdd(ref);
          // 触发事件通知素材箱移除该素材
          window.dispatchEvent(new CustomEvent('material-dropped', {
            detail: { materialId: material.id }
          }));
          return;
        }
      } catch {
        // 不是有效的素材数据
      }
    }

    // 处理文件拖拽
    const files = e.dataTransfer.files;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const ref: ReferenceImage = {
          id: crypto.randomUUID(),
          name: file.name,
          data: reader.result as string,
        };
        onAdd(ref);
      };
      reader.readAsDataURL(file);
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

  // 处理图片拖出到素材箱
  const handleImageDragStart = (e: React.DragEvent, img: ReferenceImage) => {
    e.stopPropagation();
    const material = {
      id: `ref-${img.id}`,
      name: img.name,
      type: 'image',
      data: img.data,
      createdAt: Date.now(),
      fromReference: true, // 标记来自参考图
    };
    e.dataTransfer.setData('application/json', JSON.stringify(material));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 p-2 -m-2 rounded-lg transition-colors',
        isDragging && 'bg-primary/10 ring-2 ring-primary/50'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {images.map((img) => (
        <div
          key={img.id}
          className="relative group w-16 h-16 rounded-lg overflow-hidden border bg-muted cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/50 transition-all"
          draggable
          onDragStart={(e) => handleImageDragStart(e, img)}
          onClick={() => onPreview(img.data)}
        >
          <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
          <button
            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(img.id);
            }}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
      <button
        className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all"
        onClick={() => fileInputRef.current?.click()}
      >
        <Plus className="w-5 h-5 text-gray-400" />
        <span className="text-[10px] text-gray-400 mt-0.5">{emptyText}</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export const ProjectInfoPanel = () => {
  const {
    currentProject,
    updateProjectInfo,
    addSceneReference,
    removeSceneReference,
    addCharacterReference,
    removeCharacterReference,
    setPreviewImage,
  } = useStoryboardStore();

  const [expanded, setExpanded] = useState(true);

  if (!currentProject) return null;

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader
        className="py-2.5 px-4 cursor-pointer hover:bg-muted/50 transition-colors border-b"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            项目设定
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{currentProject.sceneReferences.length} 场景</span>
            <span>·</span>
            <span>{currentProject.characterReferences.length} 人物</span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('p-0', !expanded && 'hidden')}>
        <div className="flex flex-col lg:flex-row">
          {/* 左侧：参考图区域 */}
          <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 场景参考图 */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
                  <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Image className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  场景参考
                </div>
                <ReferenceImageGrid
                  images={currentProject.sceneReferences}
                  onAdd={addSceneReference}
                  onRemove={removeSceneReference}
                  onPreview={setPreviewImage}
                  emptyText="添加"
                />
              </div>

              {/* 人物参考图 */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
                  <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  人物参考
                </div>
                <ReferenceImageGrid
                  images={currentProject.characterReferences}
                  onAdd={addCharacterReference}
                  onRemove={removeCharacterReference}
                  onPreview={setPreviewImage}
                  emptyText="添加"
                />
              </div>
            </div>
          </div>

          {/* 右侧：文字信息区域 */}
          <div className="w-full lg:w-96 p-4 space-y-3">
            {/* 剧情简介 */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                剧情简介
              </label>
              <Textarea
                value={currentProject.info.synopsis}
                onChange={(e) => updateProjectInfo({ synopsis: e.target.value })}
                placeholder="简要描述故事情节..."
                className="min-h-[60px] text-sm resize-none"
              />
            </div>

            {/* 风格说明和备注并排 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3 h-3" />
                  风格说明
                </label>
                <Textarea
                  value={currentProject.info.style}
                  onChange={(e) => updateProjectInfo({ style: e.target.value })}
                  placeholder="视觉风格..."
                  className="min-h-[50px] text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  备注
                </label>
                <Textarea
                  value={currentProject.info.notes}
                  onChange={(e) => updateProjectInfo({ notes: e.target.value })}
                  placeholder="其他备注..."
                  className="min-h-[50px] text-sm resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

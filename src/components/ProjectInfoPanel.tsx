import { useRef, useState } from 'react';
import { useStoryboardStore } from '@/stores/storyboardStore';
import type { ReferenceImage } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, ChevronDown, ChevronUp, Image, User, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceImageGridProps {
  images: ReferenceImage[];
  onAdd: (ref: ReferenceImage) => void;
  onRemove: (id: string) => void;
  onPreview: (image: string) => void;
}

const ReferenceImageGrid = ({ images, onAdd, onRemove, onPreview }: ReferenceImageGridProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative group w-20 h-20 rounded-lg overflow-hidden border bg-muted cursor-pointer"
          onClick={() => onPreview(img.data)}
        >
          <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
          <button
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(img.id);
            }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary flex items-center justify-center cursor-pointer transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Plus className="w-6 h-6 text-gray-400" />
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
    <Card className="mb-4">
      <CardHeader
        className="py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            项目信息
          </CardTitle>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('space-y-4', !expanded && 'hidden')}>
        {/* 场景参考图 */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium">
            <Image className="w-4 h-4" />
            场景参考图
          </div>
          <ReferenceImageGrid
            images={currentProject.sceneReferences}
            onAdd={addSceneReference}
            onRemove={removeSceneReference}
            onPreview={setPreviewImage}
          />
        </div>

        {/* 人物参考图 */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium">
            <User className="w-4 h-4" />
            人物参考图
          </div>
          <ReferenceImageGrid
            images={currentProject.characterReferences}
            onAdd={addCharacterReference}
            onRemove={removeCharacterReference}
            onPreview={setPreviewImage}
          />
        </div>

        {/* 项目信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">剧情简介</label>
            <Textarea
              value={currentProject.info.synopsis}
              onChange={(e) => updateProjectInfo({ synopsis: e.target.value })}
              placeholder="输入剧情简介..."
              className="min-h-[80px] resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">风格说明</label>
            <Textarea
              value={currentProject.info.style}
              onChange={(e) => updateProjectInfo({ style: e.target.value })}
              placeholder="输入风格说明..."
              className="min-h-[80px] resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">备注信息</label>
            <Textarea
              value={currentProject.info.notes}
              onChange={(e) => updateProjectInfo({ notes: e.target.value })}
              placeholder="输入备注信息..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

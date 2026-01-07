import { forwardRef } from 'react';
import { useStoryboardStore } from '@/stores/storyboardStore';
import { SHOT_SIZES, CAMERA_MOVEMENTS } from '@/types';
import type { Storyboard, ShotSize, CameraMovement } from '@/types';
import { ImageCell } from './ImageCell';
import { VideoCell } from './VideoCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Copy, Trash2, Plus } from 'lucide-react';

interface StoryboardRowProps {
  storyboard: Storyboard;
  index: number;
  onUpdate: (id: string, updates: Partial<Storyboard>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPreview: (image: string) => void;
}

const StoryboardRow = ({
  storyboard,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onPreview,
}: StoryboardRowProps) => {
  return (
    <TableRow>
      {/* 序号 */}
      <TableCell className="text-center font-medium text-muted-foreground w-14">
        {index + 1}
      </TableCell>

      {/* 镜头号 */}
      <TableCell className="w-20">
        <Input
          value={storyboard.shotNumber}
          onChange={(e) => onUpdate(storyboard.id, { shotNumber: e.target.value })}
          placeholder="镜头"
          className="text-center h-8"
        />
      </TableCell>

      {/* 参考图片 */}
      <TableCell className="w-40">
        <ImageCell
          value={storyboard.imageData}
          onChange={(v) => onUpdate(storyboard.id, { imageData: v })}
          onPreview={onPreview}
        />
      </TableCell>

      {/* 画面描述 */}
      <TableCell className="min-w-[280px]">
        <Textarea
          value={storyboard.description}
          onChange={(e) => onUpdate(storyboard.id, { description: e.target.value })}
          placeholder="描述画面内容..."
          className="min-h-[80px] resize-none"
        />
      </TableCell>

      {/* 对白/旁白 */}
      <TableCell className="min-w-[200px]">
        <Textarea
          value={storyboard.dialogue}
          onChange={(e) => onUpdate(storyboard.id, { dialogue: e.target.value })}
          placeholder="对白或旁白..."
          className="min-h-[80px] resize-none"
        />
      </TableCell>

      {/* 景别 */}
      <TableCell className="w-28">
        <Select
          value={storyboard.shotSize || undefined}
          onValueChange={(v) => onUpdate(storyboard.id, { shotSize: v as ShotSize })}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="景别" />
          </SelectTrigger>
          <SelectContent>
            {SHOT_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* 运镜 */}
      <TableCell className="w-28">
        <Select
          value={storyboard.cameraMovement || undefined}
          onValueChange={(v) => onUpdate(storyboard.id, { cameraMovement: v as CameraMovement })}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="运镜" />
          </SelectTrigger>
          <SelectContent>
            {CAMERA_MOVEMENTS.map((movement) => (
              <SelectItem key={movement} value={movement}>
                {movement}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* 时长 */}
      <TableCell className="w-20">
        <Input
          type="number"
          value={storyboard.duration || ''}
          onChange={(e) => onUpdate(storyboard.id, { duration: parseFloat(e.target.value) || 0 })}
          placeholder="秒"
          className="text-center h-8"
        />
      </TableCell>

      {/* 备注 */}
      <TableCell className="min-w-[120px]">
        <Input
          value={storyboard.notes}
          onChange={(e) => onUpdate(storyboard.id, { notes: e.target.value })}
          placeholder="备注..."
          className="h-8"
        />
      </TableCell>

      {/* 视频 */}
      <TableCell className="w-40">
        <VideoCell
          value={storyboard.videoData}
          onChange={(v) => onUpdate(storyboard.id, { videoData: v })}
        />
      </TableCell>

      {/* 操作 */}
      <TableCell className="w-20">
        <TooltipProvider>
          <div className="flex items-center justify-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => onDuplicate(storyboard.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>复制此行</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(storyboard.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>删除此行</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
};

export const StoryboardTable = forwardRef<HTMLDivElement>((_, ref) => {
  const {
    currentProject,
    updateStoryboard,
    deleteStoryboard,
    duplicateStoryboard,
    addStoryboard,
    setPreviewImage,
  } = useStoryboardStore();

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        请选择或创建一个项目
      </div>
    );
  }

  const storyboards = currentProject.storyboards;

  return (
    <div ref={ref} className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-14 text-center">#</TableHead>
            <TableHead className="w-20">镜头</TableHead>
            <TableHead className="w-40">参考图</TableHead>
            <TableHead className="min-w-[280px]">画面描述</TableHead>
            <TableHead className="min-w-[200px]">对白/旁白</TableHead>
            <TableHead className="w-28">景别</TableHead>
            <TableHead className="w-28">运镜</TableHead>
            <TableHead className="w-20">时长</TableHead>
            <TableHead className="min-w-[120px]">备注</TableHead>
            <TableHead className="w-40">视频</TableHead>
            <TableHead className="w-20 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {storyboards.map((sb, index) => (
            <StoryboardRow
              key={sb.id}
              storyboard={sb}
              index={index}
              onUpdate={updateStoryboard}
              onDelete={deleteStoryboard}
              onDuplicate={duplicateStoryboard}
              onPreview={setPreviewImage}
            />
          ))}
        </TableBody>
      </Table>

      {storyboards.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p className="mb-4">暂无分镜，点击下方按钮添加第一个分镜</p>
          <Button onClick={() => addStoryboard()}>
            <Plus className="h-4 w-4 mr-2" />
            添加分镜
          </Button>
        </div>
      )}

      {storyboards.length > 0 && (
        <div className="p-4 border-t bg-muted/30">
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => addStoryboard()}
          >
            <Plus className="h-4 w-4 mr-2" />
            添加新分镜
          </Button>
        </div>
      )}
    </div>
  );
});

StoryboardTable.displayName = 'StoryboardTable';

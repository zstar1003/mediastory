import { forwardRef, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Copy, Trash2, Plus } from 'lucide-react';

interface StoryboardRowProps {
  storyboard: Storyboard;
  index: number;
  onUpdate: (id: string, updates: Partial<Storyboard>) => void;
  onDeleteClick: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPreview: (image: string) => void;
}

const StoryboardRow = ({
  storyboard,
  index,
  onUpdate,
  onDeleteClick,
  onDuplicate,
  onPreview,
}: StoryboardRowProps) => {
  return (
    <TableRow>
      {/* 序号 */}
      <TableCell className="text-center font-medium text-muted-foreground w-14">
        {index + 1}
      </TableCell>

      {/* 参考图片 */}
      <TableCell className="w-48">
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
          className="min-h-[100px] resize-none"
        />
      </TableCell>

      {/* 对白/旁白 */}
      <TableCell className="min-w-[200px]">
        <Textarea
          value={storyboard.dialogue}
          onChange={(e) => onUpdate(storyboard.id, { dialogue: e.target.value })}
          placeholder="对白或旁白..."
          className="min-h-[100px] resize-none"
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
      <TableCell className="w-48">
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
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
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
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  onClick={() => onDeleteClick(storyboard.id)}
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyboardToDelete, setStoryboardToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setStoryboardToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (storyboardToDelete) {
      deleteStoryboard(storyboardToDelete);
    }
    setDeleteDialogOpen(false);
    setStoryboardToDelete(null);
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        请选择或创建一个项目
      </div>
    );
  }

  const storyboards = currentProject.storyboards;

  return (
    <>
      <div ref={ref} className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-14 text-center">#</TableHead>
              <TableHead className="w-48">参考图</TableHead>
              <TableHead className="min-w-[280px]">画面描述</TableHead>
              <TableHead className="min-w-[200px]">对白/旁白</TableHead>
              <TableHead className="w-28">景别</TableHead>
              <TableHead className="w-28">运镜</TableHead>
              <TableHead className="w-20">时长</TableHead>
              <TableHead className="min-w-[120px]">备注</TableHead>
              <TableHead className="w-48">视频</TableHead>
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
                onDeleteClick={handleDeleteClick}
                onDuplicate={duplicateStoryboard}
                onPreview={setPreviewImage}
              />
            ))}
          </TableBody>
        </Table>

        {storyboards.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-4">暂无分镜，点击下方按钮添加第一个分镜</p>
            <Button onClick={() => addStoryboard()} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              添加分镜
            </Button>
          </div>
        )}

        {storyboards.length > 0 && (
          <div className="p-4 border-t bg-muted/30">
            <Button
              variant="outline"
              className="w-full border-dashed cursor-pointer"
              onClick={() => addStoryboard()}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加新分镜
            </Button>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除分镜</DialogTitle>
            <DialogDescription>
              确定要删除第 {storyboardToDelete ? storyboards.findIndex(s => s.id === storyboardToDelete) + 1 : ''} 个分镜吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="cursor-pointer">
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="cursor-pointer">
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

StoryboardTable.displayName = 'StoryboardTable';

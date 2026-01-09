import { forwardRef, useState } from 'react';
import { useStoryboardStore } from '@/stores/storyboardStore';
import type { Storyboard } from '@/types';
import { ImageCell } from './ImageCell';
import { VideoCell } from './VideoCell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { Copy, Trash2, Plus, GripVertical } from 'lucide-react';

interface StoryboardRowProps {
  storyboard: Storyboard;
  index: number;
  onUpdate: (id: string, updates: Partial<Storyboard>) => void;
  onDeleteClick: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPreview: (image: string) => void;
  onAddBelow: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

const StoryboardRow = ({
  storyboard,
  index,
  onUpdate,
  onDeleteClick,
  onDuplicate,
  onPreview,
  onAddBelow,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
}: StoryboardRowProps) => {
  return (
    <TableRow
      className={`${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-t-2 border-t-blue-500' : ''}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* 序号 - 拖拽手柄 */}
      <TableCell className="text-center font-medium text-muted-foreground w-20">
        <div className="flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <span className="text-lg">{index + 1}</span>
        </div>
      </TableCell>

      {/* 参考图片 - 更大的显示区域 */}
      <TableCell className="w-64">
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
          className="min-h-[120px] resize-none"
        />
      </TableCell>

      {/* 对白/旁白 */}
      <TableCell className="min-w-[200px]">
        <Textarea
          value={storyboard.dialogue}
          onChange={(e) => onUpdate(storyboard.id, { dialogue: e.target.value })}
          placeholder="对白或旁白..."
          className="min-h-[120px] resize-none"
        />
      </TableCell>

      {/* 视频 - 更大的显示区域 */}
      <TableCell className="w-64">
        <VideoCell
          value={storyboard.videoData}
          onChange={(v) => onUpdate(storyboard.id, { videoData: v })}
        />
      </TableCell>

      {/* 备注 - 移到视频后面 */}
      <TableCell className="min-w-[150px]">
        <Textarea
          value={storyboard.notes}
          onChange={(e) => onUpdate(storyboard.id, { notes: e.target.value })}
          placeholder="备注..."
          className="min-h-[120px] resize-none"
        />
      </TableCell>

      {/* 操作 */}
      <TableCell className="w-24">
        <TooltipProvider>
          <div className="flex items-center justify-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                  onClick={() => onAddBelow(index)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>在下方添加分镜</TooltipContent>
            </Tooltip>

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
    moveStoryboard,
    setPreviewImage,
  } = useStoryboardStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyboardToDelete, setStoryboardToDelete] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      moveStoryboard(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
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
              <TableHead className="w-20 text-center">序号</TableHead>
              <TableHead className="w-64">参考图</TableHead>
              <TableHead className="min-w-[280px]">画面描述</TableHead>
              <TableHead className="min-w-[200px]">对白/旁白</TableHead>
              <TableHead className="w-64">视频</TableHead>
              <TableHead className="min-w-[150px]">备注</TableHead>
              <TableHead className="w-24 text-center">操作</TableHead>
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
                onAddBelow={(idx) => addStoryboard(idx)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                isDragging={dragIndex === index}
                isDragOver={dragOverIndex === index}
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

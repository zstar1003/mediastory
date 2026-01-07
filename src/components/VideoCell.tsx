import { useRef, useState, useCallback } from 'react';
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

export const VideoCell = ({ value, onChange }: VideoCellProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
          <>
            <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center">
                <Play className="h-8 w-8 mx-auto text-muted-foreground" />
                <span className="text-xs text-muted-foreground">点击预览</span>
              </div>
            </div>
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Plus className="h-6 w-6 mb-1" />
            <span className="text-xs">上传视频</span>
          </div>
        )}
      </div>

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

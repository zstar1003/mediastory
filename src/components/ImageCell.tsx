import { useRef, useState, useCallback } from 'react';
import { compressImage, getImageFromClipboard, getImageFromDrop } from '@/utils/imageUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, ImageIcon, Trash2 } from 'lucide-react';

interface ImageCellProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  onPreview: (image: string) => void;
}

export const ImageCell = ({ value, onChange, onPreview }: ImageCellProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch (err) {
      console.error('图片处理失败:', err);
    }
  }, [onChange]);

  const handleClick = () => {
    if (value) {
      onPreview(value);
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
    const file = getImageFromDrop(e.dataTransfer);
    if (file) {
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

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const file = await getImageFromClipboard(e.clipboardData);
    if (file) {
      e.preventDefault();
      handleFile(file);
    }
  }, [handleFile]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "relative w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        value && "border-solid border-border"
      )}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onPaste={handlePaste}
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        <>
          <img
            src={value}
            alt="分镜图片"
            className="w-full h-full object-contain rounded-lg"
          />
          <div className="absolute top-1 right-1 flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6"
              onClick={handleReplace}
            >
              <ImageIcon className="h-3 w-3" />
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
          <span className="text-xs">点击/拖拽/粘贴</span>
        </div>
      )}
    </div>
  );
};

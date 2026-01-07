import React, { useRef, useState, useCallback } from 'react';
import { compressImage, getImageFromClipboard, getImageFromDrop } from '../utils/imageUtils';

interface ImageCellProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  onPreview: (image: string) => void;
}

export const ImageCell: React.FC<ImageCellProps> = ({ value, onChange, onPreview }) => {
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
      className={`relative w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${value ? 'border-solid border-gray-200' : ''}`}
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
            <button
              onClick={handleReplace}
              className="p-1 bg-white rounded shadow hover:bg-gray-100"
              title="替换图片"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1 bg-white rounded shadow hover:bg-red-100"
              title="删除图片"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-xs">点击/拖拽/粘贴</span>
        </div>
      )}
    </div>
  );
};

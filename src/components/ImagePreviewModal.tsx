import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImagePreviewModalProps {
  image: string | null;
  onClose: () => void;
}

export const ImagePreviewModal = ({ image, onClose }: ImagePreviewModalProps) => {
  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-0">
        {image && (
          <img
            src={image}
            alt="预览图片"
            className="max-w-full max-h-[90vh] object-contain mx-auto"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

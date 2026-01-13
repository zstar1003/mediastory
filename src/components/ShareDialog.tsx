import { useState } from 'react';
import { Share2, Copy, Trash2, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCloudStore } from '@/stores/cloudStore';
import * as api from '@/services/api';
import type { ShareLink } from '@/types/cloud';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function ShareDialog({ open, onOpenChange, projectId }: ShareDialogProps) {
  const { isAuthenticated } = useCloudStore();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<'read' | 'edit'>('read');
  const [expiry, setExpiry] = useState<string>('never');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 加载分享链接
  const loadLinks = async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const data = await api.getShareLinks(projectId);
      setLinks(data);
    } catch (error) {
      console.error('加载分享链接失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 创建分享链接
  const handleCreateLink = async () => {
    try {
      setIsLoading(true);
      const expiresIn = expiry === 'never' ? undefined :
        expiry === '1h' ? 3600 :
        expiry === '1d' ? 86400 :
        expiry === '7d' ? 604800 : undefined;

      const link = await api.createShareLink(projectId, {
        permission,
        expiresIn,
      });
      setLinks([link, ...links]);
    } catch (error) {
      console.error('创建分享链接失败:', error);
      alert('创建分享链接失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 复制链接
  const handleCopy = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('复制失败');
    }
  };

  // 删除链接
  const handleDelete = async (linkId: string) => {
    try {
      await api.deleteShareLink(projectId, linkId);
      setLinks(links.filter(l => l.id !== linkId));
    } catch (error) {
      console.error('删除分享链接失败:', error);
    }
  };

  // 打开时加载链接
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen && isAuthenticated) {
      loadLinks();
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享项目</DialogTitle>
            <DialogDescription>
              请先登录后再分享项目
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            分享项目
          </DialogTitle>
          <DialogDescription>
            创建分享链接，邀请他人查看或编辑此项目
          </DialogDescription>
        </DialogHeader>

        {/* 创建新链接 */}
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Select value={permission} onValueChange={(v) => setPermission(v as 'read' | 'edit')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">仅查看</SelectItem>
                <SelectItem value="edit">可编辑</SelectItem>
              </SelectContent>
            </Select>

            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">永不过期</SelectItem>
                <SelectItem value="1h">1小时</SelectItem>
                <SelectItem value="1d">1天</SelectItem>
                <SelectItem value="7d">7天</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleCreateLink} disabled={isLoading}>
              创建链接
            </Button>
          </div>
        </div>

        {/* 链接列表 */}
        <div className="space-y-2 max-h-64 overflow-auto">
          {links.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              暂无分享链接
            </p>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      link.permission === 'edit'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {link.permission === 'edit' ? '可编辑' : '仅查看'}
                    </span>
                    {link.expiresAt && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(link.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {link.url}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(link)}
                  >
                    {copiedId === link.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(link.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

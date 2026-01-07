import { useRef } from 'react';
import { useStoryboardStore } from '@/stores/storyboardStore';
import { exportToJSON, exportToPNG, exportToPDF, importFromJSON } from '@/utils/export';
import { saveProject } from '@/utils/db';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, Upload, FileJson, Image, FileText } from 'lucide-react';

interface ExportButtonsProps {
  tableRef: React.RefObject<HTMLDivElement | null>;
}

export const ExportButtons = ({ tableRef }: ExportButtonsProps) => {
  const { currentProject, loadProjects } = useStoryboardStore();
  const importInputRef = useRef<HTMLInputElement>(null);

  if (!currentProject) return null;

  const handleExportJSON = () => {
    exportToJSON(currentProject);
  };

  const handleExportPNG = async () => {
    if (tableRef.current) {
      await exportToPNG(tableRef.current, currentProject.name);
    }
  };

  const handleExportPDF = async () => {
    if (tableRef.current) {
      await exportToPDF(tableRef.current, currentProject.name);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const project = await importFromJSON(file);
        await saveProject(project);
        await loadProjects();
        alert(`项目 "${project.name}" 导入成功！`);
      } catch (err) {
        alert('导入失败：' + (err as Error).message);
      }
    }
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => importInputRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        导入
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportJSON}>
            <FileJson className="h-4 w-4 mr-2" />
            导出为 JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportPNG}>
            <Image className="h-4 w-4 mr-2" />
            导出为 PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            导出为 PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

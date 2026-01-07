import React, { useRef } from 'react';
import { useStoryboardStore } from '../stores/storyboardStore';
import { exportToJSON, exportToPNG, exportToPDF, importFromJSON } from '../utils/export';
import { saveProject } from '../utils/db';

interface ExportButtonsProps {
  tableRef: React.RefObject<HTMLDivElement | null>;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ tableRef }) => {
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

  const buttonClass = `px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
    flex items-center gap-1.5`;

  return (
    <div className="flex items-center gap-2">
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      <button
        onClick={() => importInputRef.current?.click()}
        className={`${buttonClass} text-gray-600 hover:bg-gray-100`}
        title="导入JSON"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        导入
      </button>

      <div className="w-px h-6 bg-gray-300" />

      <button
        onClick={handleExportJSON}
        className={`${buttonClass} text-blue-600 hover:bg-blue-50`}
        title="导出JSON"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        JSON
      </button>

      <button
        onClick={handleExportPNG}
        className={`${buttonClass} text-green-600 hover:bg-green-50`}
        title="导出PNG"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        PNG
      </button>

      <button
        onClick={handleExportPDF}
        className={`${buttonClass} text-red-600 hover:bg-red-50`}
        title="导出PDF"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        PDF
      </button>
    </div>
  );
};

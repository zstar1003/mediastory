import React, { forwardRef } from 'react';
import { useStoryboardStore } from '../stores/storyboardStore';
import { SHOT_SIZES, CAMERA_MOVEMENTS } from '../types';
import type { Storyboard, ShotSize, CameraMovement } from '../types';
import { ImageCell } from './ImageCell';
import { EditableCell } from './EditableCell';
import { SelectCell } from './SelectCell';

interface StoryboardRowProps {
  storyboard: Storyboard;
  index: number;
  onUpdate: (id: string, updates: Partial<Storyboard>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddAfter: (index: number) => void;
  onPreview: (image: string) => void;
}

const StoryboardRow: React.FC<StoryboardRowProps> = ({
  storyboard,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddAfter,
  onPreview,
}) => {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* 序号 */}
      <td className="p-2 text-center text-gray-500 font-medium w-12">
        {index + 1}
      </td>

      {/* 场景号 */}
      <td className="p-2 w-20">
        <EditableCell
          value={storyboard.sceneNumber}
          onChange={(v) => onUpdate(storyboard.id, { sceneNumber: v })}
          placeholder="场景"
          className="text-center"
        />
      </td>

      {/* 镜头号 */}
      <td className="p-2 w-20">
        <EditableCell
          value={storyboard.shotNumber}
          onChange={(v) => onUpdate(storyboard.id, { shotNumber: v })}
          placeholder="镜头"
          className="text-center"
        />
      </td>

      {/* 参考图片 */}
      <td className="p-2 w-36">
        <ImageCell
          value={storyboard.imageData}
          onChange={(v) => onUpdate(storyboard.id, { imageData: v })}
          onPreview={onPreview}
        />
      </td>

      {/* 画面描述 */}
      <td className="p-2 min-w-[200px]">
        <EditableCell
          value={storyboard.description}
          onChange={(v) => onUpdate(storyboard.id, { description: v })}
          multiline
          placeholder="描述画面内容..."
        />
      </td>

      {/* 对白/旁白 */}
      <td className="p-2 min-w-[150px]">
        <EditableCell
          value={storyboard.dialogue}
          onChange={(v) => onUpdate(storyboard.id, { dialogue: v })}
          multiline
          placeholder="对白或旁白..."
        />
      </td>

      {/* 景别 */}
      <td className="p-2 w-24">
        <SelectCell<ShotSize>
          value={storyboard.shotSize}
          onChange={(v) => onUpdate(storyboard.id, { shotSize: v })}
          options={SHOT_SIZES}
          placeholder="景别"
        />
      </td>

      {/* 运镜 */}
      <td className="p-2 w-24">
        <SelectCell<CameraMovement>
          value={storyboard.cameraMovement}
          onChange={(v) => onUpdate(storyboard.id, { cameraMovement: v })}
          options={CAMERA_MOVEMENTS}
          placeholder="运镜"
        />
      </td>

      {/* 时长 */}
      <td className="p-2 w-20">
        <EditableCell
          value={storyboard.duration ? String(storyboard.duration) : ''}
          onChange={(v) => onUpdate(storyboard.id, { duration: parseFloat(v) || 0 })}
          type="number"
          placeholder="秒"
          className="text-center"
        />
      </td>

      {/* 备注 */}
      <td className="p-2 min-w-[100px]">
        <EditableCell
          value={storyboard.notes}
          onChange={(v) => onUpdate(storyboard.id, { notes: v })}
          placeholder="备注..."
        />
      </td>

      {/* 操作 */}
      <td className="p-2 w-24">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onAddAfter(index)}
            className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
            title="在下方添加行"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={() => onDuplicate(storyboard.id)}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="复制此行"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(storyboard.id)}
            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="删除此行"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
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
      <div className="flex items-center justify-center h-64 text-gray-500">
        请选择或创建一个项目
      </div>
    );
  }

  const storyboards = currentProject.storyboards;

  return (
    <div ref={ref} className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-3 text-left text-sm font-semibold text-gray-600">#</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">场景</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">镜头</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">参考图</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">画面描述</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">对白/旁白</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">景别</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">运镜</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">时长</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">备注</th>
              <th className="p-3 text-center text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {storyboards.map((sb, index) => (
              <StoryboardRow
                key={sb.id}
                storyboard={sb}
                index={index}
                onUpdate={updateStoryboard}
                onDelete={deleteStoryboard}
                onDuplicate={duplicateStoryboard}
                onAddAfter={addStoryboard}
                onPreview={setPreviewImage}
              />
            ))}
          </tbody>
        </table>
      </div>

      {storyboards.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p className="mb-4">暂无分镜，点击下方按钮添加第一个分镜</p>
          <button
            onClick={() => addStoryboard()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            添加分镜
          </button>
        </div>
      )}

      {storyboards.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => addStoryboard()}
            className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg
              hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + 添加新分镜
          </button>
        </div>
      )}
    </div>
  );
});

StoryboardTable.displayName = 'StoryboardTable';

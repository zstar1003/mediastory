// 景别类型
export type ShotSize = '远景' | '全景' | '中景' | '近景' | '特写' | '大特写';

// 运镜类型
export type CameraMovement = '固定' | '推' | '拉' | '摇' | '移' | '跟' | '升' | '降' | '甩' | '环绕';

// 单个分镜数据
export interface Storyboard {
  id: string;
  sceneNumber: string;      // 场景号
  shotNumber: string;       // 镜头号
  imageData?: string;       // 图片数据 (base64)
  description: string;      // 画面描述
  dialogue: string;         // 对白/旁白
  shotSize: ShotSize | '';  // 景别
  cameraMovement: CameraMovement | '';  // 运镜
  duration: number;         // 时长(秒)
  notes: string;            // 备注
}

// 项目数据
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  storyboards: Storyboard[];
}

// 创建新分镜的默认值
export const createEmptyStoryboard = (sceneNumber = '1', shotNumber = '1'): Storyboard => ({
  id: crypto.randomUUID(),
  sceneNumber,
  shotNumber,
  imageData: undefined,
  description: '',
  dialogue: '',
  shotSize: '',
  cameraMovement: '',
  duration: 0,
  notes: '',
});

// 常量
export const SHOT_SIZES: ShotSize[] = ['远景', '全景', '中景', '近景', '特写', '大特写'];
export const CAMERA_MOVEMENTS: CameraMovement[] = ['固定', '推', '拉', '摇', '移', '跟', '升', '降', '甩', '环绕'];

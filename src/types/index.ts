// 景别类型
export type ShotSize = '远景' | '全景' | '中景' | '近景' | '特写' | '大特写';

// 运镜类型
export type CameraMovement = '固定' | '推' | '拉' | '摇' | '移' | '跟' | '升' | '降' | '甩' | '环绕';

// 素材类型
export interface Material {
  id: string;
  name: string;
  type: 'image' | 'video';
  data: string; // base64
  createdAt: number;
}

// 参考图类型
export interface ReferenceImage {
  id: string;
  name: string;
  data: string; // base64
}

// 单个分镜数据
export interface Storyboard {
  id: string;
  shotNumber: string;       // 镜头号
  imageData?: string;       // 图片数据 (base64)
  description: string;      // 画面描述
  dialogue: string;         // 对白/旁白
  shotSize: ShotSize | '';  // 景别
  cameraMovement: CameraMovement | '';  // 运镜
  duration: number;         // 时长(秒)
  notes: string;            // 备注
  videoData?: string;       // 视频数据 (base64)
}

// 项目信息
export interface ProjectInfo {
  synopsis: string;         // 剧情简介
  style: string;            // 风格说明
  notes: string;            // 备注信息
}

// 项目数据
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  storyboards: Storyboard[];
  // 新增字段
  info: ProjectInfo;
  sceneReferences: ReferenceImage[];    // 场景参考图
  characterReferences: ReferenceImage[]; // 人物参考图
  materials: Material[];                 // 素材箱
}

// 创建新分镜的默认值
export const createEmptyStoryboard = (shotNumber = '1'): Storyboard => ({
  id: crypto.randomUUID(),
  shotNumber,
  imageData: undefined,
  description: '',
  dialogue: '',
  shotSize: '',
  cameraMovement: '',
  duration: 0,
  notes: '',
  videoData: undefined,
});

// 创建空项目信息
export const createEmptyProjectInfo = (): ProjectInfo => ({
  synopsis: '',
  style: '',
  notes: '',
});

// 常量
export const SHOT_SIZES: ShotSize[] = ['远景', '全景', '中景', '近景', '特写', '大特写'];
export const CAMERA_MOVEMENTS: CameraMovement[] = ['固定', '推', '拉', '摇', '移', '跟', '升', '降', '甩', '环绕'];

<div align="center">
  <img src="public/logo.png" width="100" alt="FreeTex">
</div>

一款专为影视创作者设计的 AIGC 分镜脚本工具，支持快速创建、编辑和管理分镜脚本。

**在线体验：** [https://zstar1003.github.io/mediastory/](https://zstar1003.github.io/mediastory/)

--- 

## 功能特性

- **项目管理** - 创建、编辑、删除分镜项目，支持多项目管理
- **分镜编辑** - 可视化分镜表格，支持场景、镜头、台词等信息录入
- **素材管理** - 图片和视频素材的上传与管理
- **导入导出** - 支持项目的导入导出，方便备份和分享
- **多人协作** - 支持多人实时协作编辑（需部署服务端）
- **自动保存** - 本地自动保存，数据不丢失
- **PDF 导出** - 一键导出专业分镜脚本 PDF

## 技术栈

- **前端框架:** React 19 + TypeScript
- **构建工具:** Vite 7
- **UI 组件:** Radix UI + Tailwind CSS
- **状态管理:** Zustand
- **本地存储:** IndexedDB (idb)
- **实时通信:** Socket.IO (协作模式)

## 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/zstar1003/mediastory.git
cd mediastory

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```



## 项目结构

```
mediastory/
├── src/
│   ├── components/     # React 组件
│   ├── stores/         # Zustand 状态管理
│   ├── types/          # TypeScript 类型定义
│   └── utils/          # 工具函数
├── server/             # 后端服务（协作模式）
├── public/             # 静态资源
└── docs/               # 文档
```

## 环境变量

### 前端 (.env)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_URL` | 后端 API 地址 | - |
| `VITE_WS_URL` | WebSocket 地址 | - |

> 注：纯前端模式无需配置环境变量，数据将保存在浏览器本地。

## 许可证

MIT License

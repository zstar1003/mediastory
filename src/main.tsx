import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HeaderPortal } from './components/Header.tsx'

// Header 渲染到独立的 DOM 节点，完全脱离 App 的 React 树
createRoot(document.getElementById('header-root')!).render(
  <HeaderPortal />
)

// App 渲染到 root
createRoot(document.getElementById('root')!).render(
  <App />
)

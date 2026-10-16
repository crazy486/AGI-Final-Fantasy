import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 相对路径 base，打包后可直接放到任意静态目录或本地打开预览服务器
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
} as any);

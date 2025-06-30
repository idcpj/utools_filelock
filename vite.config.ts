import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs-extra';
import path from 'path';

// 要排除的目录和文件
const excludes = ['node_modules', 'dist', '.git', 'index.html','package-lock.json','pnpm-lock.yaml'];

// 复制文件函数
function copyFilesToDist() {
  return {
    name: 'copy-files-to-dist',
    closeBundle: async () => {
      const rootDir = process.cwd();
      const distDir = path.resolve(rootDir, 'dist');

      // 读取根目录下的所有文件和目录
      const files = await fs.readdir(rootDir);

      for (const file of files) {
        // 排除不需要的文件和目录
        if (excludes.includes(file)) continue;

        const srcPath = path.resolve(rootDir, file);
        const destPath = path.resolve(distDir, file);

        // 检查是否是目录
        const stats = await fs.stat(srcPath);

        if (stats.isDirectory()) {

          console.log(`Copying directory: ${file} to dist/${file}`);
          await fs.copy(srcPath, destPath);
        } else {
          // 复制文件
          console.log(`Copying file: ${file} to dist/${file}`);
          await fs.copy(srcPath, destPath);
        }
      }

      console.log('All files copied to dist directory!');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyFilesToDist()],
  // 设置资源的基础路径为相对路径
  base: './',
  build: {
    // 确保生成的资源使用相对路径
    assetsDir: 'assets',
    // 如果需要，可以配置输出目录
    outDir: 'dist'
  }
});
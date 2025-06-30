const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// 定义 handle64.exe 的路径
// __dirname 在 uTools 环境中指向插件的根目录
const HANDLE_PATH = path.join(__dirname, 'handle64.exe');

/**
 * 解析 handle.exe 的输出, 提取进程信息
 * @param {string} output handle.exe 的标准输出
 * @returns {Array<{name: string, pid: string, handleId: string}>}
 */
const parseOutput = (output) => {
  const lines = output.split('\n');
  const processes = [];
  // 正则表达式用于匹配进程信息行
  // 示例: explorer.exe pid: 1234 type: File          C8: D:\path\to\file.txt
  const regex = /^(?<name>.+?)\s+pid:\s*(?<pid>\d+)\s+type:\s*File\s+(?<handleId>[A-F0-9]+:)/im;

  for (const line of lines) {
    const match = line.match(regex);
    if (match && match.groups) {
      processes.push({
        name: match.groups.name.trim(),
        pid: match.groups.pid,
        handleId: match.groups.handleId,
      });
    }
  }
  // 去重，因为同一个进程可能多次打开同一个文件
  const uniqueProcesses = Array.from(new Map(processes.map(p => [p.pid, p])).values());
  return uniqueProcesses;
};

/**
 * 查找占用指定文件的进程
 * @param {string} filePath
 * @returns {Promise<Array<{name: string, pid: string, handleId: string}>>}
 */
const findProcessByFile = (filePath) => {
  return new Promise((resolve, reject) => {

    console.log("handle64.exe path:",HANDLE_PATH);

    // 检查 handle64.exe 是否存在
    if (!fs.existsSync(HANDLE_PATH)) {
      return reject(new Error('handle64.exe 未找到，请确保其位于插件根目录下'));
    }
    
    // 使用 execFile 更安全，它能避免命令注入
    execFile(HANDLE_PATH, [filePath], (error, stdout, stderr) => {
      if (error && error.code !== 0) {
        // handle.exe 在找不到句柄时会返回非 0 退出码，但这不是一个需要抛出的错误
        if (stdout.includes('No matching handles found.')) {
          resolve([]); // 没有找到进程，返回空数组
          return;
        }
        // 其他真实错误
        console.error(`handle.exe error: ${stderr}`);
        reject(new Error(`执行 handle64.exe 失败: ${stderr}`));
        return;
      }
      const processes = parseOutput(stdout);
      resolve(processes);
    });
  });
};


// === uTools API ===

let currentFilePath = '';

utools.onPluginEnter(({ code, type, payload }) => {
  console.log(`Plugin Enter: code=${code}, type=${type}, payload=${payload}`);
  if (type === 'files') {
    // payload 是一个数组，我们只处理第一个文件
    currentFilePath = payload[0].path;
    console.log(`File path received: ${currentFilePath}`);
    // 如果窗口已经加载，可以主动调用一次
    if (window.onFileSelected) {
      window.onFileSelected(currentFilePath);
    }
  }
});

// === 暴露给渲染进程的 API ===
window.exports = {
  // API 供 React 调用
  getProcessList: async (filePath) => {
    try {
      return await findProcessByFile(filePath);
    } catch (e) {
      // 向用户显示更友好的错误信息
      utools.showNotification(`查询失败: ${e.message}`, 'error');
      return [];
    }
  },
  // 获取进入插件时自动获得的文件路径
  getInitialFilePath: () => {
    return currentFilePath;
  }
};
import React, { useState, useEffect } from 'react';
import './App.css';
import './index.css';
import { FileIcon, SearchIcon, CheckIcon, AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';

function App() {
  const [filePath, setFilePath] = useState('');
  const [processes, setProcesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProcesses = async (path) => {
    if (!path) return;
    setIsLoading(true);
    setError('');
    try {
      console.log(`Fetching processes for: ${path}`);
      const processList = await window.exports.getProcessList(path);
      console.log('Processes found:', processList);
      setProcesses(processList);
    } catch (e) {
      console.error('Error fetching processes:', e);
      setError(`查询失败: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handlePluginEnter = ({ code, type, payload }) => {
      console.log("useEffect onPluginEnter", code, type, payload);
      if (code === 'find_process_by_file' && type === 'files' && Array.isArray(payload) && payload.length > 0) {
        const filePath = payload[0].path;
        setFilePath(filePath);
        fetchProcesses(filePath);
      }
    };

    // 添加事件监听器
    if (typeof utools !== 'undefined' && utools.onPluginEnter) {
      utools.onPluginEnter(handlePluginEnter);
    }

    // 使用 window.exports.getInitialFilePath() 替代 utools.getPayload()
    if (typeof window.exports !== 'undefined' && window.exports.getInitialFilePath) {
      const initialPath = window.exports.getInitialFilePath();
      if (initialPath) {
          setFilePath(initialPath);
          fetchProcesses(initialPath);
      } else {
          setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    // 清理函数
    return () => {
      // 如果需要，可以在这里添加清理逻辑
    };
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Card className="card">
          <CardContent className="card-content flex-center">
            <Loader2Icon className="icon icon-primary animate-spin mb-4" />
            {filePath && (
              <p className="text-muted mb-2 text-center max-w-md">
                <span className="break-all text-primary">{filePath}</span>
              </p>
            )}
            <p className="text-lg font-medium">正在查询, 请稍候...</p>
          </CardContent>
        </Card>
      );
    }
    
    if (error) {
      return (
        <Card className="card card-error">
          <CardContent className="card-content flex-center">
            <div className="icon-bg icon-bg-error mb-4">
              <AlertCircleIcon className="icon icon-error" />
            </div>
            <p className="text-error text-lg font-medium">{error}</p>
          </CardContent>
        </Card>
      );
    }
    
    if (!filePath) {
      return (
        <Card className="card">
          <CardContent className="card-content flex-center">
            <div className="icon-bg icon-bg-muted mb-4">
              <SearchIcon className="icon icon-primary" />
            </div>
            <p className="text-lg font-medium">请拖拽文件到 uTools 或通过右键菜单使用</p>
          </CardContent>
        </Card>
      );
    }
    
    if (processes.length === 0) {
      return (
        <Card className="card">
          <CardContent className="card-content flex-center">
            <div className="icon-bg icon-bg-success mb-4">
              <CheckIcon className="icon icon-success" />
            </div>
            <p className="text-success text-xl font-medium mb-2">文件未被任何进程占用</p>
            <p className="text-xs text-muted text-center break-all max-w-md">{filePath}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="card">
        <CardHeader className="card-header">
          <div className="flex-row">
            <FileIcon className="icon-sm icon-primary mr-2" />
            <CardTitle className="text-sm font-medium break-all">{filePath}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="card-content">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>进程名称</TableHead>
                <TableHead>PID</TableHead>
                <TableHead>句柄</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((p, index) => (
                <TableRow key={`${p.pid}-${index}`}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.pid}</TableCell>
                  <TableCell className="text-muted">{p.handleId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="card-footer border-t">
          <Badge className="badge-secondary">共找到 {processes.length} 个进程</Badge>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="app-container">
      <div className="content-container">
        {renderContent()}
      </div>
    </div>
  );
}

export default App; 
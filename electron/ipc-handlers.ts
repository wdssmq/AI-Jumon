import path from 'node:path';
import { app, ipcMain } from 'electron';
import { saveCount, getCount, getYmlData, ensureStorageExists } from './db/file-use';

export function setupIpcHandlers(win: Electron.BrowserWindow) {

  const objScope: Record<string, any> = {};

  win.webContents.on('did-finish-load', () => {
    // 调试输出用户数据目录
    console.log('userData:', app.getPath("userData"));
    objScope.StoragePath = path.join(app.getPath("userData"), 'ai-data');

    // 判断并创建 Storage 目录
    ensureStorageExists(objScope).then(() => {
      console.log('User config ensured.');
    }).catch(err => {
      console.error('Error ensuring user config:', err);
    });

    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  // 监听来自渲染进程的 click-count 消息
  ipcMain.on('click-count', (_, count) => {
    console.log('click-count:', count);
    saveCount(count, objScope);
  });

  // 监听来自渲染进程的 get-click-count 消消息
  ipcMain.handle('get-click-count', async () => {
    const count = await getCount(objScope);
    return count;
  });

  // 监听来自渲染进程的 get-prompts 消息
  ipcMain.handle('get-prompts', async () => {
    const ymlData = await getYmlData(objScope);
    return ymlData;
  });
}

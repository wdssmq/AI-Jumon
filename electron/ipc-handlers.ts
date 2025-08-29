import path from 'node:path';
import { app, ipcMain } from 'electron';
import {
  saveCount,
  getCount,
  configDB,
} from './db/file-use';

type objScopeType = {
  StoragePath: string;
  configDB: configDB;
}

export function setupIpcHandlers(win: Electron.BrowserWindow) {

  const objScope = {} as objScopeType;

  win.webContents.on('did-finish-load', () => {

    // 调试输出用户数据目录
    console.log('userData:', app.getPath("userData"));
    objScope.StoragePath = path.join(app.getPath("userData"), 'ai-data');
    objScope.configDB = new configDB(objScope);

    // 自动备份
    objScope.configDB.autoBackup().then((msg: any) => {
      console.log(msg);
    }).catch((err: any) => {
      console.error('Error during auto backup:', err);
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

  // 监听来自渲染进程的 get-config-list 消息
  ipcMain.handle('get-config-list', async () => {
    const data = objScope.configDB.configList.data;
    return data;
  });

  // 监听来自渲染进程的 get-prompts 消息
  ipcMain.handle('get-prompts', async () => {
    const ymlData = await objScope.configDB.getCurData();
    return ymlData;
  });

  // 监听来自渲染进程的 save-prompts 消息
  ipcMain.handle('save-prompts', async (_, ymlData) => {
    try {
      await objScope.configDB.saveCurData(ymlData);
      return { success: true };
    } catch (error) {
      console.error('Error saving prompts:', error);
      return { success: false, error: (error instanceof Error ? error.message : 'Unknown error') };
    }
  });
}

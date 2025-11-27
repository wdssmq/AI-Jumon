import path from 'node:path';
import { app, ipcMain } from 'electron';
import {
  ConfigDB,
} from './db/file-use';

interface objScopeType {
  StoragePath: string
  ConfigDB: ConfigDB
}

interface ResJson {
  success: boolean
  error: any
}

export function setupIpcHandlers(win: Electron.BrowserWindow) {
  const objScope = {} as objScopeType;
  objScope.StoragePath = path.join(app.getPath('userData'), 'ai-data');
  objScope.ConfigDB = new ConfigDB(objScope);

  win.webContents.on('did-finish-load', () => {
    // 调试输出用户数据目录
    console.log('userData:', app.getPath('userData'));
    win?.webContents.send('main-process-message', (new Date()).toLocaleString());
  });

  // 获取存储路径
  ipcMain.handle('get-storage-path', () => objScope.StoragePath);

  // 监听来自渲染进程的 get-config-list 消息
  ipcMain.handle('get-config-list', async () => {
    const data = objScope.ConfigDB.configList.data;
    return data;
  });

  // 监听来自渲染进程的 set-default-config 消息
  ipcMain.handle('set-default-config', async (_, configName) => {
    objScope.ConfigDB.setDefaultConfig(configName);
    return { success: true } as ResJson;
  });

  // 监听来自渲染进程的 add-config 消息
  ipcMain.handle('add-config', async (_, configName) => {
    objScope.ConfigDB.addConfig(configName);
    return { success: true } as ResJson;
  });

  // 监听来自渲染进程的 delete-config 消息
  ipcMain.handle('delete-config', async (_, configName) => {
    objScope.ConfigDB.deleteConfig(configName);
    return { success: true } as ResJson;
  });

  // 监听来自渲染进程的 get-prompts 消息
  ipcMain.handle('get-prompts', async (_, configName = '') => {
    if (configName) {
      objScope.ConfigDB.switchConfig(configName);
    }
    const ymlData = await objScope.ConfigDB.getCurData();
    return ymlData;
  });

  // 监听来自渲染进程的 save-prompts 消息
  ipcMain.handle('save-prompts', async (_, ymlData) => {
    try {
      await objScope.ConfigDB.saveCurData(ymlData);
      return { success: true } as ResJson;
    }
    catch (error) {
      console.error('Error saving prompts:', error);
      return { success: false, error: (error instanceof Error ? error.message : 'Unknown error') } as ResJson;
    }
  });
}

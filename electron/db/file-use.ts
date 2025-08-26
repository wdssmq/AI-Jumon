import FileDB from "./file";
import {
  dirExists,
  fileExists,
  createDir,
  parseYAML,
  dumpYAML,
  getLocalTime,
} from "../utils/base";
import path from 'node:path'

export const saveCount = async (count: number, objScope: Record<string, any> = {}) => {
  const storageDir = objScope.StoragePath;
  const db = new FileDB(path.join(storageDir, "count.txt"));
  await db.write(count.toString());
};

export const getCount = async (objScope: Record<string, any> = {}) => {
  const storageDir = objScope.StoragePath;
  const db = new FileDB(path.join(storageDir, "count.txt"));
  const count = await db.read('0');
  return parseInt(count, 10);
};

export async function ensureStorageExists(objScope: Record<string, any> = {}): Promise<void> {
  const storageDir = objScope.StoragePath;
  if (await dirExists(storageDir)) {
    return;
  }
  await createDir(storageDir);
}

export async function autoBackup(objScope: Record<string, any> = {}): Promise<string> {
  const storageDir = objScope.StoragePath;
  const backupDir = path.join(storageDir, 'backup');
  if (!(await dirExists(backupDir))) {
    await createDir(backupDir);
  }
  const localTime = getLocalTime();
  const backupFile = `config-${localTime.year}-${localTime.month}-${localTime.day}_${localTime.hour}.yaml`;
  const backupFilePath = path.join(backupDir, backupFile);
  if (await fileExists(backupFilePath)) {
    // 已存在同名备份文件，返回提示信息
    return `已经存在同名备份文件: ${backupFilePath}`;
  }
  // 读取当前配置文件内容，写入备份文件
  const db = new FileDB(path.join(storageDir, "config.yaml"));
  const content = await db.read();
  const backupDb = new FileDB(backupFilePath);
  await backupDb.write(content);
  return `备份完成: ${backupFilePath}`;
}

export async function getYmlData(objScope: Record<string, any> = {}): Promise<string> {

  function defConfig(): string {
    return `- items:
  - name: base
    content: |
      女性, 二次元少女

  - name: 动物类型
    content: |
      {{rnd(猫,兔子,-1)}}

  - name: 动物
    content: |
      {{if($动物类型 ? 桌子上有{{$动物类型}} : _null)}}

  - name: 头发
    content: |
      {{rnd(黑,白,红,蓝)}}色头发

- prompts:
  - name: demo
    content: |
      {{base}}，坐在椅子上，{{头发}}, {{动物}}
      `;
  }

  const storageDir = objScope.StoragePath;
  const db = new FileDB(path.join(storageDir, "config.yaml"));
  const ymlStr = await db.read(defConfig());
  return parseYAML(ymlStr);
}

export async function saveYmlData(ymlData:any, objScope: Record<string, any> = {}): Promise<void> {
  const storageDir = objScope.StoragePath;
  const db = new FileDB(path.join(storageDir, "config.yaml"));
  await db.write(dumpYAML(ymlData));
}

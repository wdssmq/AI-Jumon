import FileDB from "./file";
import { dirExists, createDir, parseYAML } from "../utils/base";
import path from 'node:path'

export const saveCount = async (count: number, app: Electron.App) => {
  const usrDir = app.getPath("userData");
  const db = new FileDB(path.join(usrDir, "count.txt"));
  await db.write(count.toString());
};

export const getCount = async (app: Electron.App) => {
  const usrDir = app.getPath("userData");
  const db = new FileDB(path.join(usrDir, "count.txt"));
  const count = await db.read('0');
  return parseInt(count, 10);
};

export async function ensureStorageExists(app: Electron.App): Promise<void> {
  const usrDir = app.getPath("userData");
  const storageDir = path.join(usrDir, 'ai-data');
  if (await dirExists(storageDir)) {
    return;
  }
  await createDir(storageDir);
}

export async function getYmlData(app: Electron.App): Promise<string> {

  function defConfig(): string {
    return `- items:
  - name: base
    content: |
      女性, 二次元少女

  - name: 动物类型
    content: |
      {{rnd(猫,兔子,)}}

  - name: 动物
    content: |
      {{if($动物类型):桌子上有{{$动物类型}}:}}

  - name: 头发
    content: |
      {{rnd(黑,白,红,蓝)}}色头发

- prompts:
  - name: demo
    content: |
      {{base}}，坐在椅子上，{{头发}}, {{动物}}
      `;
  }

  const usrDir = app.getPath("userData");
  const storageDir = path.join(usrDir, 'ai-data');
  const db = new FileDB(path.join(storageDir, "config.yaml"));
  const ymlStr = await db.read(defConfig());
  return parseYAML(ymlStr);
}

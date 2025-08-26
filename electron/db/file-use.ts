import FileDB from "./file";
import { dirExists, createDir, parseYAML } from "../utils/base";
import path from 'node:path'

export const saveCount = async (count: number, objScope:Record<string, any> = {}) => {
  const storageDir = objScope.StoragePath;
  const db = new FileDB(path.join(storageDir, "count.txt"));
  await db.write(count.toString());
};

export const getCount = async (objScope:Record<string, any> = {}) => {
  const storageDir = objScope.StoragePath;
  const db = new FileDB(path.join(storageDir, "count.txt"));
  const count = await db.read('0');
  return parseInt(count, 10);
};

export async function ensureStorageExists(objScope:Record<string, any> = {}): Promise<void> {
  const storageDir = objScope.StoragePath;
  if (await dirExists(storageDir)) {
    return;
  }
  await createDir(storageDir);
}

export async function getYmlData(objScope:Record<string, any> = {}): Promise<string> {

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

  const storageDir = objScope.StoragePath;
  const db = new FileDB(path.join(storageDir, "config.yaml"));
  const ymlStr = await db.read(defConfig());
  return parseYAML(ymlStr);
}

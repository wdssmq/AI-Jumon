import FileDB from "./file";
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

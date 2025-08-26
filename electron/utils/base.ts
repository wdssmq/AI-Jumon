import { promises as fs } from 'fs';
import _yaml from 'js-yaml';

export const dirExists = async (dirPath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export const createDir = async (dirPath: string): Promise<void> => {
  if (!(await dirExists(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export const parseYAML = (yaml: string): any => {
  return yaml ? _yaml.load(yaml) : {};
}

export const dumpYAML = (data: any): string => {
  return _yaml.dump(data);
}

export const getLocalTime = (date: Date = new Date()): Record<string, number> => {
  const obj =  {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds()
  };
  (Object.keys(obj) as Array<keyof typeof obj>).forEach(key => {
    if (obj[key] < 10) {
      obj[key] = Number('0' + obj[key]);
    }
  });
  return obj;
}

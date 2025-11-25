import { promises as fs } from 'node:fs';
import _yaml from 'js-yaml';

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  }
  catch {
    return false;
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  }
  catch {
    return false;
  }
}

export async function createDir(dirPath: string): Promise<void> {
  if (!(await dirExists(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export function parseYAML(yaml: string): any {
  return yaml ? _yaml.load(yaml) : {};
}

export function dumpYAML(data: any): string {
  return _yaml.dump(data);
}

export function getLocalTime(date: Date = new Date()): Record<string, number> {
  const obj = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
  (Object.keys(obj) as Array<keyof typeof obj>).forEach((key) => {
    if (obj[key] < 10) {
      obj[key] = Number(`0${obj[key]}`);
    }
  });
  return obj;
}

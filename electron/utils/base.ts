import { promises as fs } from 'fs';

export const dirExists = async (dirPath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export const createDir = async (dirPath: string): Promise<void> => {
  if (!(await dirExists(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

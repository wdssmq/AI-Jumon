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

export const createDir = async (dirPath: string): Promise<void> => {
  if (!(await dirExists(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export const parseYAML = (yaml: string): any => {
  return yaml ? _yaml.load(yaml) : {};
}

// 读写文本文件的封装
import { promises as fs } from 'fs';

class FileDB {
  private filePath: string;

  public isExists: boolean = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async checkExists(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      this.isExists = true;
    } catch {
      this.isExists = false;
    }
    return this.isExists;
  }

  async read(defaultValue: string = ''): Promise<string> {
    const exists = await this.checkExists();
    if (!exists) {
      return defaultValue;
    }
    try {
      return await fs.readFile(this.filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  async write(data: string): Promise<void> {
    try {
      await fs.writeFile(this.filePath, data, 'utf-8');
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }
}

export default FileDB;

// 读写文本文件的封装
import { promises as fs } from 'fs';

class FileDB {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async read(): Promise<string> {
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

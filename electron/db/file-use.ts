import path from 'node:path';
import {
  createDir,
  dirExists,
  dumpYAML,
  fileExists,
  getLocalTime,
  parseYAML,
} from '../utils/base';
import FileDB from './file';

interface curConfig {
  name: string
  path: string
  db?: FileDB
}

interface configList {
  name: string
  path: string
  db?: FileDB
  data?: Record<string, any>
}

export class ConfigDB {
  // 文件夹路径
  private configDir: string;
  // 当前配置文件
  private curConfig: curConfig = { name: '', path: '' };
  // 列表数据
  public configList: configList;

  // 读取配置列表及默认配置
  get list() {
    return this.configList.data?.list || [];
  }

  get default() {
    return this.configList.data?.default || '';
  }

  constructor(objScope: Record<string, any> = {}, configName: string = '') {
    // 配置文件目录
    this.configDir = objScope.StoragePath;

    // 初始化配置目录
    this.init().then(() => {
      console.log('Config directory initialized at:', this.configDir);
    }).catch((err) => {
      console.error('Error initializing config directory:', err);
    });

    // 用于记录所有配置文件的列表
    this.configList = {
      name: 'config-list.json',
      path: path.join(this.configDir, 'config-list.json'),
    };

    this.loadList().then((defaultConfig) => {
      //  载入预定的配置文件
      this.switchConfig(configName || defaultConfig);
    });
  }

  async init(): Promise<void> {
    if (await dirExists(this.configDir)) {
      return;
    }
    await createDir(this.configDir);
  }

  async loadList(): Promise<string> {
    this.configList.db = new FileDB(this.configList.path);
    const listJSON = await this.configList.db.read(`{"list": ["demo"],"default": "demo"}`);
    if (!this.configList.db.isExists) {
      this.configList.db.write(listJSON);
    }
    const listData = JSON.parse(listJSON);
    this.configList.data = listData;
    return this.default;
  }

  async saveList(): Promise<void> {
    const db = this.configList.db;
    await db!.write(JSON.stringify(this.configList.data));
  }

  setDefaultConfig(name: string): void {
    const newName = name || this.curConfig.name;
    const curDefName = this.default;
    if (newName === curDefName || !this.list.includes(newName)) {
      return;
    }
    this.configList.data!.default = newName;
    this.saveList();
  }

  switchConfig(name: string): void {
    const configName = `${name.replace(/\.ya?ml$/i, '')}.yaml`;
    this.curConfig = {
      name: configName,
      path: path.join(this.configDir, configName),
    };
    // console.log(this.curConfig);
    this.curConfig.db = new FileDB(this.curConfig.path);
    // 自动备份
    this.autoBackup().then((msg: any) => {
      console.log(msg);
    }).catch((err: any) => {
      console.error('Error during auto backup:', err);
    });
  }

  addConfig(name: string): void {
    if (this.list.includes(name)) {
      return;
    }
    this.configList.data!.list.push(name);
    this.saveList();
  }

  deleteConfig(name: string): void {
    if (!this.list.includes(name)) {
      return;
    }
    this.configList.data!.list = this.list.filter((item: string) => item !== name);
    this.saveList();
    // 尝试删除对应的文件
    const filePath = path.join(this.configDir, `${name}.yaml`);
    const fileDB = new FileDB(filePath);
    fileDB.delete();
  }

  async getCurData(): Promise<curConfig> {
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
    desc: 示例
    content: |
      {{base}}, 坐在椅子上, {{头发}}, {{动物}}
      `;
    }
    const db = this.curConfig.db;
    const ymlStr = await db!.read(defConfig());
    return parseYAML(ymlStr);
  }

  async saveCurData(ymlData: any): Promise<void> {
    const db = this.curConfig.db;
    await db!.write(dumpYAML(ymlData));
  }

  async autoBackup(): Promise<string> {
    const backupDir = path.join(this.configDir, 'backup');
    if (!(await dirExists(backupDir))) {
      await createDir(backupDir);
    }
    const curConfigName = this.curConfig.name;
    const localTime = getLocalTime();
    const backupFile = `${curConfigName}-${localTime.year}-${localTime.month}-${localTime.day}_${localTime.hour}.yaml`;
    const backupFilePath = path.join(backupDir, backupFile);
    if (await fileExists(backupFilePath)) {
      // 已存在同名备份文件，返回提示信息
      return `Backup file already exists: ${backupFilePath}`;
    }
    // 读取当前配置文件内容，写入备份文件
    const db = this.curConfig.db;
    const content = await db!.read();
    if (!db?.isExists) {
      return `File to backup does not exist: ${this.curConfig.path}`;
    }
    const backupDb = new FileDB(backupFilePath);
    await backupDb.write(content);
    return `Backup completed: ${backupFilePath}`;
  }
}

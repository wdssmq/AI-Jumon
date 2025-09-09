interface Item {
  name: string;
  content: string;
}

interface Prompt {
  name: string;
  desc?: string;
  content: string;
  items?: Item[];
  [key: string]: any;
}

interface Config {
  items: Item[];
  prompts: Prompt[];
}

export class IndexParser {
  private items: Record<string, string> = {};
  private prompts: Record<string, string> = {};
  private subItems: Record<string, Record<string, string>> = {};
  private curPrompt: string = '';
  private cachedValues: Record<string, string> = {};

  constructor (jsonData: string | Config) {
    this.loadConfig(jsonData);
  }

  private loadConfig(jsonData: string | Config): void {
    try {
      const config: Config = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // 全局变量
      if (config.items) {
        config.items.forEach((item) => {
          this.items[item.name] = item.content.trim();
        });
      }

      if (config.prompts) {
        config.prompts.forEach((prompt) => {
          const promptName = prompt.name;
          this.prompts[promptName] = prompt.content.trim();
          // 内部属性 - 形式一
          if (prompt.items) {
            this.subItems[promptName] = this.subItems[promptName] || {};
            prompt.items.forEach((item) => {
              this.subItems[promptName][item.name] = item.content.trim();
            });
          }
          // 内部属性 - 形式二
          Object.keys(prompt).forEach((key) => {
            if (key !== 'name' && key !== 'content' && key !== 'items' && key !== 'desc') {
              this.subItems[promptName] = this.subItems[promptName] || {};
              this.subItems[promptName][key] = prompt[key].trim();
            }
          });
        });
      }

    } catch (error: any) {
      throw new Error(`Failed to load JSON data: ${error.message}`);
    }
  }

  private processRandomSelection(text: string): string {
    const rndPattern = /\{\{rnd\(([^)]+)\)\}\}/g;

    return text.replace(rndPattern, (_, options: string) => {
      const choices = options.split(',').map((opt: string) => opt.trim()).filter(Boolean);
      return choices[Math.floor(Math.random() * choices.length)] || '';
    });
  }

  private processConditional(text: string): string {
    // {{if($窗户 ? 窗外有蓝天白云 : _null)}}
    const ifPattern = /\{\{if\(([^?]+)\?([^:]+):([^)]+)\)\}\}/g;
    return text.replace(ifPattern, (_, condition: string, truePart: string, falsePart: string) => {
      const condVar = condition.trim();
      const condValue = this.cachedValues[condVar];
      const bolCondValue = condValue !== '-1' ? true : false;

      // console.log('>>', condVar, condValue, bolCondValue, truePart, falsePart);
      return bolCondValue ? truePart.trim() : falsePart.trim();
    });
  }

  private processVariables(text: string): string {
    const varPattern = /\{\{([^}]+)\}\}/g;

    return text.replace(varPattern, (_, varName) => {
      if (varName.startsWith('$')) {
        return this.cachedValues[varName] || '';
      }

      let varContent = '';
      // 默认使用全局定义
      if (this.items[varName]) {
        varContent = this.items[varName];
      }

      // 如果变量有内部定义
      if (this.curPrompt && this.subItems[this.curPrompt] && this.subItems[this.curPrompt][varName]) {
        varContent = this.subItems[this.curPrompt][varName];
      }

      return this.generateText(varContent);
    });
  }

  private generateText(template: string, maxDepth = 10): string {
    if (maxDepth <= 0) {
      console.warn('Warning: Maximum recursion depth reached.');
      return template;
    }

    let text = this.processRandomSelection(template);
    text = this.processConditional(text);

    if (text === '-1') {
      return text;
    }

    if (/\{\{[^}]+\}\}/.test(text)) {
      text = this.processVariables(text);
      text = this.generateText(text, maxDepth - 1);
    } else {
      text = text.replace(/_null|-1/g, ' ');
      text = text.replace(/[，。]/g, ',');
      text = text.replace(/,[,\s]+/g, ', ');
      text = text.replace(/^[\s,]+/g, '').replace(/[\s,]+$/g, '');
    }

    return text;
  }

  private preGenerateAndCacheVariables(): void {
    Object.keys(this.items).forEach((key) => {
      this.cachedValues[`$${key}`] = this.generateText(this.items[key]);
    });
    // 如果变量有内部定义
    if (this.curPrompt && this.subItems[this.curPrompt]) {
      Object.keys(this.subItems[this.curPrompt]).forEach((key) => {
        this.cachedValues[`$${key}`] = this.generateText(this.subItems[this.curPrompt][key]);
      });
    }
    // console.log('Cached Values:', this.cachedValues);
  }

  public generatePrompt(promptName: string): string {
    if (!(promptName in this.prompts)) {
      throw new Error(`Prompt '${promptName}' not found.`);
    }
    this.curPrompt = promptName;

    this.preGenerateAndCacheVariables();

    return this.generateText(this.prompts[promptName]);
  }

  public listPrompts(): string[] {
    return Object.keys(this.prompts);
  }

  public listItems(): string[] {
    return Object.keys(this.items);
  }
}

export type {
  Config,
  Item,
  Prompt,
}

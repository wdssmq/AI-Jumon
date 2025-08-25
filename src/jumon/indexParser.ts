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
  items?: Item[];
  prompts?: Prompt[];
}

export class IndexParser {
  private items: Record<string, string> = {};
  private subItems: Record<string, Record<string, string>> = {};
  private prompts: Record<string, string> = {};
  private cachedValues: Record<string, string> = {};

  constructor(jsonData: string | Config[]) {
    this.loadConfig(jsonData);
  }

  private loadConfig(jsonData: string | Config[]): void {
    try {
      const config: Config[] = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      config.forEach((section) => {
        if (section.items) {
          section.items.forEach((item) => {
            this.items[item.name] = item.content.trim();
          });
        }

        if (section.prompts) {
          section.prompts.forEach((prompt) => {
            const promptName = prompt.name;
            this.prompts[promptName] = prompt.content.trim();

            if (prompt.items) {
              this.subItems[promptName] = this.subItems[promptName] || {};
              prompt.items.forEach((item) => {
                this.subItems[promptName][item.name] = item.content.trim();
              });
            }

            Object.keys(prompt).forEach((key) => {
              if (key !== 'name' && key !== 'content' && key !== 'items' && key !== 'desc') {
                this.subItems[promptName] = this.subItems[promptName] || {};
                this.subItems[promptName][key] = prompt[key].trim();
              }
            });
          });
        }
      });
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

  private processVariables(text: string): string {
    const varPattern = /\{\{([^}]+)\}\}/g;

    return text.replace(varPattern, (_, varName) => {
      if (varName.startsWith('$')) {
        const cacheVarName = varName.slice(1);
        return this.cachedValues[cacheVarName] || this.items[cacheVarName] || '';
      }

      if (this.items[varName]) {
        return this.generateText(this.items[varName]);
      }

      console.warn(`Warning: Variable '${varName}' not found.`);
      return '';
    });
  }

  private generateText(template: string, maxDepth = 10): string {
    if (maxDepth <= 0) {
      console.warn('Warning: Maximum recursion depth reached.');
      return template;
    }

    let text = this.processRandomSelection(template);

    if (/\{\{[^}]+\}\}/.test(text)) {
      text = this.processVariables(text);
      text = this.generateText(text, maxDepth - 1);
    }

    return text;
  }

  public generatePrompt(promptName: string): string {
    if (!this.prompts[promptName]) {
      throw new Error(`Prompt '${promptName}' not found.`);
    }

    if (this.subItems[promptName]) {
      Object.entries(this.subItems[promptName]).forEach(([key, value]) => {
        this.items[key] = value;
      });
    }

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

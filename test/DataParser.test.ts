import { describe, it, expect } from 'vitest';
import { IndexParser } from '../src/jumon/indexParser';

describe('IndexParser', () => {
  const jsonData = JSON.stringify([
    {
      items: [
        { name: 'base', content: '女性, 二次元少女' },
        { name: '动物类型', content: '{{rnd(猫,兔子)}}' },
        { name: '动物', content: '桌子上有{{$动物类型}}，沙发上有{{$动物类型}}' },
      ],
      prompts: [
        { name: 'demo', content: '{{base}}，坐在椅子上，{{动物}}' },
      ],
    },
  ]);

  it('should generate the correct prompt', () => {
    const parser = new IndexParser(jsonData);
    const result = parser.generatePrompt('demo');
    expect(result).toMatch(/女性, 二次元少女，坐在椅子上，桌子上有(猫|兔子)，沙发上有(猫|兔子)/);
  });

  it('should list all prompts', () => {
    const parser = new IndexParser(jsonData);
    const prompts = parser.listPrompts();
    expect(prompts).toContain('demo');
  });

  it('should list all items', () => {
    const parser = new IndexParser(jsonData);
    const items = parser.listItems();
    expect(items).toEqual(expect.arrayContaining(['base', '动物类型', '动物']));
  });
});

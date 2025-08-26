import { describe, it, expect } from 'vitest';
import { IndexParser } from '../src/jumon/indexParser';

const doM = (i: number, fn: Function) => {
  for (let j = 0; j < i; j++) {
    fn(j);
  }
};

describe('IndexParser', () => {
  const jsonData = JSON.stringify([
    {
      items: [
        { name: 'base', content: '女性, 二次元少女' },
        { name: '动物类型', content: '{{rnd(猫,兔子)}}' },
        { name: '动物', content: '桌子上有{{$动物类型}}, 沙发上有{{$动物类型}}' },
        { name: '窗户', content: '{{rnd(1,-1)}}' },
        { name: '窗外景色', content: '{{if($窗户 ? 窗外有蓝天白云 : _null)}}' },
      ],
      prompts: [
        { name: 'demo', content: '{{base}}, 坐在椅子上, {{动物}}' },
        { name: 'demo2', content: '{{base}}, 坐在椅子上, {{窗外景色}},,' },
      ],
    },
  ]);

  it('should generate the correct prompt', () => {
    const parser = new IndexParser(jsonData);
    const result = parser.generatePrompt('demo');
    expect(result).toMatch(/女性, 二次元少女, 坐在椅子上, 桌子上有(猫|兔子), 沙发上有(猫|兔子)/);
  });

  it('should generate the correct prompt', () => {
    const parser = new IndexParser(jsonData);
    doM(10, () => {
      const result = parser.generatePrompt('demo2');
      expect(result).toBeOneOf(['女性, 二次元少女, 坐在椅子上', '女性, 二次元少女, 坐在椅子上, 窗外有蓝天白云' ]);
    });
  });

  it('should list all prompts', () => {
    const parser = new IndexParser(jsonData);
    const prompts = parser.listPrompts();
    expect(prompts).toEqual(expect.arrayContaining(['demo', 'demo2']));
  });

  it('should list all items', () => {
    const parser = new IndexParser(jsonData);
    const items = parser.listItems();
    expect(items).toEqual(expect.arrayContaining(['base', '动物类型', '动物']));
  });
});

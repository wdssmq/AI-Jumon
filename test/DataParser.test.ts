import { describe, expect, it } from 'vitest';
import { IndexParser } from '../src/jumon/indexParser';

function doM(i: number, fn: (j: number) => void) {
  for (let j = 0; j < i; j++) {
    fn(j);
  }
}

describe('indexParser', () => {
  const jsonData = JSON.stringify(
    {
      items: [
        { name: 'base', content: '女性, 二次元少女' },
        { name: '动物类型', content: '{{rnd(猫,兔子)}}' },
        { name: '动物', content: '桌子上有{{$动物类型}}, 沙发上有{{$动物类型}}' },
        { name: '窗户', content: '{{rnd(1,-1)}}' },
        { name: '窗外景色', content: '{{if($窗户 ? 窗外有蓝天白云 : _null)}}' },
        { name: '窗台', content: '{{if($窗户 ? 窗台上有{{$动物类型}} : _null)}}' },
      ],
      prompts: [
        { name: 'demo', content: '{{base}}, 坐在椅子上, {{动物}}' },
        { name: 'demo2', content: '{{base}}, 坐在椅子上, {{窗外景色}},,' },
        { name: 'demo3', content: '{{base}}, 桌子上有{{$动物类型}}, {{窗台}}, {{窗外景色}}' },
      ],
    },
  );

  it('should generate the correct prompt for demo', () => {
    const parser = new IndexParser(jsonData);
    const result = parser.generatePrompt('demo');
    expect(result).toMatch(/女性, 二次元少女, 坐在椅子上, 桌子上有(猫|兔子), 沙发上有(猫|兔子)/);
  });

  it('should generate the correct prompt for demo2', () => {
    const parser = new IndexParser(jsonData);
    doM(20, () => {
      const result = parser.generatePrompt('demo2');
      expect(result).toBeOneOf(['女性, 二次元少女, 坐在椅子上', '女性, 二次元少女, 坐在椅子上, 窗外有蓝天白云']);
    });
  });

  it('随机及条件判断测试', () => {
    const parser = new IndexParser(jsonData);
    doM(15, () => {
      const result = parser.generatePrompt('demo3');
      console.log(result);
    });
  });

  it('should list all prompts', () => {
    const parser = new IndexParser(jsonData);
    const prompts = parser.listPrompts();
    expect(prompts).toEqual(expect.arrayContaining(['demo', 'demo2', 'demo3']));
  });

  it('should list all items', () => {
    const parser = new IndexParser(jsonData);
    const items = parser.listItems();
    expect(items).toEqual(expect.arrayContaining(['base', '动物类型', '动物', '窗户', '窗外景色', '窗台']));
  });
});

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import EdtItems from '@/components/EdtItems.vue';
import EdtPrompts from '@/components/EdtPrompts.vue';
import {
  IndexParser,
  type Config,
  type Item,
  type Prompt,
} from '@/jumon/indexParser';

const IndexConfig = ref<Config>({
  items: [],
  prompts: []
});
const ConfigList = ref<Record<string, any>>({});
const selectedConfig = ref<string>('');
const bodyRef = ref<HTMLElement | undefined>(undefined)

let IndexProject: IndexParser;

// 请求配置列表
// {"list": ["demo"],"default": "demo"}
const fetchConfigs = async () => {
  try {
    // @ts-ignore
    const configs = await window.ipcRenderer.invoke('get-config-list');
    console.log('Fetched Configs:', configs);
    selectedConfig.value = configs.default || '';
    ConfigList.value = configs;
    return configs;
  } catch (error) {
    console.error('Failed to fetch configs:', error);
    return [];
  }
};

const setDefConfig = async () => {
  try {
    // @ts-ignore
    await window.ipcRenderer.invoke('set-default-config', selectedConfig.value);
    ConfigList.value.default = selectedConfig.value;
    console.log('Default config set successfully');
  } catch (error) {
    console.error('Failed to set default config:', error);

  }
};


// 预解析 result
function preProcessResult(result: Config[] | Config) {
  const IndexData: Config = {
    items: [],
    prompts: []
  };
  // 如果 result 不是数组且有 items 和 prompts，直接返回
  if (!Array.isArray(result)) {
    IndexData.items = result.items || [];
    IndexData.prompts = result.prompts || [];
  }

  if (Array.isArray(result)) {
    result.forEach((el) => {
      if (el.items) {
        IndexData.items = el.items || [];
      }
      if (el.prompts) {
        IndexData.prompts = el.prompts || [];
      }
    });
  }
  return IndexData;
}

const fetchPrompts = async (configName = "") => {
  console.log('----');

  try {
    // @ts-ignore
    const result = await window.ipcRenderer.invoke('get-prompts', configName);
    IndexConfig.value = preProcessResult(result);
    console.log('Fetched Prompts:', IndexConfig.value);
    generatePrompt();
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
  }
};

type SavePromptsType = 'add' | 'edit' | 'delete';
// 实际添加新条目后通过编辑保存
const savePrompts = async (type: SavePromptsType, args: Prompt) => {
  const IndexData = IndexConfig.value;
  const index = IndexData.prompts.findIndex((p) => p.name === args.name);

  if (index !== -1 && type === 'edit') {
    IndexData.prompts[index] = args;
    console.log('Edited Prompt:', args.name);
  }

  if (index !== -1 && type === 'delete') {
    IndexData.prompts.splice(index, 1);
    toDeletePrompt.value = false;
    console.log('Deleted Prompt:', args.name);
  }

  // 深拷贝并移除 prompts 中的 result 字段
  const plainData = JSON.parse(JSON.stringify(IndexConfig.value));
  plainData.prompts?.forEach((p: Prompt) => delete p.result);


  try {
    // @ts-ignore
    await window.ipcRenderer.invoke('save-prompts', plainData);
    console.log('Prompt saved successfully');
    generatePrompt();
  } catch (error) {
    console.error('Failed to save prompt:', error);
  }
};


async function saveItems(items: Item[]) {
  // 更新本地配置
  IndexConfig.value.items = items;

  // 深拷贝并移除 prompts 中的 result 字段
  const plainData = JSON.parse(JSON.stringify(IndexConfig.value));
  plainData.prompts?.forEach((p: Prompt) => delete p.result);

  try {
    // @ts-ignore
    await window.ipcRenderer.invoke('save-prompts', plainData);
    console.log('Items saved successfully');
    generatePrompt();
  } catch (error) {
    console.error('Failed to save items:', error);
  }
}

onMounted(() => {
  fetchConfigs();
  fetchPrompts();
  bodyRef.value = document.body;
});

// 监听 selectedConfig 变化，重新加载 prompts
watch(selectedConfig, (newConfig, oldConfig) => {
  if (!oldConfig) return;
  if (newConfig) {
    fetchPrompts(newConfig);
  }
});


function generatePrompt(rnd: boolean = false) {
  IndexProject = new IndexParser(IndexConfig.value);

  // prompts 随机排序
  if (rnd && IndexConfig.value.prompts) {
    IndexConfig.value.prompts.sort(() => Math.random() - 0.5);
  }
  IndexConfig.value.prompts?.forEach((prompt) => {
    const generated = IndexProject.generatePrompt(prompt.name);
    // console.log('Generated Prompt:', generated);
    prompt.result = generated;
  });
  console.log('Generated Config:', IndexConfig.value);
}

// 变量编辑器
const showItemsEditor = ref(false);
// 提示词编辑器
const showPromptEditor = ref(false);
const selectedPrompt = ref<Prompt>({} as Prompt);
// 修改默认配置
const toChangeDef = ref(false);
// 删除提示词
const toDeletePrompt = ref(false);

function openEditor(prompt: any) {
  selectedPrompt.value = prompt;
  showPromptEditor.value = true;
}

function actChangeDef() {
  if (selectedConfig.value && selectedConfig.value !== ConfigList.value?.default) {
    setDefConfig();
  }
  toChangeDef.value = false;
}

function addPrompt() {
  const IndexData = IndexConfig.value;
  const count = IndexData.prompts.length + 1;
  const newPrompt: Prompt = {
    name: `p${count}`,
    desc: `新建提示词 p${count} 的描述`,
    content: "",
  };
  IndexData.prompts.push(newPrompt);
  // 打开编辑器
  openEditor(newPrompt);
}

function deletePrompt(name: string) {
  if (!name) return;
  const IndexData = IndexConfig.value;
  const arrPrompts = IndexData.prompts.filter((p) => p.name === name);
  // 如果有重复值，弹出警告
  if (arrPrompts.length > 1) {
    alert(`存在重复的名称项，请重新命名 - ${name}`);
    return;
  }
  // 执行删除操作
  savePrompts('delete', arrPrompts[0]);
}

function onDeletePromptChange(e: Event) {
  const name = (e.target as HTMLSelectElement).value;
  const prompt = IndexConfig.value.prompts.find(p => p.name === name);
  if (prompt) {
    selectedPrompt.value = prompt;
  }
}

import {
  NAffix,
 } from 'naive-ui'

</script>

<template>
  <div>
    <NAffix :top="13"
            class="right-0 left-0 z-10"
            :trigger-top="37"
            :listen-to="bodyRef">
      <!-- 配置列表及切换 -->
      <div class="flex gap-2 mb-4 pl-8 items-center justify-end bg-gray-100">
        <!-- checkbox 项 -->
        <div v-if="selectedConfig !== ConfigList?.default"
             class="flex items-center gap-2 mr-4">
          <template v-if="!toChangeDef">
            <label class="text-sm">设为默认
              <input type="checkbox"
                     @change="toChangeDef = true" />
            </label>
          </template>
          <template v-else>
            <span class="text-sm font-bold">再次确认</span>
            <button type="button"
                    class="btn-def bg-gray-600 hover:bg-gray-500 text-sm px-2 py-1 rounded"
                    @click="toChangeDef = false">
              取消
            </button>
            <button type="button"
                    class="btn-def bg-blue-500 hover:bg-blue-600 text-sm px-2 py-1 rounded"
                    @click="actChangeDef">
              确认
            </button>
          </template>
        </div>
        <label for="configSelect"
               class="mr-2 font-bold">配置切换:</label>
        <select id="configSelect"
                class="input-def  mr-8"
                v-model="selectedConfig">
          <option v-for="config in ConfigList?.list"
                  :key="config"
                  :value="config">
            {{ config }}<span v-if="config === ConfigList?.default">(默认)</span>
          </option>
        </select>
      </div>
    </NAffix>

    <!-- 变量列表 -->
    <details class="mb-4">
      <summary class="cursor-pointer text-lg font-bold mb-2 ml-2">变量列表
        <button @click="showItemsEditor = true"
                class="btn-def bg-purple-500 hover:bg-purple-600">编辑变量</button>
      </summary>
      <ul v-if="IndexConfig && IndexConfig.items">
        <li v-for="(item, index) in IndexConfig.items"
            :key="index"
            class="grid grid-cols-[20%_auto] gap-4 py-1">
          <strong class="text-blue-700">{{ `\{\{${item.name}\}\}` }}</strong>
          <span class="text-gray-700">{{ item.content }}</span>
        </li>
      </ul>
    </details>

    <!-- 控制条 -->
    <div class="flex gap-2 mb-4 ml-2">
      <!-- <button @click="generatePrompt(false)"
              class="btn-def bg-blue-500 hover:bg-blue-600">重新生成</button> -->
      <template v-if="!toDeletePrompt">
        <button @click="toDeletePrompt = true"
                class="btn-def bg-red-500 hover:bg-red-600">删除提示词</button>
      </template>
      <template v-else>
        <select name="deletePrompt"
                id="deletePrompt"
                class="input-def"
                @change="onDeletePromptChange">
          <option value="">请选择要删除的提示词</option>
          <option v-for="(prompt, index) in IndexConfig.prompts"
                  :key="index"
                  :value="prompt.name">
            {{ prompt.name }}
          </option>
        </select>
        <button @click="deletePrompt(selectedPrompt.name)"
                class="btn-def bg-red-500 hover:bg-red-600">确认</button>
        <button @click="toDeletePrompt = false"
                class="btn-def bg-gray-500 hover:bg-gray-600">取消</button>
      </template>
      <button @click="addPrompt()"
              class="btn-def bg-gray-500 hover:bg-gray-600">添加提示词</button>
      <button @click="generatePrompt(true)"
              class="btn-def bg-green-500 hover:bg-green-600">随机排序</button>

    </div>

    <!-- 提示词列表 -->
    <details open>
      <summary class="cursor-pointer text-lg font-bold mb-2 ml-2">提示词列表</summary>
      <ul v-if="IndexConfig && IndexConfig.prompts">
        <li v-for="(prompt, index) in IndexConfig.prompts"
            :key="index"
            class="grid gap-2 p-3 rounded mb-4 bg-gray-100 shadow-sm">
          <div class="flex items-center gap-2 mb-1">
            <strong class="text-purple-700 w17">{{ prompt.name }}</strong>
            <span class="text-gray-500 text-sm w64">{{ prompt.desc }}</span>
            <button @click="generatePrompt(false)"
                    class="btn-def bg-blue-500 hover:bg-blue-600">重新生成</button>
            <button @click="openEditor(prompt)"
                    class="btn-def bg-yellow-500 hover:bg-yellow-600">编辑</button>
          </div>
          <textarea :name="prompt.name"
                    :id="prompt.name"
                    rows="3"
                    spellcheck="false"
                    class="w-full p-2 border rounded bg-white font-mono text-sm resize-none"
                    readonly>{{ prompt.result }}</textarea>
          <div class="text-gray-600 text-xs mt-1">原始内容：{{ prompt.content }}</div>
        </li>
      </ul>
    </details>

    <EdtPrompts v-if="showPromptEditor"
                :prompt="selectedPrompt"
                @close="showPromptEditor = false"
                @save="savePrompts" />

    <EdtItems v-if="showItemsEditor"
              :items="IndexConfig.items"
              @close="showItemsEditor = false"
              @save="saveItems" />
  </div>
</template>

<style scoped></style>

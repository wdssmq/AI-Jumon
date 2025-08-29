<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import EdtPrompts from '@/components/EdtPrompts.vue';
import {
  IndexParser,
  type Config,
  // type Item,
  type Prompt,
} from '@/jumon/indexParser';

const IndexConfig = ref<Config | null>(null);
const ConfigList = ref<Record<string, any>>({});
const selectedConfig = ref<string>('');

let IndexProject: IndexParser;
let result: Config[];


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

const fetchPrompts = async (configName = "") => {
  try {
    // @ts-ignore
    result = await window.ipcRenderer.invoke('get-prompts', configName);
    console.log('Fetched Prompts:', result);
    generatePrompt();
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
  }
};

const savePrompts = async (args: Prompt) => {
  result.forEach((el: Config) => {
    if (el.prompts) {
      const index = el.prompts.findIndex((p) => p.name === args.name);
      if (index !== -1) {
        el.prompts[index] = args;
      }
    }
  });
  try {
    // @ts-ignore
    await window.ipcRenderer.invoke('save-prompts', result);
    console.log('Prompt saved successfully');
    generatePrompt();
  } catch (error) {
    console.error('Failed to save prompt:', error);
  }

};

onMounted(() => {
  fetchConfigs();
  fetchPrompts();
});

// 监听 selectedConfig 变化，重新加载 prompts
watch(selectedConfig, (newConfig) => {
  if (newConfig) {
    fetchPrompts(newConfig);
  }
});

function generatePrompt(rnd: boolean = false) {
  IndexProject = new IndexParser(result);
  const obj = {} as Config;
  result.forEach((el: Config) => {
    if (el.items) {
      obj.items = el.items;
    }
    if (el.prompts) {
      obj.prompts = el.prompts;
    }
  });
  // obj.prompts 随机排序
  if (rnd && obj.prompts) {
    obj.prompts.sort(() => Math.random() - 0.5);
  }
  obj.prompts?.forEach((prompt) => {
    const generated = IndexProject.generatePrompt(prompt.name);
    // console.log('Generated Prompt:', generated);
    prompt.result = generated;
  });
  console.log('Generated Config:', obj);

  IndexConfig.value = obj;
}

const showEditor = ref(false);
const selectedPrompt = ref<Prompt>({} as Prompt);
// 修改默认配置
const toChangeDef = ref(false);

function openEditor(prompt: any) {
  selectedPrompt.value = prompt;
  showEditor.value = true;
}

function actChangeDef() {
  if (selectedConfig.value && selectedConfig.value !== ConfigList.value?.default) {
    setDefConfig();
  }
  toChangeDef.value = false;
}

</script>

<template>
  <div>
    <!-- 配置列表及切换 -->
    <div class="flex gap-2 mb-4 mr-8 pl-8 items-center justify-end">
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
              class="p-1 rounded"
              v-model="selectedConfig">
        <option v-for="config in ConfigList?.list"
                :key="config"
                :value="config">
          {{ config }}<span v-if="config === ConfigList?.default">(默认)</span>
        </option>
      </select>
    </div>

    <details class="mb-4">
      <summary class="cursor-pointer text-lg font-bold mb-2">变量列表</summary>
      <ul v-if="IndexConfig && IndexConfig.items">
        <li v-for="(item, index) in IndexConfig.items"
            :key="index"
            class="grid grid-cols-[20%_auto] gap-4 py-1">
          <strong class="text-blue-700">{{ item.name }}</strong>
          <span class="text-gray-700">{{ item.content }}</span>
        </li>
      </ul>
    </details>
    <div class="flex gap-2 mb-4 pl-8">
      <button @click="generatePrompt(false)"
              class="btn-def bg-blue-500 hover:bg-blue-600">重新生成</button>
      <button @click="generatePrompt(true)"
              class="btn-def bg-green-500 hover:bg-green-600">随机重新生成</button>

    </div>
    <details open>
      <summary class="cursor-pointer text-lg font-bold mb-2">提示词列表</summary>
      <ul v-if="IndexConfig && IndexConfig.prompts">
        <li v-for="(prompt, index) in IndexConfig.prompts"
            :key="index"
            class="grid gap-2 p-3 rounded mb-4 bg-gray-100 shadow-sm">
          <div class="flex items-center gap-2 mb-1">
            <strong class="text-purple-700 w13">{{ prompt.name }}</strong>
            <span class="text-gray-500 text-sm w64">{{ prompt.desc }}</span>
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

    <EdtPrompts v-if="showEditor"
                :prompt="selectedPrompt"
                @close="showEditor = false"
                @save="savePrompts" />
  </div>
</template>

<style scoped></style>

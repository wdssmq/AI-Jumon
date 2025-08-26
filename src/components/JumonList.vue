<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IndexParser,
  type Config,
  // type Item,
  // type Prompt,
} from '@/jumon/indexParser';

const IndexConfig = ref<Config | null>(null);
let IndexProject: IndexParser;
let result: Config[];
// const IndexProject = ref<IndexParser | null>(null);

const fetchPrompts = async () => {
  try {
    // @ts-ignore
    result = await window.ipcRenderer.invoke('get-prompts');
    generatePrompt();
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
  }
};

onMounted(() => {
  fetchPrompts();
});

function generatePrompt(rnd:boolean = false) {
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

    console.log('Generated Prompt:', generated);

    prompt.result = generated;
  });
  IndexConfig.value = obj;
}

</script>

<template>
  <div>
    <details open class="mb-4">
      <summary class="cursor-pointer text-lg font-bold mb-2">变量列表</summary>
      <ul v-if="IndexConfig && IndexConfig.items">
        <li v-for="(item, index) in IndexConfig.items" :key="index" class="grid grid-cols-[20%_auto] gap-4 py-1 border-b">
          <strong class="text-blue-700">{{ item.name }}</strong>
          <span class="text-gray-700">{{ item.content }}</span>
        </li>
      </ul>
    </details>
    <div class="flex gap-2 mb-4 pl-8">
      <button @click="generatePrompt(false)" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">重新生成</button>
      <button @click="generatePrompt(true)" class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">随机重新生成</button>
    </div>
    <details open>
      <summary class="cursor-pointer text-lg font-bold mb-2">提示词列表</summary>
      <ul v-if="IndexConfig && IndexConfig.prompts">
        <li v-for="(prompt, index) in IndexConfig.prompts" :key="index"
          class="grid grid-cols-1 gap-2 p-3 border rounded mb-4 bg-gray-50 shadow-sm">
          <div class="flex items-center gap-2 mb-1">
            <strong class="text-purple-700">{{ prompt.name }}</strong>
            <span class="text-gray-500 text-sm">{{ prompt.desc }}</span>
          </div>
          <textarea
            :name="prompt.name"
            :id="prompt.name"
            rows="3"
            spellcheck="false"
            class="w-full p-2 border rounded bg-white font-mono text-sm resize-none"
            readonly
          >{{ prompt.result }}</textarea>
          <div class="text-gray-600 text-xs mt-1">原始内容：{{ prompt.content }}</div>
        </li>
      </ul>
    </details>
  </div>
</template>

<style scoped></style>

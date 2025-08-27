<script setup lang="ts">
import { ref, onMounted } from 'vue';
import EdtPrompts from '@/components/EdtPrompts.vue';
import {
  IndexParser,
  type Config,
  // type Item,
  type Prompt,
} from '@/jumon/indexParser';

const IndexConfig = ref<Config | null>(null);
let IndexProject: IndexParser;
let result: Config[];
// const IndexProject = ref<IndexParser | null>(null);

const fetchPrompts = async () => {
  try {
    // @ts-ignore
    result = await window.ipcRenderer.invoke('get-prompts');
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
  fetchPrompts();
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

function openEditor(prompt: any) {
  selectedPrompt.value = prompt;
  showEditor.value = true;
}
</script>

<template>
  <div>
    <details class="mb-4">
      <summary class="cursor-pointer text-lg font-bold mb-2">变量列表</summary>
      <ul v-if="IndexConfig && IndexConfig.items">
        <li v-for="(item, index) in IndexConfig.items" :key="index"
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
        <li v-for="(prompt, index) in IndexConfig.prompts" :key="index"
          class="grid gap-2 p-3 rounded mb-4 bg-gray-100 shadow-sm">
          <div class="flex items-center gap-2 mb-1">
            <strong class="text-purple-700 w13">{{ prompt.name }}</strong>
            <span class="text-gray-500 text-sm w64">{{ prompt.desc }}</span>
            <button @click="openEditor(prompt)"
              class="btn-def bg-yellow-500 hover:bg-yellow-600">编辑</button>
          </div>
          <textarea :name="prompt.name" :id="prompt.name" rows="3" spellcheck="false"
            class="w-full p-2 border rounded bg-white font-mono text-sm resize-none"
            readonly>{{ prompt.result }}</textarea>
          <div class="text-gray-600 text-xs mt-1">原始内容：{{ prompt.content }}</div>
        </li>
      </ul>
    </details>

    <EdtPrompts v-if="showEditor" :prompt="selectedPrompt" @close="showEditor = false" @save="savePrompts" />
  </div>
</template>

<style scoped></style>

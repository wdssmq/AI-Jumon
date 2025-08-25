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
    <h2>变量列表</h2>
    <ul v-if="IndexConfig && IndexConfig.items">
      <li v-for="(item, index) in IndexConfig.items" :key="index" class="grid grid-cols-[10%_auto] gap-4">
        <strong>{{ item.name }}</strong>
        <span>{{ item.content }}</span>
      </li>
    </ul>
<button @click="generatePrompt(false)">重新生成</button>
<button @click="generatePrompt(true)">随机重新生成</button>
    <h3>提示词列表</h3>
    <ul v-if="IndexConfig && IndexConfig.prompts">
      <li v-for="(prompt, index) in IndexConfig.prompts" :key="index"
        class="grid grid-rows-2 grid-cols-[10%_auto] gap-4 pb-4 b-b-10 border-gray-300 mb-4">
        <span>{{ prompt.desc }}</span>
        <textarea :name="prompt.name" :id="prompt.name" rows="3" spellcheck="false" class="p-1.3">{{ prompt.result }}</textarea>
        <strong>{{ prompt.name }}</strong>
        <span>{{ prompt.content }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>

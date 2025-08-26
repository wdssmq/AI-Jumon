<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, computed } from 'vue';
import { type Prompt } from '@/jumon/indexParser';

const props = defineProps({
  prompt: Object
});

const emit = defineEmits(['close', 'save']);

const editedContent = ref(props.prompt?.content || '');
const prompt = props.prompt as Prompt;

// 监听 props 变化，更新编辑内容
watch(
  () => props.prompt,
  (newPrompt) => {
    editedContent.value = newPrompt?.content || '';
  },
  { immediate: true }
);

// 保存编辑内容
function save() {
  emit('save', { ...prompt, content: editedContent.value });
  emit('close');
}

// 关闭弹窗
function close() {
  emit('close');
}

// 获取其他属性（排除 name, desc, content）
const otherAttributes = computed(() => {
  const excludedKeys = ['name', 'desc', 'content', 'result'];
  return Object.entries(prompt).filter(([key]) => !excludedKeys.includes(key));
});
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded shadow-lg w-1/2">
      <h2 class="text-lg font-bold mb-4">编辑提示词</h2>
      <div class="mb-2"><strong>名称:</strong> {{ prompt.name }}</div>
      <div class="mb-4"><strong>描述:</strong> {{ prompt.desc }}</div>
      <textarea v-model="editedContent" rows="10"
        class="w-full p-2 border rounded font-mono text-sm resize-none"></textarea>
      <!-- 动态列出其他属性 -->
      <div v-if="otherAttributes.length" class="mt-4">
          <div v-for="[key, value] in otherAttributes" :key="key" class="mb-1">
            <strong>{{ key }}:</strong> {{ value }}
          </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button @click="close" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">取消</button>
        <button @click="save" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">保存</button>
      </div>
    </div>
  </div>
</template>

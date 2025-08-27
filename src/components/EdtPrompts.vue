<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, computed, onMounted, defineComponent, h } from 'vue';
import { type Prompt } from '@/jumon/indexParser';

const props = defineProps({
  prompt: Object
});

const emit = defineEmits(['close', 'save']);

const editedContent = ref(props.prompt?.content || '');
const prompt = props.prompt as Prompt;

// 一个对象列表，key 为 prompt 的其他属性名，value 记录是否开启此项的编辑
const attributesEditState = ref<{ [key: string]: boolean }>({});

onMounted(() => {
  // 初始化 attributesEditState
  const excludedKeys = ['content', 'result'];
  const obj: { [key: string]: boolean } = {};
  Object.keys(prompt).forEach((key) => {
    if (!excludedKeys.includes(key)) {
      obj[key] = false; // 默认不编辑
    }
  });
  attributesEditState.value = obj;
});

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

// 封装一个通用的编辑按钮组件
const EditButton = defineComponent({
  props: {
    isEditing: {
      type: Boolean,
      required: true
    },
    onToggle: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    return () => {
      return h(
        'button',
        {
          class: 'btn-def bg-gray-500 hover:bg-gray-600',
          onClick: props.onToggle
        },
        props.isEditing ? '锁定' : '编辑'
      );
    };
  }
});
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="close">
    <div class="bg-white p-6 rounded shadow-lg w-1/2" @click.stop>
      <h2 class="text-lg font-bold mb-4">编辑提示词</h2>
      <div class="mb-2 flex items-center gap-2">
        <strong>名称:</strong>
        <input v-if="attributesEditState['name']" v-model="prompt.name" class="p-1 border rounded w73"
          :name="prompt.name" />
        <span v-else class="w73">
          {{ prompt.name }}
        </span>
        <EditButton :isEditing="attributesEditState['name']"
          :onToggle="() => (attributesEditState['name'] = !attributesEditState['name'])" />
      </div>
      <div class="mb-4 flex items-center gap-2">
        <strong>描述:</strong>
        <input v-if="attributesEditState['desc']" v-model="prompt.desc" class="p-1 border rounded w73"
          :name="prompt.name" />
        <span v-else class="w73">
          {{ prompt.desc }}
        </span>
        <EditButton :isEditing="attributesEditState['desc']"
          :onToggle="() => (attributesEditState['desc'] = !attributesEditState['desc'])" />
      </div>
      <textarea v-model="editedContent" rows="10"
        class="w-full p-2 border rounded font-mono text-sm resize-none"></textarea>
      <!-- 动态列出其他属性 -->
      <div v-if="otherAttributes.length" class="mt-4">
        <div v-for="[key, value] in otherAttributes" :key="key" class="mb-1 flex items-center gap-2">
          <strong>{{ key }}:</strong>
          <textarea v-if="attributesEditState[key]" v-model="prompt[key]" class="p-2 border rounded font-mono w-prose"
            :name="key"></textarea>
          <span v-else class="w-prose whitespace-nowrap overflow-clip text-ellipsis">
            {{ value }}
          </span>
          <EditButton :isEditing="attributesEditState[key]"
            :onToggle="() => (attributesEditState[key] = !attributesEditState[key])" />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button @click="close" class="btn-def bg-gray-500 hover:bg-gray-600">取消</button>
        <button @click="save" class="btn-def bg-blue-500 hover:bg-blue-600">保存</button>
      </div>
    </div>
  </div>
</template>

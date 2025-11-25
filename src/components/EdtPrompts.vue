<script setup lang="ts">
import type { Prompt } from '@/jumon/indexParser';
import { computed, defineComponent, h, onBeforeMount, ref, watch } from 'vue';

const props = defineProps({
  prompt: Object,
});

const emit = defineEmits(['close', 'save']);

const editedContent = ref(props.prompt?.content || '');
const prompt = props.prompt as Prompt;

// 一个对象列表，key 为 prompt 的其他属性名，value 记录是否开启此项的编辑
const attributesEditState = ref<{ [key: string]: boolean }>({});

// 新建属性相关
const showAddAttribute = ref(false);
const newAttributeKey = ref('');
const newAttributeValue = ref('');

onBeforeMount(() => {
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
  { immediate: true },
);

// 保存编辑内容
function save() {
  emit('save', 'edit', { ...prompt, content: editedContent.value });
  emit('close');
}

const isAnyEditing = computed(() => {
  let rst = false;
  Object.values(attributesEditState.value).forEach((v) => {
    if (v)
      rst = true;
  });
  return rst;
});

// 关闭弹窗
function close() {
  // 防止非预期关闭
  if (isAnyEditing.value) {
    return;
  }
  emit('close');
}

// 新建属性
function addAttribute() {
  if (newAttributeKey.value) {
    // 判断是否已存在该属性
    if (prompt[newAttributeKey.value]) {
      // 如果已存在，则直接更新
      alert('属性已存在');
      return;
    }
    // 添加新属性
    prompt[newAttributeKey.value] = newAttributeValue.value;
    // 如果新属性值为空，默认开启编辑状态
    if (newAttributeValue.value === '') {
      attributesEditState.value[newAttributeKey.value] = true;
    }
    else {
      attributesEditState.value[newAttributeKey.value] = false;
    }
    newAttributeKey.value = '';
    newAttributeValue.value = '';
    showAddAttribute.value = false;
  }
}

// 删除属性
function deleteAttribute(key: string) {
  delete prompt[key];
  delete attributesEditState.value[key];
}

// 获取其他属性（排除 name, desc, content）
const otherAttributes = computed(() => {
  const excludedKeys = ['name', 'desc', 'content', 'result'];
  return Object.entries(prompt).filter(([key]) => !excludedKeys.includes(key));
});

// 判断属性是否被引用
function isAttributeUsed(key: string) {
  let rstCheck = false;
  if (editedContent.value.includes(`{{${key}}}`)) {
    rstCheck = true;
  }
  rstCheck = rstCheck || otherAttributes.value.some(([_key, val]) => {
    return typeof val === 'string' && val.includes(`{{${key}}}`);
  });
  return rstCheck;
}

// 封装一个通用的编辑按钮组件
const EditButton = defineComponent({
  props: {
    isEditing: {
      type: Boolean,
      required: true,
    },
    onToggle: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    return () => {
      return h(
        'button',
        {
          class: 'btn-def bg-gray-500 hover:bg-gray-600',
          onClick: props.onToggle,
        },
        props.isEditing ? '锁定' : '编辑',
      );
    };
  },
});
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click="close"
  >
    <div
      class="w-1/2 rounded bg-white p-6 shadow-lg"
      @click.stop
    >
      <h2 class="mb-4 text-lg font-bold">
        编辑提示词
      </h2>

      <div class="mb-2 flex items-center gap-2">
        <strong>名称:</strong>
        <input
          v-if="attributesEditState.name"
          v-model="prompt.name"
          class="w73 border rounded p-1"
          :name="prompt.name"
        >
        <span
          v-else
          class="w73"
        >
          {{ prompt.name }}
        </span>
        <EditButton
          :is-editing="attributesEditState.name"
          :on-toggle="() => (attributesEditState.name = !attributesEditState.name)"
        />
      </div>

      <div class="mb-4 flex items-center gap-2">
        <strong>描述:</strong>
        <input
          v-if="attributesEditState.desc"
          v-model="prompt.desc"
          class="w73 border rounded p-1"
          :name="prompt.name"
        >
        <span
          v-else
          class="w73"
        >
          {{ prompt.desc }}
        </span>
        <EditButton
          :is-editing="attributesEditState.desc"
          :on-toggle="() => (attributesEditState.desc = !attributesEditState.desc)"
        />
      </div>

      <!-- 主要内容编辑框 -->
      <textarea
        v-model="editedContent"
        rows="10"
        class="w-full resize-none border rounded p-2 text-sm font-mono"
        @focus="attributesEditState.content = true"
        @blur="attributesEditState.content = false"
      />

      <!-- 新建属性 -->
      <div class="mt-2 flex items-center gap-2">
        <template v-if="showAddAttribute">
          <!-- 新建属性输入框 -->
          <input
            v-model="newAttributeKey"
            placeholder="属性名"
            class="w-32 border rounded p-1"
          >
          <input
            v-model="newAttributeValue"
            placeholder="属性值"
            class="w-64 border rounded p-1"
          >
          <button
            class="btn-def bg-blue-500 hover:bg-blue-600"
            @click="addAttribute"
          >
            添加
          </button>
          <button
            class="btn-def bg-red-500 hover:bg-red-600"
            @click="showAddAttribute = false"
          >
            取消
          </button>
        </template>
        <!-- 新建属性按钮 -->
        <button
          v-else
          class="btn-def bg-green-500 hover:bg-green-600"
          @click="showAddAttribute = true"
        >
          新建属性
        </button>
      </div>

      <!-- 动态列出其他属性 -->
      <div
        v-if="otherAttributes.length"
        class="mt-4"
      >
        <div
          v-for="[key, value] in otherAttributes"
          :key="key"
          class="mb-1 flex items-center gap-2"
        >
          <strong :class="!isAttributeUsed(key) ? 'text-blue-500 font-bold' : ''">{{ `\{\{${key}\}\}` }}</strong> ：
          <textarea
            v-if="attributesEditState[key]"
            v-model="prompt[key]"
            class="w-137 border rounded p-2 font-mono"
            :name="key"
          />
          <span
            v-else
            class="overflow-clip text-ellipsis whitespace-nowrap"
            :class="prompt[key] === '' ? 'w-50' : 'w-137'"
          >
            {{ value }}
          </span>

          <!-- 如果属性值为空，显示重命名和删除按钮 -->
          <template v-if="prompt[key] === ''">
            <!-- 删除按钮 -->
            <button
              class="ml-2 btn-def bg-red-500 hover:bg-red-600"
              @click="deleteAttribute(key)"
            >
              删除
            </button>
          </template>

          <!-- 编辑按钮 -->
          <EditButton
            :is-editing="attributesEditState[key]"
            :on-toggle="() => (attributesEditState[key] = !attributesEditState[key])"
          />
          <!-- >>循环结束 -->
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="mt-4 flex items-center justify-end gap-2">
        <span>注：蓝色标记的属性为未使用状态；</span>
        <button
          class="btn-def bg-gray-500 hover:bg-gray-600"
          @click="close"
        >
          取消
        </button>
        <button
          class="btn-def bg-blue-500 hover:bg-blue-600"
          @click="save"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

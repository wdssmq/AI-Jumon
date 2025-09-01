<script setup lang="ts">
import { ref, watch, defineEmits, computed, defineComponent, h, onBeforeMount } from 'vue';
import { type Prompt } from '@/jumon/indexParser';

const props = defineProps({
  prompt: Object
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
  { immediate: true }
);

// 保存编辑内容
function save() {
  emit('save', { ...prompt, content: editedContent.value });
  emit('close');
}

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
    } else {
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

const isAnyEditing = computed(() => {
  let rst = false;
  Object.values(attributesEditState.value).forEach(v => {
    if (v) rst = true;
  });
  return rst;
});

// 判断属性是否被引用
const isAttributeUsed = (key: string) => {
  let rstCheck = false;
  if (editedContent.value.includes(`{{${key}}}`)) {
    rstCheck = true;
  }
  rstCheck = rstCheck || otherAttributes.value.some(([_, val]) => {
    return typeof val === 'string' && val.includes(`{{${key}}}`);
  });
  return rstCheck;
};

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
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
       @click="close">
    <div class="bg-white p-6 rounded shadow-lg w-1/2"
         @click.stop>
      <h2 class="text-lg font-bold mb-4">编辑提示词</h2>

      <div class="mb-2 flex items-center gap-2">
        <strong>名称:</strong>
        <input v-if="attributesEditState['name']"
               v-model="prompt.name"
               class="p-1 border rounded w73"
               :name="prompt.name" />
        <span v-else
              class="w73">
          {{ prompt.name }}
        </span>
        <EditButton :isEditing="attributesEditState['name']"
                    :onToggle="() => (attributesEditState['name'] = !attributesEditState['name'])" />
      </div>

      <div class="mb-4 flex items-center gap-2">
        <strong>描述:</strong>
        <input v-if="attributesEditState['desc']"
               v-model="prompt.desc"
               class="p-1 border rounded w73"
               :name="prompt.name" />
        <span v-else
              class="w73">
          {{ prompt.desc }}
        </span>
        <EditButton :isEditing="attributesEditState['desc']"
                    :onToggle="() => (attributesEditState['desc'] = !attributesEditState['desc'])" />
      </div>

      <!-- 主要内容编辑框 -->
      <textarea v-model="editedContent"
                @focus="attributesEditState['content'] = true"
                @blur="attributesEditState['content'] = false"
                rows="10"
                class="w-full p-2 border rounded font-mono text-sm resize-none"></textarea>

      <!-- 新建属性 -->
      <div class="flex  items-center gap-2 mt-2">
        <template v-if="showAddAttribute">
          <!-- 新建属性输入框 -->
          <input v-model="newAttributeKey"
                 placeholder="属性名"
                 class="p-1 border rounded w-32" />
          <input v-model="newAttributeValue"
                 placeholder="属性值"
                 class="p-1 border rounded w-64" />
          <button class="btn-def bg-blue-500 hover:bg-blue-600"
                  @click="addAttribute">
            添加
          </button>
          <button class="btn-def bg-red-500 hover:bg-red-600"
                  @click="showAddAttribute = false">
            取消
          </button>
        </template>
        <!-- 新建属性按钮 -->
        <button v-else
                class="btn-def bg-green-500 hover:bg-green-600"
                @click="showAddAttribute = true">
          新建属性
        </button>
      </div>

      <!-- 动态列出其他属性 -->
      <div v-if="otherAttributes.length"
           class="mt-4">
        <div v-for="[key, value] in otherAttributes"
             :key="key"
             class="mb-1 flex items-center gap-2">
          <strong :class="!isAttributeUsed(key) ? 'text-blue-500 font-bold' : ''">{{ key }}:</strong>
          <textarea v-if="attributesEditState[key]"
                    v-model="prompt[key]"
                    class="p-2 border rounded font-mono w-137"
                    :name="key"></textarea>
          <span v-else
                class="whitespace-nowrap overflow-clip text-ellipsis"
                :class="prompt[key] === '' ? 'w-50' : 'w-137'">
            {{ value }}
          </span>

          <!-- 如果属性值为空，显示重命名和删除按钮 -->
          <template v-if="prompt[key] === ''">
            <!-- 删除按钮 -->
            <button @click="deleteAttribute(key)"
                    class="btn-def bg-red-500 hover:bg-red-600 ml-2">
              删除
            </button>
          </template>

          <!-- 编辑按钮 -->
          <EditButton :isEditing="attributesEditState[key]"
                      :onToggle="() => (attributesEditState[key] = !attributesEditState[key])" />
          <!-- >>循环结束 -->
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-end gap-2 mt-4">
        <span>注：蓝色标记的属性为未使用状态；</span>
        <button @click="close"
                class="btn-def bg-gray-500 hover:bg-gray-600">取消</button>
        <button @click="save"
                class="btn-def bg-blue-500 hover:bg-blue-600">保存</button>
      </div>
    </div>
  </div>
</template>

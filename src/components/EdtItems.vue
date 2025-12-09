<script setup lang="ts">
import type { Item } from '@/jumon/indexParser';
import { computed, ref, watch } from 'vue';

const props = defineProps<{ items: Item[] }>();
const emit = defineEmits(['close', 'save']);

// 深拷贝到本地可编辑副本
const localItems = ref<Item[]>(JSON.parse(JSON.stringify(props.items || [])));
// 正在编辑的行索引
const editingIndex = ref<number | null>(null);

watch(
  () => props.items,
  (val) => {
    localItems.value = JSON.parse(JSON.stringify(val || []));
  },
  { deep: true },
);

function addItem() {
  // 新增一行到开头
  localItems.value.unshift({ name: '', content: '' });
  // localItems.value.push({ name: '', content: '' });
}

function deleteItem(index: number) {
  localItems.value.splice(index, 1);
}

const trimmedItems = computed(() =>
  localItems.value.map(it => ({ name: it.name?.trim() || '', content: it.content ?? '' })),
);

const duplicateNames = computed(() => {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const it of trimmedItems.value) {
    if (!it.name)
      continue;
    if (seen.has(it.name))
      dup.add(it.name);
    else seen.add(it.name);
  }
  return dup;
});

const hasError = computed(() => {
  // 不允许重复名称
  if (duplicateNames.value.size > 0)
    return true;
  // 名称为空但内容不空也视为错误
  return trimmedItems.value.some(it => !it.name && it.content.trim().length > 0);
});

function close() {
  emit('close');
}

function save() {
  if (hasError.value)
    return;
  editingIndex.value = null;
  // 过滤掉完全空行（name 与 content 都为空）
  const cleaned = trimmedItems.value.filter(it => it.name || it.content);
  emit('save', cleaned);
  emit('close');
}
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
      <div class="flex items-center justify-between gap-3">
        <h2 class="mb-4 text-lg font-bold">
          编辑变量
        </h2>
        <button
          class="mr-4 btn-def bg-green-500 hover:bg-green-600"
          @click="addItem"
        >
          新增一行
        </button>
      </div>

      <div class="mb-3 flex items-center">
        <div class="text-sm text-gray-600">
          <span
            v-if="duplicateNames.size > 0"
            class="text-red-600"
          >
            存在重复名称：
            <template
              v-for="name in Array.from(duplicateNames)"
              :key="name"
            >
              <code class="mx-1">{{ name }}</code>
            </template>
          </span>
        </div>
      </div>

      <div class="max-h-[60vh] overflow-auto">
        <div
          v-for="(it, idx) in localItems"
          :key="idx"
          class="flex items-start gap-5"
        >
          <!-- 名称 -->
          <div class="w-1/6 flex flex-col">
            <label class="mt-1 text-sm text-gray-700">名称</label>
            <input
              v-model="it.name"
              class="input-def p-2"
              :class="{ 'border-red-500': duplicateNames.has(it.name.trim()) }"
              placeholder="变量名"
            >
          </div>
          <!-- 值 -->
          <div class="w-4/6 flex flex-col">
            <label class="mt-1 text-sm text-gray-700">内容</label>
            <textarea
              v-model="it.content"
              class="resize-y input-def p-2"
              rows="3"
              placeholder="变量内容"
              @focus="editingIndex = idx"
            />
          </div>
          <div class="flex flex-col">
            <button
              v-if="localItems.length > 1 && !it.content"
              class="mt-6 btn-def bg-red-500 hover:bg-red-600"
              @click="deleteItem(idx)"
            >
              删除
            </button>
            <button
              v-else-if="editingIndex === idx" class="mt-6 btn-def bg-blue-500 hover:bg-blue-600"
              :disabled="hasError"
              @click="save"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      <div class="mt-5 flex items-center justify-end gap-2">
        <span class="mr-auto text-xs text-gray-500">提示：变量名需唯一；空行将被忽略；</span>
        <span class="mr-auto text-xl text-red-500">如需删除项请先清空其内容；</span>
        <button
          class="btn-def bg-gray-500 hover:bg-gray-600"
          @click="close"
        >
          取消
        </button>
        <button
          class="btn-def bg-blue-500 hover:bg-blue-600"
          :disabled="hasError"
          @click="save"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Item } from '@/jumon/indexParser';

const props = defineProps<{ items: Item[] }>();
const emit = defineEmits(['close', 'save']);

// 深拷贝到本地可编辑副本
const localItems = ref<Item[]>(JSON.parse(JSON.stringify(props.items || [])));

watch(
  () => props.items,
  (val) => {
    localItems.value = JSON.parse(JSON.stringify(val || []));
  },
  { deep: true }
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
  localItems.value.map((it) => ({ name: it.name?.trim() || '', content: it.content ?? '' }))
);

const duplicateNames = computed(() => {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const it of trimmedItems.value) {
    if (!it.name) continue;
    if (seen.has(it.name)) dups.add(it.name);
    else seen.add(it.name);
  }
  return dups;
});

const hasError = computed(() => {
  // 不允许重复名称
  if (duplicateNames.value.size > 0) return true;
  // 名称为空但内容不空也视为错误
  return trimmedItems.value.some((it) => !it.name && it.content.trim().length > 0);
});

function close() {
  emit('close');
}

function save() {
  if (hasError.value) return;
  // 过滤掉完全空行（name 与 content 都为空）
  const cleaned = trimmedItems.value.filter((it) => it.name || it.content);
  emit('save', cleaned);
  emit('close');
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
       @click="close">
    <div class="bg-white p-6 rounded shadow-lg w-1/2"
         @click.stop>
      <div class="flex gap-3 items-center justify-between">
        <h2 class="text-lg font-bold mb-4">编辑变量 Items</h2>
        <button class="btn-def bg-green-500 hover:bg-green-600 mr-4"
                @click="addItem">新增一行</button>
      </div>

      <div class="mb-3 flex items-center">
        <div class="text-sm text-gray-600">
          <span v-if="duplicateNames.size > 0"
                class="text-red-600">
            存在重复名称：
            <template v-for="name in Array.from(duplicateNames)"
                      :key="name">
              <code class="mx-1">{{ name }}</code>
            </template>
          </span>
        </div>
      </div>

      <div class="max-h-[60vh] overflow-auto">
        <div v-for="(it, idx) in localItems"
             :key="idx"
             class="flex gap-5 items-start">
          <!-- 名称 -->
          <div class="flex flex-col w-1/6">
            <label class="text-sm text-gray-700">名称</label>
            <input v-model="it.name"
                   class="mt-1 p-2 border rounded"
                   :class="{ 'border-red-500': duplicateNames.has(it.name.trim()) }"
                   placeholder="变量名" />
          </div>
          <!-- 值 -->
          <div class="flex flex-col w-4/6">
            <label class="text-sm text-gray-700">内容</label>
            <textarea v-model="it.content"
                      class="mt-1 p-2 border rounded font-mono resize-y"
                      rows="3"
                      placeholder="变量内容"></textarea>
          </div>
          <div class="flex flex-col">
            <button v-if="localItems.length > 1 && !it.content"
                    class="btn-def bg-red-500 hover:bg-red-600 mt-6"
                    @click="deleteItem(idx)">删除</button>
            <button v-else class="btn-def bg-blue-500 hover:bg-blue-600 mt-6"
                    :disabled="hasError"
                    @click="save">保存</button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 mt-5">
        <span class="text-xs text-gray-500 mr-auto">提示：变量名需唯一；空行将被忽略；</span>
        <span class="text-xl text-red-500 mr-auto">如需删除项请先清空其内容；</span>
        <button class="btn-def bg-gray-500 hover:bg-gray-600"
                @click="close">取消</button>
        <button class="btn-def bg-blue-500 hover:bg-blue-600"
                :disabled="hasError"
                @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

<script setup lang="ts">
import type { Config, Item, Prompt } from '@/jumon/indexParser';
import {
  NCollapse,
  NCollapseItem,
  NDrawer,
  NDrawerContent,
  NGrid,
  NGridItem,
  NLayout,
  NPopover,
  NSpace,
} from 'naive-ui';
import { onMounted, ref, watch } from 'vue';
import { fetchData, postData } from '@/base/invoke';
import EdtItems from '@/components/EdtItems.vue';
import EdtPrompts from '@/components/EdtPrompts.vue';
import {

  IndexParser,

} from '@/jumon/indexParser';

const configList = ref<Record<string, any>>({});
const selectedConfig = ref<string>('');

const curIndex = ref<Config>({
  items: [],
  prompts: [],
});

// 请求配置列表
// {"list": ["demo"],"default": "demo"}
function fetchConfigs() {
  fetchData('get-config-list', {}).then((res) => {
    console.log('Fetched Configs:', res);
    selectedConfig.value = res.default || '';
    configList.value = res;
  });
}

function fetchPrompts(configName = '') {
  console.log('----');
  fetchData('get-prompts', configName).then((res) => {
    console.log('Fetched Prompts:', res);
    curIndex.value = preProcessResult(res);
    generatePrompt();
  });
}

// 预解析 result
function preProcessResult(result: Config[] | Config) {
  const indexData: Config = {
    items: [],
    prompts: [],
  };
  // 如果 result 不是数组且有 items 和 prompts，直接返回
  if (!Array.isArray(result)) {
    indexData.items = result.items || [];
    indexData.prompts = result.prompts || [];
  }

  if (Array.isArray(result)) {
    result.forEach((el) => {
      if (el.items) {
        indexData.items = el.items || [];
      }
      if (el.prompts) {
        indexData.prompts = el.prompts || [];
      }
    });
  }
  return indexData;
}

// 排序修改
const sortType = ref<'name' | 'rnd'>('name');
function changeSort(to = '') {
  if (sortType.value === 'rnd' || to === 'name') {
    sortType.value = 'name';
  }
  else {
    sortType.value = 'rnd';
  }

  if (sortType.value === 'rnd') {
    curIndex.value.prompts?.sort(() => Math.random() - 0.5);
  }
  else {
    curIndex.value.prompts?.sort((a, b) => a.name.localeCompare(b.name));
  }
}

// 生成 Prompt
function generatePrompt(runSort: boolean = false) {
  const IndexProject = new IndexParser(curIndex.value);
  // 修改排序
  if (runSort) {
    changeSort();
  }
  curIndex.value.prompts?.forEach((prompt) => {
    const generated = IndexProject.generatePrompt(prompt.name);
    // console.log('Generated Prompt:', generated);
    prompt.result = generated;
  });
  console.log('Generated Config:', curIndex.value);
}

// 复制
async function copyPrompt(prompt: Prompt) {
  if (prompt.result) {
    try {
      await navigator.clipboard.writeText(prompt.result);
    }
    catch (error) {
      console.error('Failed to copy text: ', error);
    }
  }
}

onMounted(() => {
  fetchConfigs();
  fetchPrompts();
});

// 监听 selectedConfig 变化，重新加载 prompts
watch(selectedConfig, (newConfig, oldConfig) => {
  if (!oldConfig)
    return;
  if (newConfig) {
    fetchPrompts(newConfig);
  }
});

// 修改默认配置
const toChangeDef = ref(false);
function actChangeDef() {
  if (selectedConfig.value && selectedConfig.value !== configList.value?.default) {
    setDefConfig();
  }
  toChangeDef.value = false;
}

function setDefConfig() {
  postData('set-default-config', selectedConfig.value).then((res) => {
    console.log('Set Default Config:', res);
    configList.value.default = selectedConfig.value;
  });
}

// 添加配置
const toAddConfig = ref(false);
const configNameToAdd = ref('');
function addConfig() {
  if (!configNameToAdd.value)
    return;
  postData('add-config', configNameToAdd.value).then((res) => {
    console.log('Add Config:', res);
    toAddConfig.value = false;
    fetchConfigs();
    setTimeout(() => {
      selectedConfig.value = configNameToAdd.value;
      configNameToAdd.value = '';
    }, 500);
  });
}

// 删除配置
const toDeleteConfig = ref(false);
const configNameToDelete = ref('');
function deleteConfig() {
  const name = configNameToDelete.value;
  // 不能删除默认配置
  if (!name || name === configList.value.default)
    return;
  // 判断是否存在于列表中
  if (!configList.value.list.includes(name))
    return;
  // 如果删除的是当前配置，则切换到默认配置
  if (name === selectedConfig.value)
    selectedConfig.value = configList.value.default;
  postData('delete-config', name).then((res) => {
    console.log('Delete Config:', res);
    fetchConfigs();
    setTimeout(() => {
      toDeleteConfig.value = false;
      configNameToDelete.value = '';
    }, 500);
  });
}

// -----------------------------------------------------------------------

// 编辑全局变量
const showItemsEditor = ref(false);
function saveItems(items: Item[]) {
  // 更新当前视图数据
  curIndex.value.items = items;
  // 深拷贝并移除 prompts 中的 result 字段
  const plainData = JSON.parse(JSON.stringify(curIndex.value));
  plainData.prompts?.forEach((p: Prompt) => delete p.result);
  // 保存数据
  postData('save-prompts', plainData).then((res) => {
    console.log(res);
    generatePrompt();
  });
}

// 提示词编辑器
const showPromptEditor = ref(false);
const promptToEdit = ref<Prompt>({} as Prompt);

// 添加新提示词
function addPrompt() {
  const indexData = curIndex.value;
  const count = indexData.prompts.length + 1;
  const newPrompt: Prompt = {
    name: `p${count}`,
    desc: `新建提示词 p${count} 的描述`,
    content: '',
  };
  indexData.prompts.push(newPrompt);
  // 打开编辑器
  promptToEdit.value = newPrompt;
  showPromptEditor.value = true;
}

// 删除提示词
const toDeletePrompt = ref(false);
const promptNameToDelete = ref('');
function deletePrompt(name: string) {
  if (!name)
    return;
  const indexData = curIndex.value;
  const arrPrompts = indexData.prompts.filter(p => p.name === name);
  // 如果没有找到匹配项，显示警告
  if (arrPrompts.length === 0) {
    alert(`未找到名称为 "${name}" 的提示词`);
    return;
  }
  // 如果有重复值，弹出警告
  if (arrPrompts.length > 1) {
    alert(`存在重复的名称项，请重新命名 - ${name}`);
    return;
  }
  // 执行删除操作
  savePrompts('delete', arrPrompts[0]);
}

// 保存
type SavePromptsType = 'add' | 'edit' | 'delete'; // 实际添加新条目后通过编辑保存
function savePrompts(type: SavePromptsType, args: Prompt) {
  const indexData = curIndex.value;
  const index = indexData.prompts.findIndex(p => p.name === args.name);

  if (index !== -1 && type === 'edit') {
    indexData.prompts[index] = args;
    console.log('Edited Prompt:', args.name);
  }

  if (index !== -1 && type === 'delete') {
    indexData.prompts.splice(index, 1);
    toDeletePrompt.value = false;
    console.log('Deleted Prompt:', args.name);
  }

  changeSort('name');

  // 深拷贝并移除 prompts 中的 result 字段
  const plainData = JSON.parse(JSON.stringify(curIndex.value));
  plainData.prompts?.forEach((p: Prompt) => delete p.result);
  // 保存数据
  postData('save-prompts', plainData).then((res) => {
    console.log(res);
    generatePrompt();
  });
}

// -----------------------------------------------------------------------

// Drawer 相关状态
const drawerActive = ref(false);
const drawerPlacement = ref<'top' | 'right' | 'bottom' | 'left'>('right');
const drawerTitle = ref('变量列表');
</script>

<template>
  <NLayout content-class="px-3">
    <!-- 配置切换 -->
    <div class="mb-2 mr-8 flex items-center justify-end gap-3 bg-gray-100">
      <!-- 删除 -->
      <button
        v-if="!toDeleteConfig && !toAddConfig"
        class="btn-def bg-red-500 hover:bg-red-600"
        @click="toDeleteConfig = true"
      >
        删除配置项
      </button>
      <template v-if="toDeleteConfig">
        <label
          class="text-red-700 font-bold"
          for="toDeleteConfig"
        >删除配置：</label>
        <input
          v-model="configNameToDelete"
          type="text"
          class="input-def"
          placeholder="请输入要删除的配置项"
        >
        <button
          class="btn-def bg-red-500 hover:bg-red-600"
          @click="deleteConfig()"
        >
          确认
        </button>
        <button
          class="btn-def bg-gray-500 hover:bg-gray-600"
          @click="toDeleteConfig = false"
        >
          取消
        </button>
      </template>
      <!-- 添加 -->
      <button
        v-if="!toAddConfig && !toDeleteConfig"
        class="btn-def bg-blue-500 hover:bg-blue-600"
        @click="toAddConfig = true"
      >
        添加配置项
      </button>
      <template v-if="toAddConfig">
        <label
          class="text-blue-700 font-bold"
          for="toAddConfig"
        >新增配置：</label>
        <input
          v-model="configNameToAdd"
          type="text"
          class="input-def"
          placeholder="请输入新增配置项名称"
        >
        <button
          class="btn-def bg-blue-500 hover:bg-blue-600"
          @click="addConfig"
        >
          确认
        </button>
        <button
          class="btn-def bg-gray-500 hover:bg-gray-600"
          @click="toAddConfig = false"
        >
          取消
        </button>
      </template>
      <!-- checkbox 项 -->
      <div
        v-if="selectedConfig !== configList?.default"
        class="flex items-center gap-2"
      >
        <template v-if="!toChangeDef">
          <label
            class="flex items-center text-sm"
            for="toChangeDef"
          >设为默认：
            <input
              type="checkbox"
              name="toChangeDef"
              @change="toChangeDef = true"
            >
          </label>
        </template>
        <template v-else>
          <span class="text-sm font-bold">再次确认：</span>
          <button
            type="button"
            class="btn-def rounded bg-gray-600 px-2 py-1 text-sm hover:bg-gray-500"
            @click="toChangeDef = false"
          >
            取消
          </button>
          <button
            type="button"
            class="btn-def rounded bg-blue-500 px-2 py-1 text-sm hover:bg-blue-600"
            @click="actChangeDef"
          >
            确认
          </button>
        </template>
      </div>
      <label
        for="configSelect"
        class="mr-1 font-bold"
      >配置切换:</label>
      <select
        id="configSelect"
        v-model="selectedConfig"
        class="input-def"
      >
        <option
          v-for="config in configList?.list"
          :key="config"
          :value="config"
        >
          {{ config }}<span v-if="config === configList?.default">(默认)</span>
        </option>
      </select>
    </div>
    <!-- 控制条 -->
    <div class="btn-bar ml-2 flex items-center gap-2 py-2">
      <template v-if="!toDeletePrompt">
        <button
          class="btn-def bg-red-500 hover:bg-red-600"
          @click="toDeletePrompt = true"
        >
          删除提示词
        </button>
      </template>
      <template v-else>
        <select
          id="deletePrompt"
          name="deletePrompt"
          class="input-def"
          @change="promptNameToDelete = ($event.target as HTMLSelectElement).value"
        >
          <option value="">
            请选择要删除的提示词
          </option>
          <option
            v-for="(prompt, index) in curIndex.prompts"
            :key="index"
            :value="prompt.name"
          >
            {{ prompt.name }}
          </option>
        </select>
        <button
          class="btn-def bg-red-500 hover:bg-red-600"
          @click="deletePrompt(promptNameToDelete)"
        >
          确认
        </button>
        <button
          class="btn-def bg-gray-500 hover:bg-gray-600"
          @click="toDeletePrompt = false"
        >
          取消
        </button>
      </template>
      <button
        class="btn-def bg-blue-500 hover:bg-blue-600"
        @click="addPrompt()"
      >
        添加提示词
      </button>
      <button
        class="btn-def bg-purple-500 hover:bg-purple-600"
        @click="generatePrompt(true)"
      >
        切换排序
      </button>
      <button
        class="btn-def bg-green-500 hover:bg-green-600"
        @click="drawerActive = true"
      >
        全局变量
      </button>
    </div>
    <!-- 提示词列表 -->
    <NGrid
      v-if="curIndex && curIndex.prompts"
      :x-gap="16"
      :y-gap="16"
      cols="1 l:2 xl:3 2xl:4"
      responsive="screen"
    >
      <NGridItem
        v-for="(prompt, index) in curIndex.prompts"
        :key="index"
      >
        <div class="rounded-md bg-gray-200 px-5 py-3 shadow-sm">
          <div class="mb-1 flex items-center justify-between">
            <strong class="text-purple-700">{{ prompt.name }}</strong>
            <span class="text-sm text-gray-500">{{ prompt.desc }}</span>
            <NSpace justify="end">
              <button
                class="btn-def bg-yellow-500 hover:bg-yellow-600"
                @click="promptToEdit = prompt, showPromptEditor = true"
              >
                编辑
              </button>
              <button
                class="btn-def bg-blue-500 hover:bg-blue-600"
                @click="generatePrompt()"
              >
                重新生成
              </button>
              <!-- 复制 -->
              <NPopover trigger="click">
                <template #trigger>
                  <button
                    class="btn-def bg-green-500 hover:bg-green-600"
                    @click="copyPrompt(prompt)"
                  >
                    复制结果
                  </button>
                </template>
                <span>已复制</span>
              </NPopover>
            </NSpace>
          </div>
          <textarea
            :id="prompt.name"
            v-model="prompt.result"
            :name="prompt.name"
            rows="4"
            spellcheck="false"
            class="w-full resize-none input-def rounded-md p-2 text-sm font-mono"
            readonly
          />
          <div class="mt-1 h-fit overflow-clip whitespace-nowrap text-xs text-gray-600">
            原始内容：{{ prompt.content }}
          </div>
        </div>
      </NGridItem>
    </NGrid>
  </NLayout>

  <!-- Drawer for items viewing -->
  <NDrawer
    v-model:show="drawerActive"
    :default-width="640"
    :placement="drawerPlacement"
    resizable
  >
    <NDrawerContent :title="drawerTitle">
      <NLayout class="mb-4">
        <button
          class="btn-def bg-purple-500 hover:bg-purple-600"
          @click="showItemsEditor = true, drawerActive = false"
        >
          编辑变量
        </button>
      </NLayout>
      <NCollapse
        :default-expanded-names="['1']"
        :trigger-areas="['arrow', 'extra']"
      >
        <NCollapseItem
          v-for="(item, index) in curIndex.items"
          :key="index"
          :title="`{{${item.name}}}`"
          :name="index"
        >
          <template #header-extra>
            展开
          </template>
          <span class="text-gray-700">{{ item.content }}</span>
        </NCollapseItem>
      </NCollapse>
    </NDrawerContent>
  </NDrawer>

  <EdtItems
    v-if="showItemsEditor"
    :items="curIndex.items"
    @close="showItemsEditor = false, drawerActive = true"
    @save="saveItems"
  />

  <EdtPrompts
    v-if="showPromptEditor"
    :prompt="promptToEdit"
    @close="showPromptEditor = false"
    @save="savePrompts"
  />
</template>

<style scoped></style>

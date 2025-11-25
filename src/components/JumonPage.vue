<script setup lang="ts">
import { fetchData, postData } from '@/base/invoke';
import {
  IndexParser,
  type Config,
  type Item,
  type Prompt,
} from '@/jumon/indexParser';
import { ref, onMounted, watch } from 'vue';
import EdtItems from '@/components/EdtItems.vue';
import EdtPrompts from '@/components/EdtPrompts.vue';
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

const configList = ref<Record<string, any>>({});
const selectedConfig = ref<string>('');

const curIndex = ref<Config>({
  items: [],
  prompts: []
});

// 请求配置列表
// {"list": ["demo"],"default": "demo"}
const fetchConfigs = () => {
  fetchData('get-config-list', {}).then((res) => {
    console.log('Fetched Configs:', res);
    selectedConfig.value = res.default || '';
    configList.value = res;
  });
};

const fetchPrompts = (configName = "") => {
  console.log('----');
  fetchData('get-prompts', configName).then((res) => {
    console.log('Fetched Prompts:', res);
    curIndex.value = preProcessResult(res);
    generatePrompt();
  });
};

// 预解析 result
function preProcessResult(result: Config[] | Config) {
  const indexData: Config = {
    items: [],
    prompts: []
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
  } else {
    sortType.value = 'rnd';
  }

  if (sortType.value === 'rnd') {
    curIndex.value.prompts?.sort(() => Math.random() - 0.5);
  } else {
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
function copyPrompt(prompt: Prompt) {
  if (prompt.result) {
    navigator.clipboard.writeText(prompt.result);
  }
}

onMounted(() => {
  fetchConfigs();
  fetchPrompts();
});

// 监听 selectedConfig 变化，重新加载 prompts
watch(selectedConfig, (newConfig, oldConfig) => {
  if (!oldConfig) return;
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

const setDefConfig = () => {
  postData('set-default-config', selectedConfig.value).then((res) => {
    console.log('Set Default Config:', res);
    configList.value.default = selectedConfig.value;
  });
};

// -----------------------------------------------------------------------

// 编辑全局变量
const showItemsEditor = ref(false);
const saveItems = (items: Item[]) => {
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
type SavePromptsType = 'add' | 'edit' | 'delete';
// 实际添加新条目后通过编辑保存
const savePrompts = (type: SavePromptsType, args: Prompt) => {
  const indexData = curIndex.value;
  const index = indexData.prompts.findIndex((p) => p.name === args.name);

  if (index !== -1 && type === 'edit') {
    indexData.prompts[index] = args;
    console.log('Edited Prompt:', args.name);
  }

  if (index !== -1 && type === 'delete') {
    indexData.prompts.splice(index, 1);
    toDeletePrompt.value = false;
    console.log('Deleted Prompt:', args.name);
  }

  changeSort('name')

  // 深拷贝并移除 prompts 中的 result 字段
  const plainData = JSON.parse(JSON.stringify(curIndex.value));
  plainData.prompts?.forEach((p: Prompt) => delete p.result);
  // 保存数据
  postData('save-prompts', plainData).then((res) => {
    console.log(res);
    generatePrompt();
  });
};

function addPrompt() {
  const indexData = curIndex.value;
  const count = indexData.prompts.length + 1;
  const newPrompt: Prompt = {
    name: `p${count}`,
    desc: `新建提示词 p${count} 的描述`,
    content: "",
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
  if (!name) return;
  const indexData = curIndex.value;
  const arrPrompts = indexData.prompts.filter((p) => p.name === name);
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

// -----------------------------------------------------------------------

// Drawer 相关状态
const drawerActive = ref(false);
const drawerPlacement = ref<'top' | 'right' | 'bottom' | 'left'>('right');
const drawerTitle = ref('变量列表');

</script>

<template>
  <n-layout content-class="px-3">
    <!-- 配置切换 -->
    <div class="flex gap-2 mb-2 items-center justify-end bg-gray-100">
      <!-- checkbox 项 -->
      <div
        v-if="selectedConfig !== configList?.default"
        class="flex items-center gap-2 mr-4"
      >
        <template v-if="!toChangeDef">
          <label class="text-sm">设为默认
            <input
              type="checkbox"
              @change="toChangeDef = true"
            />
          </label>
        </template>
        <template v-else>
          <span class="text-sm font-bold">再次确认</span>
          <button
            type="button"
            class="btn-def bg-gray-600 hover:bg-gray-500 text-sm px-2 py-1 rounded"
            @click="toChangeDef = false"
          >
            取消
          </button>
          <button
            type="button"
            class="btn-def bg-blue-500 hover:bg-blue-600 text-sm px-2 py-1 rounded"
            @click="actChangeDef"
          >
            确认
          </button>
        </template>
      </div>
      <label
        for="configSelect"
        class="mr-2 font-bold"
      >配置切换:</label>
      <select
        id="configSelect"
        class="input-def  mr-8"
        v-model="selectedConfig"
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
    <div class="flex gap-2 py-2 ml-2 btn-bar items-center">
      <template v-if="!toDeletePrompt">
        <button
          @click="toDeletePrompt = true"
          class="btn-def bg-red-500 hover:bg-red-600"
        >删除提示词</button>
      </template>
      <template v-else>
        <select
          name="deletePrompt"
          id="deletePrompt"
          class="input-def"
          @change="promptNameToDelete = ($event.target as HTMLSelectElement).value"
        >
          <option value="">请选择要删除的提示词</option>
          <option
            v-for="(prompt, index) in curIndex.prompts"
            :key="index"
            :value="prompt.name"
          >
            {{ prompt.name }}
          </option>
        </select>
        <button
          @click="deletePrompt(promptNameToDelete)"
          class="btn-def bg-red-500 hover:bg-red-600"
        >确认</button>
        <button
          @click="toDeletePrompt = false"
          class="btn-def bg-gray-500 hover:bg-gray-600"
        >取消</button>
      </template>
      <button
        @click="addPrompt()"
        class="btn-def bg-blue-500 hover:bg-blue-600"
      >添加提示词</button>
      <button
        @click="generatePrompt(true)"
        class="btn-def bg-purple-500 hover:bg-purple-600"
      >切换排序</button>
      <button
        @click="drawerActive = true"
        class="btn-def bg-green-500 hover:bg-green-600"
      >全局变量</button>
    </div>
    <!-- 提示词列表 -->
    <n-grid
      :x-gap="16"
      :y-gap="16"
      cols="1 l:2 xl:3 2xl:4"
      responsive="screen"
      v-if="curIndex && curIndex.prompts"
    >
      <n-grid-item
        v-for="(prompt, index) in curIndex.prompts"
        :key="index"
      >
        <div class="px-5 py-3 bg-gray-200 shadow-sm rounded-md">
          <div class="flex items-center mb-1 justify-between">
            <strong class="text-purple-700">{{ prompt.name }}</strong>
            <span class="text-gray-500 text-sm">{{ prompt.desc }}</span>
            <n-space justify="end">
              <button
                @click="promptToEdit = prompt, showPromptEditor = true"
                class="btn-def bg-yellow-500 hover:bg-yellow-600"
              >编辑</button>
              <button
                @click="generatePrompt()"
                class="btn-def bg-blue-500 hover:bg-blue-600"
              >重新生成</button>
              <!-- 复制 -->
              <n-popover
                trigger="click"
              >
                <template #trigger>
                  <button
                    @click="copyPrompt(prompt.result)"
                    class="btn-def bg-green-500 hover:bg-green-600"
                  >复制结果</button>
                </template>
                <span>已复制</span>
              </n-popover>
            </n-space>
          </div>
          <textarea
            :name="prompt.name"
            :id="prompt.name"
            rows="4"
            spellcheck="false"
            class="input-def font-mono w-full p-2 text-sm resize-none rounded-md"
            readonly
          >{{ prompt.result }}</textarea>
          <div class="text-gray-600 text-xs mt-1 overflow-clip whitespace-nowrap h-fit">原始内容：{{ prompt.content }}</div>
        </div>
      </n-grid-item>
    </n-grid>
  </n-layout>

  <!-- Drawer for items viewing -->
  <n-drawer
    v-model:show="drawerActive"
    :default-width="640"
    :placement="drawerPlacement"
    resizable
  >
    <n-drawer-content :title="drawerTitle">
      <n-layout class="mb-4">
        <button
          @click="showItemsEditor = true, drawerActive = false"
          class="btn-def bg-purple-500 hover:bg-purple-600"
        >编辑变量</button>
      </n-layout>
      <n-collapse
        :default-expanded-names="['1']"
        :trigger-areas="['arrow', 'extra']"
      >
        <n-collapse-item
          v-for="(item, index) in curIndex.items"
          :key="index"
          :title="`{{${item.name}}}`"
          :name="index"
        >
          <template #header-extra>
            展开
          </template>
          <span class="text-gray-700">{{ item.content }}</span>
        </n-collapse-item>
      </n-collapse>
    </n-drawer-content>
  </n-drawer>

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

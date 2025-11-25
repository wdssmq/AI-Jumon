<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent, NLayoutFooter, NMenu, NFlex, NText } from 'naive-ui'
import JumonPage from '@/components/JumonPage.vue'
import ConfigPage from '@/components/ConfigPage.vue'

// 侧边栏折叠状态
const collapseRef = ref(true)

// 当前视图
const currentView = ref('jumon')

// 菜单选项
const menuOptions = computed(() => [
  {
    label: 'jumon',
    key: 'jumon',
    icon: renderIcon('jumon')
  },
  {
    label: 'Config',
    key: 'config',
    icon: renderIcon('config')
  }
])

// 渲染图标（简化版本）
function renderIcon(name: string) {
  const bgCls = currentView.value === name ? 'bg-green-800' : 'bg-gray-500'
  return () => h('div', {
    class: `w-6 h-6 rounded ${bgCls} flex items-center justify-center`,
  }, name.charAt(0).toUpperCase())
}

// 处理菜单选择
function handleMenuSelect(key: string) {
  currentView.value = key
}

</script>

<template>
  <NLayout has-sider>
    <!-- 侧栏菜单 -->
    <NLayoutSider
      bordered
      collapse-mode="width"
      :width="170"
      @update:collapsed="collapseRef = $event"
      :default-collapsed="collapseRef"
      show-trigger="bar"
    >
      <NFlex
        vertical
        justify="center"
        class="p-5"
        v-if="!collapseRef"
      >
        <NText
          strong
          class="text-base"
        >
          Main Page
        </NText>
      </NFlex>
      <NMenu
        :options="menuOptions"
        :value="currentView"
        @update:value="handleMenuSelect"
        :collapsed-icon-size="22"
        class="mt-2"
      />
    </NLayoutSider>

    <!-- 主内容区域 -->
    <NLayoutContent content-style="height: calc(100vh - 24px);" content-class="overflow-y-auto p-3">
      <JumonPage v-if="currentView === 'jumon'" />
      <ConfigPage v-else-if="currentView === 'config'" />
    </NLayoutContent>
  </NLayout>
  <!-- 状态栏 -->
  <NLayoutFooter
    bordered
    class="h-6"
  >
    <div class="h-full flex items-center justify-center text-xs">
      状态栏
    </div>
  </NLayoutFooter>
</template>

<style scoped>
/* 可以添加一些自定义样式 */
</style>

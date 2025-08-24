<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
// 保存计数到 electron-store
const sendCount = () => {
  // @ts-ignore
  window.ipcRenderer.send('click-count', count.value)
}
// 查询计数
const getCount = () => {
  // @ts-ignore
  window.ipcRenderer.invoke<number>('get-click-count').then(value => {
    count.value = value
  })
}
onMounted(() => {
  getCount()
})
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <button type="button" @click="sendCount">Send Count</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>

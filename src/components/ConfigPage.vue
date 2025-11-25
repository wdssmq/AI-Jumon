<script setup lang="ts">
import { onMounted, ref } from 'vue';

const storagePath = ref('');
async function fetchStoragePath() {
  const path = await window.ipcRenderer.invoke('get-storage-path');
  storagePath.value = path;
}

onMounted(() => {
  fetchStoragePath();
});
</script>

<template>
  <div>
    <h1>Config Page</h1>
    <p>存储路径: {{ storagePath }}</p>
  </div>
</template>

<style scoped>

</style>

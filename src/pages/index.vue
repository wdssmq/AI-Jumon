<script setup lang="ts">
import { useRouter } from 'vue-router'
import JumonList from '@/components/JumonList.vue'
const router = useRouter()
function goToAbout() {
  router.push('/about')
}
</script>
<template>
  <header class="flex items-center justify-between px-3">
    <h2>HomeView</h2>
    <div>
      <button @click="goToAbout">Go to About</button>
    </div>
  </header>
  <JumonList />

</template>

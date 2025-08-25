<script setup lang="ts">
import { useRouter } from 'vue-router'
import JumonList from '@/components/JumonList.vue'
const router = useRouter()
function goToAbout() {
  router.push('/about')
}
</script>
<template>
  <h2>HomeView</h2>
  <JumonList />
  <button class="btn-rt" @click="goToAbout">Go to About</button>
</template>

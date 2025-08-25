<script setup lang="ts">
import HelloWorld from '@/components/HelloWorld.vue'
import { useRouter } from 'vue-router'
const router = useRouter()
function goIndex() {
  router.push('/')
}
</script>
<template>
  <h2>AboutView</h2>
  <HelloWorld msg="Vite + Vue" />
  <button class="btn-rt" @click="goIndex">Go to Index</button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
function goIndex() {
  router.push('/')
}
</script>
<template>
  <h2>AboutView</h2>
  <button @click="goIndex">Go to Index</button>
</template>
<template>
  <div class="about">
    <Signup/>
  </div>
</template>

<script setup>
  import Signup from '@/components/Signup.vue';
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>

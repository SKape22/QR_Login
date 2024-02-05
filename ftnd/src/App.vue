<script setup>
import { RouterLink, RouterView } from 'vue-router'
import Nav from './components/Nav.vue'
</script>

<template>

    <div class="wrapper">
      <div>
        <Nav/>
      </div>
      
      <RouterView />
    </div>
</template>


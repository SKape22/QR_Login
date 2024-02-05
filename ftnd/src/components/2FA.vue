<template>
    <div class="flex flex-col flex-nowrap content gap-56 center justify-center items-center pt-12 my-5">
      <div class="flex flex-col flex-nowrap content gap-5 center justify-center items-center">
        <h1 class="pt-8 text-2xl">Enhance Your Account Security</h1>
        <p class="px-28 py-6">
          Two-Factor Authentication (2FA) adds an extra layer of security to your account by requiring
          verification from a secondary device or method. Would you like to enable 2FA?
        </p>
      </div>
      <div class="flex flex-col flex-nowrap content gap-5 center justify-center items-center">
        <button class="px-6 w-1/2 py-5 text-sm font-bold leading-non transition duration-300 md:w-96 text-white rounded-2xl hover:bg-blue-400 focus:ring-4 focus:ring-indigo-500 bg-blue-500" @click="TwoFactor.enable2FA">Enable 2FA</button>
        <span class="underline hover:underline-offset-2 hover:cursor-pointer"><RouterLink to="/">Skip for now</RouterLink></span>
      </div>
    </div>
  </template>

<script setup>
  import { RouterLink } from 'vue-router';
  import { use2faStore } from '@/stores/Auth'

  const TwoFactor = use2faStore();

</script>
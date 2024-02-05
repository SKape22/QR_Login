<template>
  <div class="flex flex-col items-center gap-5 flex-nowrap pt-12 my-5">
    <div v-if="!(Login.is2faEnabled)" class="flex flex-col items-center gap-5 flex-nowrap">
        <h1 class="pt-8 text-2xl">Set Up Two-Factor Authentication</h1>
        <p class="px-20 pt-3">
            Scan the QR code with your authenticator app and enter the 6-digit code to complete
            Two-Factor Authentication setup.
        </p>
        
        <img class="h-80 w-80" :src="TwoFactor.qrCode" alt="QR Code" />
    </div >
    <div v-else class="flex flex-col items-center gap-5 flex-nowrap">
        <h1 class="pt-8 text-2xl">Enter your Verification Code</h1>
        <p class="px-20 pt-3">Enter the verification code from your authenticator app</p>
    </div>
    <div class="w-1/4 sm:w-1/3">
        <input class="flex items-center w-full px-5 py-4 mb-5 mr-2 text-sm font-medium outline-none focus:bg-gray-300 placeholder:text-gray-700 bg-gray-200 text-dark-gray-900 rounded-2xl border" v-model="TwoFactor.code" type="text" maxlength="6" placeholder="Enter 6-digit code" />
    </div>
    <div class="w-1/5">
        <button class="px-6 w-full py-5 text-sm font-bold leading-non transition duration-300 text-white rounded-2xl hover:bg-blue-400 focus:ring-4 focus:ring-indigo-500 bg-blue-500" @click="TwoFactor.verify2FA">Next</button>
    </div>
  </div>
</template>

<script setup>
  import { use2faStore, useLoginStore } from '@/stores/Auth'

  const TwoFactor = use2faStore();
  const Login = useLoginStore();

</script>
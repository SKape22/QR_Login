<template>
    <div class="container flex flex-col mx-auto bg-white rounded-lg pt-12 my-5">
      <div class="flex justify-center w-full h-full my-auto xl:gap-14 lg:justify-normal md:gap-5 draggable">
        <div class="flex items-center justify-center w-full lg:p-12">
          <div class="flex items-center xl:p-10">
            <form @submit.prevent="Signup.handleSignup" class="flex flex-col w-full h-full pb-6 text-center bg-white rounded-3xl">
              <h3 class="mb-6 text-4xl font-extrabold text-dark-gray-900">Sign In</h3>
              <input id="username" v-model="Signup.username" type="text" placeholder="Enter your username" class="flex items-center w-full px-5 py-4 mr-2 text-sm font-medium outline-none focus:bg-gray-300 mb-5 placeholder:text-gray-700 bg-gray-200 text-dark-gray-900 rounded-2xl"/>
              <input id="email" v-model="Signup.email" type="email" placeholder="Enter your email" class="flex items-center w-full px-5 py-4 mr-2 text-sm font-medium outline-none focus:bg-gray-300 mb-5 placeholder:text-gray-700 bg-gray-200 text-dark-gray-900 rounded-2xl"/>
              <input id="password" v-model="Signup.password" type="password" placeholder="Enter your password" class="flex items-center w-full px-5 py-4 mb-5 mr-2 text-sm font-medium outline-none focus:bg-gray-300 placeholder:text-gray-700 bg-gray-200 text-dark-gray-900 rounded-2xl border"/>
              <input id="re_password" v-model="Signup.rePassword" type="password" placeholder="Confirm password" class="flex items-center w-full px-5 py-4 mb-5 mr-2 text-sm font-medium outline-none focus:bg-gray-300 placeholder:text-gray-700 bg-gray-200 text-dark-gray-900 rounded-2xl border"/>

            <button class="w-full px-6 py-5 mb-5 text-sm font-bold leading-non transition duration-300 md:w-96 text-white rounded-2xl hover:bg-blue-400 focus:ring-4 focus:ring-indigo-500 bg-blue-500">Sign In</button>
            <p class="text-sm leading-relaxed text-gray-600">Already registered? <RouterLink to="/login" class="font-bold text-gray-600 hover:text-gray-500">Login</RouterLink></p>
            <p class="text-sm leading-relaxed text-gray-600">Signup using <RouterLink to="/signup-webauthn" class="font-bold text-gray-600 hover:text-gray-500">Webauthn</RouterLink></p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
  import { useSignupStore } from '@/stores/Auth';
  import { RouterLink } from 'vue-router';

  const Signup = useSignupStore();


</script>


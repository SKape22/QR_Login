<template>
    <div>
        <nav class="border-gray-300 text-gray-200 flex flex-row justify-between bg-slate-500 px-2 py-2.5 sm:px-4">
          <RouterLink class="hover:text-white" to="/">Home</RouterLink>
          <div v-if="!(Login.isLogin)" class="flex gap-5 flex-row">
            <RouterLink class="hover:text-white" to="/login">Login</RouterLink>
            <RouterLink class="hover:text-white" to="/signup">Signup</RouterLink>
          </div>
          <button v-else @click="Login.handleLogout">LogOut</button>
        </nav>
    </div>
</template>
 
<script setup>
  import { RouterLink } from 'vue-router';
  import { useLoginStoreWebauthn } from '@/stores/Webauthn';

  const Login = useLoginStoreWebauthn();
  // const reRenderFlag = ref(0);
  // const login_user = ref(JSON.parse(localStorage.getItem('QR-Login_user')));
  // const isLoggedIn = ref(!!login_user.value);

  // async function handleLogout() {
  //   // console.log(login_user.value);
  //   const accessToken = login_user.value.accessToken;
  //   // console.log(accessToken)
  //   const header = {'Authorization': `Bearer ${accessToken}`};
  //   // console.log(header);
  //   try {
  //     await axios.delete('http://localhost:3000/api/v1/users/logout', {headers: header})
  //     console.log('Logout Successful');
  //     localStorage.removeItem('QR-Login_user');
  //     reRenderFlag.value +=1;
  //   } catch(err) {
  //     console.error('Error',err);
  //   }
  //   console.log(login_user.value);
  // }

</script>


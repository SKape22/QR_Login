import { ref, computed, toRaw } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router';
import axios from 'axios';
import { client } from '@passwordless-id/webauthn';

async function generateChallenge() {
  try {
    const response = await axios.get('http://localhost:3000/api/v1/users/challenge');
    return response.data;
  } catch (err) {
    console.error('Error fetching challenge:', err);
  }
}

export const useSignupStoreWebauthn = defineStore('signup-webauthn', () => {
  const username = ref('');
  const email = ref('');
  const password = ref('');
  const rePassword = ref('');
  const isValid = ref(true);
  const challenge = ref(null)
  
  const validate = computed(() => {
    if (password.value !== rePassword.value) {
      isValid.value = false;
      return false;
    }
    return true;
  })

  async function handleSignupWA() {
    if (validate) {
      const fetchedChallenge = await generateChallenge();
      challenge.value = fetchedChallenge;

      const registration = await client.register(
        username.value,
        challenge.value, {
          authenticatorType: "extern",
          userVerification: "required",
          timeout: 60000,
          attestation: true,
          debug: false
        }
      )

      console.debug(registration)
      const payload = {
        username: username.value,
        challenge: challenge.value,
        email: email.value,
        password: password.value,
      }
      await axios
        .post('http://localhost:3000/api/v1/users/signup-webauthn', payload)
        .then((res) => {
          if (res.data.status === true) {
            isValid.value = true;
            router.push('/login-webauthn');
        }
        })
        .catch(err => {
          console.error('Error:', err)
        })
    } else {
      console.log("passwords mismatch ")
    }
  }
  
  return { username, email, password, rePassword, challenge, handleSignupWA }
})


// export const useLoginStore = defineStore('login', () => {
//   const username = ref('');
//   const password = ref('');
//   const storedUserData = JSON.parse(localStorage.getItem('QR-Login_user')) || {};
//   const isLogin = ref(!!storedUserData.username);
//   const is2faEnabled = ref(!!storedUserData.is2faEnabled);
  
//   console.log(is2faEnabled)
//   async function handleLogin() {
//     const payload = {
//       username: username.value,
//       password: password.value
//     }
//     await axios
//       .post('http://localhost:3000/api/v1/users/login', payload)
//       .then((res) => {
//         console.log(res)
//         console.log(res.data.accessToken);
//         if (res.data.status) {
//           const user = {
//             username: username.value,
//             accessToken: res.data.accessToken,
//             is2faEnabled: res.data.is_2fa_enabled
//           }
//           localStorage.setItem('QR-Login_user', JSON.stringify(user))
//           isLogin.value = true;

//           username.value = '';
//           password.value = '';
//           is2faEnabled.value = !!storedUserData.is2faEnabled;
//           console.log(res.data)
//           if (res.data.is_2fa_enabled)
//             router.push('/verify2FA');

//           else
//             router.push('/enable2FA');
//         }
//       })
//       .catch(err => {
//         console.error('Error:', err)
//       })
//     } 
    
//   async function handleLogout() {
//     const login_user = ref(JSON.parse(localStorage.getItem('QR-Login_user')));
//     const accessToken = login_user.value.accessToken;
//     const header = {'Authorization': `Bearer ${accessToken}`};
    
//     try {
//       await axios.delete('http://localhost:3000/api/v1/users/logout', {headers: header})
//       console.log('Logout Successful');
//       localStorage.removeItem('QR-Login_user');
//       router.push('/');
//       isLogin.value = false;
//     } catch(err) {
//       console.error('Error',err);
//     }
//   }
    
//   return { username, password, isLogin, is2faEnabled, handleLogin, handleLogout }
// })

// export const use2faStore = defineStore('2FA', () => {
//   const code = ref('');
//   const qrCode = ref('');
  
//   async function enable2FA() {
//     const login_user = ref(JSON.parse(localStorage.getItem('QR-Login_user')));
//     const accessToken = login_user.value.accessToken;
//     const username = login_user.value.username;
    
//     const payload = {
//       username: username
//     }

//     const header = {'Authorization': `Bearer ${accessToken}`};

//     await axios
//       .post('http://localhost:3000/api/v1/users/enable2FA', payload, {headers: header})
//       .then((res) => {
//         console.log(res)
//         if (res.data.status) {
//           qrCode.value = res.data.qr;
//           router.push('/verify2FA')
//         }
//       })
//       .catch(err => {
//         console.error('Error:', err)
//       })
//     }

//     async function verify2FA() {
//       const login_user = ref(JSON.parse(localStorage.getItem('QR-Login_user')));
//       const accessToken = login_user.value.accessToken;
//       const username = login_user.value.username;
      
//       const payload = {
//         username: username,
//         code: code.value
//       }
//       const header = {'Authorization': `Bearer ${accessToken}`};

//       await axios
//       .post('http://localhost:3000/api/v1/users/verify2FA', payload, {headers: header})
//       .then((res) => {
//         console.log(res)
//         if (res.data.status) {
//           router.push('/')
//         }
//       })
//       .catch(err => {
//         console.error('Error:', err)
//       })
//     }

//     return { code, qrCode, enable2FA, verify2FA }
// })
import { ref, computed, toRaw } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router';
import axios from 'axios';
import { client } from '@passwordless-id/webauthn';
import { v4 as uuidv4 } from 'uuid'

async function generateChallenge(sessionID) {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/users/challenge', { sessionID });
    return response.data;
  } catch (err) {
    console.error('Error fetching challenge:', err);
  }
}

async function generateSession() {
  return uuidv4();
}

async function getCredentialID(username) {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/users/credential', {username});
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
  const session = ref(null)
  const validate = computed(() => {
    if (password.value !== rePassword.value) {
      isValid.value = false;
      return false;
    }
    return true;
  })

  async function handleSignupWA() {
    if (validate) {
      const fetchedSession = await generateSession();
      const fetchedChallenge = await generateChallenge(fetchedSession);

      session.value = fetchedSession
      challenge.value = fetchedChallenge;
      
      console.log(session.value)
      let registration = await client.register(
        username.value,
        challenge.value, {
          authenticatorType: "roaming",
          // userVerification: "required",
          timeout: 60000,
          // attestation: true,
          // debug: false
        }
      )
      
      console.log(registration)
      console.log("challenege", challenge.value);
      
      const payload = {
        username: username.value,
        challenge: challenge.value,
        email: email.value,
        password: password.value,
        sessionID: session.value,
        registration: registration,
      }

      await axios
        .post('http://localhost:3000/api/v1/users/signup-webauthn', payload)
        .then((res) => {
          console.log("result" , res)
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


export const useLoginStoreWebauthn = defineStore('login-webauthn', () => {
  const username = ref('');
  const password = ref('');
  const storedUserData = JSON.parse(localStorage.getItem('QR-Login_user')) || {};
  const isLogin = ref(!!storedUserData.username);
  const challenge = ref(null)

  const is2faEnabled = ref(!!storedUserData.is2faEnabled);
  
  // console.log(is2faEnabled)
  async function handleLogin() {
    const fetchedSession = await generateSession();
    const fetchedChallenge = await generateChallenge(fetchedSession);

    const credential = await getCredentialID(username.value);

    console.log(credential);

    let auth = await client.authenticate(
      [credential] ,
      fetchedChallenge, {
      authenticatorType: 'roaming',
      // userVerification: 'required,'
      timeout: 60000,
    })

    console.log(auth)

    const payload = {
      username: username.value,
      challenge: challenge.value,
      password: password.value,
      authentication: auth,
      sessionID: fetchedSession,
    }

    await axios
    .post('http://localhost:3000/api/v1/users/login-webauthn', payload)
    .then((res) => {
      if (res.data.status === true) {
        // isValid.value = true;
        router.push('/success');
    }
    })
    .catch(err => {
      console.error('Error:', err)
    })




  
    } 
    
  async function handleLogout() {
    const login_user = ref(JSON.parse(localStorage.getItem('QR-Login_user')));
    const accessToken = login_user.value.accessToken;
    const header = {'Authorization': `Bearer ${accessToken}`};
    
   
  }
    
  return { username, password, isLogin, is2faEnabled, challenge, handleLogin, handleLogout }
})


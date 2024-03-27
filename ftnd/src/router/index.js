import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import("../components/Home.vue")
    },
    {
      path: '/success',
      name: 'success',
      component: () => import("../components/LoginSuccess.vue")
    },
    // {
    //   path: '/login',
    //   name: 'login',
    //   component: () => import("../components/Login.vue")
    // },
    // {
    //   path: '/signup',
    //   name: 'Signup',
    //   component: () => import("../components/Signup.vue")
    // },
    // {
    //   path: '/enable2FA',
    //   name: 'Enable 2-Factor Authentication',
    //   component: () => import("../components/2FA.vue") 
    // },
    // {
    //   path: '/verify2FA',
    //   name: 'Verify 2-Factor Authentication',
    //   component: () => import ("../components/verify2FA.vue")
    // },
    {
      path: '/login-webauthn',
      name: 'login using webauthn',
      component: () => import ("../components/Login_webauthn.vue")
    },
    {
      path: '/signup-webauthn',
      name: 'signup using webauthn',
      component: () => import ("../components/Signup_webauthn.vue")
    },
    // {
    //   path: ''
    // }
  ]
})

export default router

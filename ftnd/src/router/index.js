import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import SignupPage from '../pages/SignupPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import("../components/Home.vue")
    },
    {
      path: '/login',
      name: 'login',
      component: () => import("../components/Login.vue")
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import("../components/Signup.vue")
    },
    {
      path: '/enable2FA',
      name: 'Enable 2-Factor Authentication',
      component: () => import("../components/2FA.vue") 
    },
    {
      path: '/verify2FA',
      name: 'Verify 2-Factor Authentication',
      component: () => import ("../components/verify2FA.vue")
    }
  ]
})

export default router

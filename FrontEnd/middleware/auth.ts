export default defineNuxtRouteMiddleware((to, from) => {
  if (process.client) {
    const token = localStorage.getItem('authToken') || null
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null

    if (!token && to.path !== '/') {
      return navigateTo('/')
    }

    if (token && to.path === '/') {
      if (user?.role === 'STAFF') {
        return navigateTo('/pet')
      } else {
        return navigateTo('/admin')
      }
    }
  }
  // ฝั่ง server หรืออื่น ๆ ปล่อยผ่าน
})

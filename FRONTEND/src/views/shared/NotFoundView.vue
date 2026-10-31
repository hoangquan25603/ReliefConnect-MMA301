<template>
  <div class="not-found">
    <div class="not-found__content">
      <p class="not-found__code">404</p>
      <h1 class="not-found__title">Trang không tồn tại</h1>
      <p class="not-found__desc">Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      <router-link to="/home" class="not-found__btn">Về trang chủ</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f0f2f5;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
.not-found__content { text-align: center; }
.not-found__code {
  font-size: 120px;
  font-weight: 900;
  color: #e27d24;
  line-height: 1;
  margin: 0;
}
.not-found__title {
  font-size: 28px;
  font-weight: 700;
  color: #1a3b5c;
  margin: 12px 0 8px;
}
.not-found__desc { font-size: 15px; color: #4a5568; margin: 0 0 28px; }
.not-found__btn {
  display: inline-block;
  padding: 12px 28px;
  background: #1a4f8d;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.2s;
}
.not-found__btn:hover { background: #123766; }
</style>

<template>
  <div style="padding: 16px; font-size: 15px;">
    <div style="margin-bottom: 14px; padding: 8px; background: #f5f7fa; border-radius: 6px;">
      导航：
      <RouterLink to="/home">首页</RouterLink> |
      <RouterLink to="/test?id=123&name=手机">测试页(带参)</RouterLink> |
      <RouterLink to="/manage/user">后台-用户</RouterLink> |
      <RouterLink to="/manage/goods">后台-商品</RouterLink>
    </div>
    <RouterView />
  </div>
</template>

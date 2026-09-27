<template>
  <div style="border: 1px solid #f1db71; background: #FFED97; padding: 12px; border-radius: 8px;">
    这是父级页面（后台管理）
    <div><RouterLink to="/manage/user">用户管理</RouterLink></div>
    <div><RouterLink to="/manage/goods">商品管理</RouterLink></div>
    <div><RouterLink to="/manage/orders">订单管理</RouterLink></div>
    <div style="background: #E8FFF5; padding: 12px; margin-top: 8px; border-radius: 6px;">
      <RouterView />
    </div>
  </div>
</template>

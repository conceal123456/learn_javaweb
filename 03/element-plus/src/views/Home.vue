<template>
  <div style="padding: 20px;">
    <h2>实训3 Element Plus 配置验证 + 图标颜色对比</h2>

    <!-- 安装是否成功：一个 Element Plus 按钮 -->
    <p>安装验证：下面这个按钮能正常显示，说明 Element Plus 配置成功</p>
    <el-button type="primary">Element Plus 按钮</el-button>
    <el-button type="success">主要按钮</el-button>
    <hr />

    <h3>图标颜色：老师原版 #6666 vs 修正 #666666</h3>
    <div style="display: flex; gap: 60px;">
      <div>
        <p>老师原版 color="#6666"（4位，被当半透明，偏淡）</p>
        <span style="color: #6666">
          <el-icon :size="60" color="#6666"><School /></el-icon> 安中医
        </span>
      </div>
      <div>
        <p>修正版 color="#666666"（正常中灰）</p>
        <span style="color: #666666">
          <el-icon :size="60" color="#666666"><School /></el-icon> 安中医
        </span>
      </div>
    </div>
    <hr />

    <RouterLink to="/comp">去看实训4 组件页 =-</RouterLink>
  </div>
</template>

<script setup>
</script>

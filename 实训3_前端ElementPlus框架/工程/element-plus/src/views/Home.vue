<template>
  <div style="padding: 20px;">
    <h2>实训3 Element Plus 配置验证 + 图标颜色对比</h2>

    <!-- 安装是否成功：多种 type 的按钮，能正常显示说明 Element Plus 配置成功 -->
    <p>安装验证：下面这些按钮能正常显示，说明 Element Plus 配置成功</p>
    <el-button>默认按钮</el-button>
    <el-button type="primary">主要按钮</el-button>
    <el-button type="success">成功按钮</el-button>
    <el-button type="warning">警告按钮</el-button>
    <el-button type="danger">危险按钮</el-button>
    <el-button type="info">信息按钮</el-button>
    <p style="margin-top: 10px">朴素/plain 与圆角/round 变体：</p>
    <el-button type="primary" plain>plain 朴素</el-button>
    <el-button type="success" round>round 圆角</el-button>
    <el-button type="danger" disabled>disabled 禁用</el-button>
    <el-button type="primary" link>link 链接</el-button>
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

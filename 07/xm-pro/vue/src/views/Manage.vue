<template>
  <!-- 第一步：页面整体最外层容器 -->
  <div>
    <!-- 第二步：顶部头部整行容器 -->
    <div style="height: 60px; background-color: #3c7fff; display: flex; align-items: center">
      <!-- 头部左侧：网站 logo -->
      <div style="width: 200px; display: flex; align-items: center; padding-left: 15px">
        <span style="font-size: 22px; color: white">网站 logo</span>
      </div>
      <!-- 头部中间空白占位 -->
      <div style="flex: 1"></div>
      <!-- 头部右侧：后台用户 (已替换) -->
      <div style="width: fit-content; display: flex; align-items: center; padding-right: 15px">
        <span style="color: white">王陈飞 2024207335102</span>
      </div>
    </div>

    <!-- 第三步：左右分栏父容器 + 左侧导航栏 -->
    <div style="display: flex">

      <!-- 左侧导航菜单开始 -->
      <div style="width: 220px; border-right: 1px solid #ddd; min-height: calc(100vh - 60px)">
        <el-menu router :default-active="router.currentRoute.value.path" :default-openeds="['1']" style="border: 0">

          <el-menu-item index="/manage">
            <el-icon><House /></el-icon> 管理首页
          </el-menu-item>

          <el-menu-item index="/manage/detail">
            <el-icon><DataAnalysis /></el-icon> 内容展示
          </el-menu-item>

          <el-sub-menu index="1">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/manage/user">管理员信息</el-menu-item>
            <el-menu-item index="/manage/ordinary">普通用户信息</el-menu-item>
          </el-sub-menu>

          <!-- 这里替换成了你的个人信息，并且给了独立的 index -->
          <el-menu-item index="/manage/profile">
            <el-icon><UserFilled /></el-icon> 王陈飞 2024207335102
          </el-menu-item>

          <el-menu-item index="/manage/logout">
            <el-icon><SwitchButton /></el-icon> 退出登录
          </el-menu-item>

        </el-menu>
      </div>
      <!-- 左侧导航菜单结束 -->

      <!-- 第四步：右侧完整数据展示区域 -->
      <div style="flex: 1; width: 0; background-color: #f5f7ff; padding: 10px; display: flex; flex-direction: column; min-height: calc(100vh - 60px)">
        <!-- 路由出口：子页面 Detail.vue 会在这里显示 -->
        <router-view></router-view>
      </div>

    </div>
  </div>
</template>

<script setup>
import router from "@/router/index.js";
// 如果控制台提示图标找不到，或者页面图标不显示，请取消下面这行的注释：
// import { House, DataAnalysis, User, UserFilled, SwitchButton } from "@element-plus/icons-vue";
</script>
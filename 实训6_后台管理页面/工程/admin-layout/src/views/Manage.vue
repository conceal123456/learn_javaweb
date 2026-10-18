<template>
  <!-- 第一步：页面整体最外层容器 -->
  <div>
    <!-- 第二步：顶部头部整行容器（flex 横向排列：logo 左、用户右） -->
    <div style="height: 60px; background-color: #3c7fff; display: flex; align-items: center">
      <!-- 头部左侧：网站 logo -->
      <div style="width: 200px; display: flex; align-items: center; padding-left: 15px">
        <span style="font-size: 22px; color: white">中药材后台管理系统</span>
      </div>
      <!-- 头部中间空白占位，把右侧内容顶到最右边 -->
      <div style="flex: 1"></div>
      <!-- 头部右侧：后台用户 -->
      <div style="width: fit-content; display: flex; align-items: center; padding-right: 10px">
        <el-avatar :size="36" style="margin-right: 8px; background-color: #c0c4cc">
          <el-icon :size="24"><UserFilled /></el-icon>
        </el-avatar>
        <span style="font-size: 22px; color: white">系统管理员</span>
      </div>
    </div>

    <!-- 第三步：下方左右分栏父容器 -->
    <div style="display: flex">
      <!-- 左侧导航栏区域 -->
      <div style="width: 200px; border-right: 1px solid #ddd; min-height: calc(100vh - 60px)">
        <el-menu router :default-active="router.currentRoute.value.path" :default-openeds="['1']" style="border: 0">
          <el-menu-item index="/manage">
            <el-icon><House /></el-icon>
            管理首页
          </el-menu-item>
          <el-menu-item index="/manage/detail">
            <el-icon><DataAnalysis /></el-icon>
            内容展示
          </el-menu-item>
          <el-sub-menu index="1">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/manage/admin">管理员信息</el-menu-item>
            <el-menu-item index="/manage/staff">普通用户信息</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/manage">
            <el-icon><UserFilled /></el-icon>
            个人信息
          </el-menu-item>
          <el-menu-item index="/manage">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 第四步：右侧内容区域。
           讲义这里先放"搜索区域 / 数据展示区域 / 分页区域"三块占位空位，
           最终由子页面 Detail.vue 的三张卡片来填，所以占位 div 换成 router-view -->
      <div
        style="flex: 1; width: 0; background-color: #f5f7ff; padding: 10px; display: flex; flex-direction: column; min-height: calc(100vh - 60px)"
      >
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import router from '@/router/index.js'
</script>

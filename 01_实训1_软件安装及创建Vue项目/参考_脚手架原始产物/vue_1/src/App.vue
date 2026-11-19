<template>
  <div id="root">
    <!-- 1. 动态绑定图片：注意 alt 是一个属性，不要加逗号 -->
    <!-- 如果 imgPath 是空字符串，图片会显示碎裂或 alt 里的文字 -->
    <img :src="imgPath" alt="这是一张图片">
    
    <!-- 2. 动态绑定样式：外层双引号，对象里面写 key: value -->
    <p :style="{ color: activeColor }">我是一段文字</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imgPath: 'https://www.atguigu.com/images/logo.png', // 这里放个真实的网络图片地址测试
      activeColor: 'red' // 注意这里改成了 activeColor，和上面保持一致
    }
  }
}
</script>
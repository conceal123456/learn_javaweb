<template>
  <div style="padding: 20px; font-size: 15px;">
    <h2>实训2 Vue 基本语法演示</h2>

    <!-- 1. 插值 + reactive 数据绑定 -->
    <p>【插值】学校：{{ data.school }}，学号：{{ data.no }}，在校：{{ data.ok }}</p>

    <!-- 2. 双向绑定 v-model -->
    <p>【v-model】<input v-model="data.school" style="width: 200px" /> 上面文字会实时跟着变</p>
    <hr />

    <!-- 3. 条件 v-if / v-else-if / v-else -->
    <p>【条件】当前分数 {{ score }}：</p>
    <p v-if="score >= 90" style="color: green">优秀</p>
    <p v-else-if="score >= 60" style="color: orange">及格</p>
    <p v-else style="color: red">不及格</p>
    <button @click="score += 10">加 10 分</button>
    <button @click="score = 55">重置</button>
    <hr />

    <!-- 4. 循环 v-for -->
    <p>【v-for】学院列表：</p>
    <ul>
      <li v-for="(item, index) in data.colleges" :key="index">{{ index + 1 }}. {{ item }}</li>
    </ul>

    <!-- 4(b). v-for 在下拉框里生成 option（作业 2.4 要求） -->
    <p>【v-for + select】选择你的学院：
      <select v-model="data.myCollege">
        <option value="">请选择</option>
        <option v-for="c in data.colleges" :key="c" :value="c">{{ c }}</option>
      </select>
    </p>
    <p>下拉框当前选中值：{{ data.myCollege || '（还没选）' }}</p>
    <hr />

    <!-- 5. 事件 @click -->
    <p>【@click】点赞数：{{ count }}
      <button @click="count++">点赞 +1</button>
    </p>
    <hr />

    <!-- 6. 动态绑定 v-bind -->
    <p>【v-bind】下面方块颜色由 JS 控制：</p>
    <div :style="box"></div>
    <button @click="toggleColor">切换方块颜色</button>
    <hr />

    <!-- 6(b). 图片 src 动态绑定（作业 2.6.2 要求） -->
    <p>【v-bind :src】下面这张图的地址由 JS 变量控制：</p>
    <img :src="data.imgUrl" style="width: 200px; height: 150px; object-fit: cover; border: 1px solid #ddd" />
    <p>当前 src 值：{{ data.imgUrl }}</p>
    <button @click="toggleImg">换一张图片</button>
    <hr />

    <p>【onMounted】组件挂载完成后自动弹了一个提示框（刷新页面即可再看到）。</p>
    <p style="color: #b4472f">onMounted 实际触发时刻：{{ mountedAt || '（还没触发）' }}</p>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'

// 1. reactive：一组数据
const data = reactive({
  school: '安徽中医药大学',
  no: 168,
  ok: true,
  colleges: ['信工院', '中医学院', '药学院', '针灸学院'],
  myCollege: '',
  imgUrl: '/img/shihu.jpg'
})

// 3. 条件用的分数
const score = ref(55)

// 5. 事件用的计数
const count = ref(0)

// 6. 动态绑定的样式对象
const box = reactive({
  width: '100px',
  height: '100px',
  backgroundColor: 'red',
  marginTop: '10px'
})
const toggleColor = () => {
  box.backgroundColor = box.backgroundColor === 'red' ? 'blue' : 'red'
}

// 6(b). 切换图片地址：改 JS 变量，页面 <img> 立刻跟着换
const toggleImg = () => {
  data.imgUrl = data.imgUrl === '/img/shihu.jpg' ? '/img/juhua.jpg' : '/img/shihu.jpg'
}

// 7. 生命周期：挂载完成后弹窗提示（作业 2.6.3 要求）
// 注意：原生 alert 会阻塞页面，无头浏览器截图会被卡住，所以加 ?noalert=1 跳过弹窗；
// 同时在页面上留一行可见证据（触发时刻），保证截图里也能看出钩子真的跑了。
const mountedAt = ref('')
onMounted(() => {
  console.log('Home.vue 加载完成！')
  mountedAt.value = new Date().toLocaleTimeString()
  if (!new URLSearchParams(location.search).has('noalert')) {
    alert('页面加载完成，onMounted 钩子已触发')
  }
})
</script>

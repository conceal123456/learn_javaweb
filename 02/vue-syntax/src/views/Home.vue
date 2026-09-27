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

    <p>【onMounted】加载完成后往控制台打了一句话，按 F12 看 Console。</p>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'

// 1. reactive：一组数据
const data = reactive({
  school: '安徽中医药大学',
  no: 168,
  ok: true,
  colleges: ['信工院', '中医学院', '药学院', '针灸学院']
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

// 7. 生命周期
onMounted(() => {
  console.log('Home.vue 加载完成！')
})
</script>

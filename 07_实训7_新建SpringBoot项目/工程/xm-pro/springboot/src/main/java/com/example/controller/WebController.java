package com.example.controller;

import com.example.common.Result;
import com.example.exception.CustomException;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class WebController {

    /**
     * 讲义第一版：直接返回字符串。
     * 想看到这个原始效果，把下面的 return 换成 return "Hello 安徽中医药大学！"; 即可。
     */
    @GetMapping("/hello")
    public Result hello() {
        return Result.success("Hello 安徽中医药大学！");
    }

    /**
     * 故意制造除以 0 的异常，验证全局异常处理：应当返回 code=500 系统错误。
     */
    @GetMapping("/number")
    public Result number() {
        int a = 1 / 0; // 这里会抛 ArithmeticException
        return Result.success(168); // 上面报错后，这行不会被执行
    }

    /**
     * 返回 Map，演示"不包装"时的原生 JSON 效果。
     * produces 指定 UTF-8：否则 @ResponseBody 默认按 ISO-8859-1 处理，中文会变成乱码。
     */
    @GetMapping(value = "/map", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
    public Map<String, Object> map() {
        HashMap<String, Object> map = new HashMap<>();
        map.put("name", "安徽中医药大学");
        map.put("age", 18);
        return map;
    }

    /**
     * 统一包装类返回的接口（讲义要展示的核心效果）。
     */
    @GetMapping("/result")
    public Result resultTest() {
        return Result.success("测试统一返回包装类成功！");
    }

    /**
     * 自定义业务异常：业务错误与系统错误区分开，返回 code=400。
     */
    @GetMapping("/business")
    public Result businessTest() {
        boolean isUserExist = true;

        if (isUserExist) {
            throw new CustomException("400", "用户名已存在，请换一个！");
        }

        return Result.success("注册成功");
    }
}

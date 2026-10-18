package com.example.exception;

import com.example.common.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常统一处理
 * <p>
 * 用 @RestControllerAdvice 拦截所有 Controller 抛出的异常，统一返回 Result，
 * 保证前端拿到的永远是 {code, msg, data} 这一种结构。
 * <p>
 * 注意：@RestControllerAdvice = @ControllerAdvice + @ResponseBody，
 * 所以方法上不需要再单独写 @ResponseBody。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 捕获顶层 Exception，拦截所有系统未知错误，统一返回 code=500 的 Result。
     * 同时在控制台打印完整异常堆栈，方便定位到具体报错的代码行。
     */
    @ExceptionHandler(Exception.class)
    public Result handleException(Exception e) {
        log.error("系统异常：{}", e.getMessage(), e);
        return Result.error();
    }

    /**
     * 单独捕获自定义业务异常，返回业务自定义的状态码和提示信息，
     * 这样业务错误（400）就和系统错误（500）区分开了。
     * <p>
     * 注意：Spring 会优先匹配更具体的异常类型，所以 CustomException 会走这里，
     * 不会被上面的 Exception 分支吃掉。
     */
    @ExceptionHandler(CustomException.class)
    public Result handleCustomException(CustomException e) {
        log.warn("业务异常：code={}, msg={}", e.getCode(), e.getMsg());
        return Result.error(e.getCode(), e.getMsg());
    }
}

package com.example.exception;

import com.example.common.CustomException;
import com.example.common.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 全局异常处理：保证任何情况下前端都拿到 {code,msg,data}
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(CustomException.class)
    public Result handleBusiness(CustomException e) {
        log.warn("业务异常：code={}, msg={}", e.getCode(), e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result handleValid(MethodArgumentNotValidException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String msg = fieldError == null ? "参数校验失败" : fieldError.getDefaultMessage();
        return Result.error("400", msg);
    }

    @ExceptionHandler(DuplicateKeyException.class)
    public Result handleDuplicate(DuplicateKeyException e) {
        log.warn("唯一键冲突：{}", e.getMessage());
        return Result.error("400", "名称或账号已存在，请勿重复添加");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public Result handleUploadSize(MaxUploadSizeExceededException e) {
        return Result.error("400", "文件过大，单个文件不能超过 10MB");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public Result handleUnreadable(HttpMessageNotReadableException e) {
        log.warn("请求体解析失败：{}", e.getMessage());
        return Result.error("400", "请求参数格式错误，请检查 JSON 是否合法");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public Result handleNotFound(NoResourceFoundException e) {
        return Result.error("404", "接口不存在：" + e.getResourcePath());
    }

    @ExceptionHandler(Exception.class)
    public Result handleException(Exception e) {
        log.error("系统异常：{}", e.getMessage(), e);
        return Result.error();
    }
}

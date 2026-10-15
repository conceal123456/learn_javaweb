package com.example.common;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 统一返回的包装类
 * <p>
 * 前端只需要固定读取 code、msg、data 三个字段，不用再关心接口原本返回的是
 * String、Integer 还是 Map。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result {
    /** 状态码：200 成功、500 系统异常、400 业务异常 */
    private String code;
    /** 提示信息 */
    private String msg;
    /** 接口真实返回数据（Object 类型兼容所有数据） */
    private Object data;

    public static Result success() {
        Result result = new Result();
        result.setCode("200");
        result.setMsg("请求成功");
        return result;
    }

    public static Result success(Object data) {
        Result result = success();
        result.setData(data);
        return result;
    }

    public static Result error() {
        Result result = new Result();
        result.setCode("500");
        result.setMsg("系统错误");
        return result;
    }

    public static Result error(String code, String msg) {
        Result result = new Result();
        result.setCode(code);
        result.setMsg(msg);
        return result;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}

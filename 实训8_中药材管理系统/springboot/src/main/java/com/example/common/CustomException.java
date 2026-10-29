package com.example.common;

/**
 * 业务异常：由 GlobalExceptionHandler 统一转成 Result.error(code, msg)
 */
public class CustomException extends RuntimeException {

    private final String code;

    public CustomException(String msg) {
        this("400", msg);
    }

    public CustomException(String code, String msg) {
        super(msg);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}

package com.example.util;

import com.example.common.CustomException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * 密码工具：SHA-256 摘要
 * 教学项目为了少引入依赖使用 SHA-256；生产环境建议使用 BCrypt。
 */
public final class PasswordUtil {

    private PasswordUtil() {
    }

    public static String sha256(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new CustomException("500", "密码加密失败");
        }
    }

    public static boolean matches(String raw, String encoded) {
        return sha256(raw).equalsIgnoreCase(encoded);
    }
}

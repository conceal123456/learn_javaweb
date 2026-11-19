package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 新增 / 修改用户参数
 */
public class UserDTO {

    private Long id;

    @NotBlank(message = "账号不能为空")
    @Size(min = 3, max = 20, message = "账号长度 3-20 位")
    private String username;

    /** 新增时必填；修改时留空表示不改密码 */
    private String password;

    @Size(max = 50, message = "昵称不能超过 50 个字符")
    private String nickname;

    @Pattern(regexp = "ADMIN|USER", message = "角色只能是 ADMIN 或 USER")
    private String role;

    private String phone;

    private Integer status;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }
}

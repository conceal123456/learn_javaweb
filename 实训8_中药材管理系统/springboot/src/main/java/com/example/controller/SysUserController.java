package com.example.controller;

import com.example.common.PageResult;
import com.example.common.Result;
import com.example.dto.UserDTO;
import com.example.dto.UserQuery;
import com.example.entity.SysUser;
import com.example.service.SysUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户管理接口
 */
@RestController
@RequestMapping("/user")
public class SysUserController {

    private final SysUserService userService;

    public SysUserController(SysUserService userService) {
        this.userService = userService;
    }

    @GetMapping("/page")
    public Result page(UserQuery query) {
        PageResult<SysUser> page = userService.page(query);
        return Result.success(page);
    }

    @PostMapping
    public Result add(@RequestBody @Valid UserDTO dto) {
        userService.add(dto);
        return Result.success("新增成功", null);
    }

    @PutMapping
    public Result update(@RequestBody @Valid UserDTO dto) {
        userService.update(dto);
        return Result.success("修改成功", null);
    }

    @DeleteMapping("/{id}")
    public Result delete(@PathVariable Long id) {
        userService.delete(id);
        return Result.success("删除成功", null);
    }

    @PutMapping("/{id}/status")
    public Result updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        userService.updateStatus(id, status);
        return Result.success("状态已更新", null);
    }
}

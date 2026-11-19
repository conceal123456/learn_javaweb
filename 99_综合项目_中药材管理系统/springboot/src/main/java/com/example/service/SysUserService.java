package com.example.service;

import com.example.common.CustomException;
import com.example.common.PageResult;
import com.example.dto.UserDTO;
import com.example.dto.UserQuery;
import com.example.entity.SysUser;
import com.example.mapper.SysUserMapper;
import com.example.util.PasswordUtil;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 用户业务
 */
@Service
public class SysUserService {

    private final SysUserMapper userMapper;

    public SysUserService(SysUserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public SysUser getById(Long id) {
        SysUser user = userMapper.selectById(id);
        if (user == null) {
            throw new CustomException("用户不存在或已被删除");
        }
        return user;
    }

    public PageResult<SysUser> page(UserQuery query) {
        if (query.getPageNum() == null || query.getPageNum() < 1) {
            query.setPageNum(1);
        }
        if (query.getPageSize() == null || query.getPageSize() < 1) {
            query.setPageSize(10);
        }
        long total = userMapper.count(query);
        List<SysUser> records = userMapper.selectPage(query, (query.getPageNum() - 1) * query.getPageSize());
        return new PageResult<>(total, records);
    }

    public int add(UserDTO dto) {
        SysUser user = new SysUser();
        user.setUsername(dto.getUsername().trim());
        String rawPassword = (dto.getPassword() == null || dto.getPassword().isBlank()) ? "123456" : dto.getPassword();
        user.setPassword(PasswordUtil.sha256(rawPassword));
        user.setNickname(dto.getNickname() == null || dto.getNickname().isBlank() ? user.getUsername() : dto.getNickname());
        user.setRole(dto.getRole() == null ? "USER" : dto.getRole());
        user.setPhone(dto.getPhone());
        user.setStatus(dto.getStatus() == null ? 1 : dto.getStatus());
        return userMapper.insert(user);
    }

    public int update(UserDTO dto) {
        if (dto.getId() == null) {
            throw new CustomException("缺少用户 id");
        }
        getById(dto.getId());
        SysUser user = new SysUser();
        user.setId(dto.getId());
        user.setUsername(dto.getUsername().trim());
        user.setNickname(dto.getNickname());
        user.setRole(dto.getRole() == null ? "USER" : dto.getRole());
        user.setPhone(dto.getPhone());
        user.setStatus(dto.getStatus() == null ? 1 : dto.getStatus());
        int rows = userMapper.update(user);
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            userMapper.updatePassword(dto.getId(), PasswordUtil.sha256(dto.getPassword()));
        }
        return rows;
    }

    public int delete(Long id) {
        if (id != null && id == 1L) {
            throw new CustomException("内置管理员账号不能删除");
        }
        getById(id);
        return userMapper.deleteById(id);
    }

    public int updateStatus(Long id, Integer status) {
        getById(id);
        return userMapper.updateStatus(id, status);
    }

    public long countAll() {
        return userMapper.countAll();
    }
}

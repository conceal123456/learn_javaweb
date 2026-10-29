package com.example.service;

import com.example.entity.Employee;
import com.example.mapper.EmployeeMapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    @Resource
    private EmployeeMapper employeeMapper;

    public List<Employee> selectAll() {
        return employeeMapper.selectAll();
    }

    public Employee selectById(Integer id) {
        return employeeMapper.selectById(id);
    }

    public Employee selectByIdWithAnnotation(Integer id) {
        return employeeMapper.selectByIdWithAnnotation(id);
    }

    public PageInfo<Employee> selectPage(Integer pageNum, Integer pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<Employee> list = employeeMapper.selectAll();
        return PageInfo.of(list);
    }

    public int insert(Employee employee) {
        return employeeMapper.insert(employee);
    }

    public int update(Employee employee) {
        return employeeMapper.update(employee);
    }

    public int deleteById(Integer id) {
        return employeeMapper.deleteById(id);
    }
}

package com.example.controller;

import com.example.common.Result;
import com.example.entity.Employee;
import com.example.service.EmployeeService;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/employee")
public class EmployeeController {

    @Resource
    private EmployeeService employeeService;

    /**
     * 查询全部员工。
     */
    @GetMapping("/selectAll")
    public Result<List<Employee>> selectAll() {
        return Result.success(employeeService.selectAll());
    }

    /**
     * 按 id 查询（路径参数）。
     */
    @GetMapping("/selectById/{id}")
    public Result<Employee> selectById(@PathVariable Integer id) {
        return Result.success(employeeService.selectById(id));
    }

    /**
     * 按 id 查询（查询参数，演示 @Select 注解方式）。
     */
    @GetMapping("/selectOne")
    public Result<Employee> selectOne(@RequestParam Integer id) {
        return Result.success(employeeService.selectByIdWithAnnotation(id));
    }

    /**
     * 分页查询。
     */
    @GetMapping("/selectPage")
    public Result<PageInfo<Employee>> selectPage(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        return Result.success(employeeService.selectPage(pageNum, pageSize));
    }

    /**
     * 新增员工，id 由数据库自增。
     */
    @PostMapping("/insert")
    public Result<String> insert(@RequestBody Employee employee) {
        int rows = employeeService.insert(employee);
        return rows > 0 ? Result.success("新增成功") : Result.error("500", "新增失败");
    }

    /**
     * 修改员工，必须传 id。
     */
    @PutMapping("/update")
    public Result<String> update(@RequestBody Employee employee) {
        int rows = employeeService.update(employee);
        return rows > 0 ? Result.success("修改成功") : Result.error("500", "修改失败");
    }

    /**
     * 按 id 删除员工。
     */
    @DeleteMapping("/delete/{id}")
    public Result<String> delete(@PathVariable Integer id) {
        int rows = employeeService.deleteById(id);
        return rows > 0 ? Result.success("删除成功") : Result.error("500", "删除失败");
    }
}

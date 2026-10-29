package com.example.mapper;

import com.example.entity.Employee;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 员工 Mapper。
 *
 * <p>增删改查的 SQL 写在 resources/mapper/EmployeeMapper.xml 中，
 * 方法名必须和 XML 里的 id 完全一致。selectByIdWithAnnotation 用注解方式演示单条查询。</p>
 */
public interface EmployeeMapper {

    List<Employee> selectAll();

    Employee selectById(Integer id);

    @Select("SELECT id, name, sex, no, age, description FROM employee WHERE id = #{id}")
    Employee selectByIdWithAnnotation(Integer id);

    int insert(Employee employee);

    int update(Employee employee);

    int deleteById(Integer id);
}

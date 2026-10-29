package com.example.mapper;

import com.example.dto.UserQuery;
import com.example.entity.SysUser;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 系统用户 Mapper
 */
@Mapper
public interface SysUserMapper {

    @Select("select * from sys_user where username = #{username}")
    SysUser selectByUsername(String username);

    @Select("select * from sys_user where id = #{id}")
    SysUser selectById(Long id);

    @Select("""
            <script>
            select * from sys_user
            <where>
                <if test="q.username != null and q.username != ''">
                    and (username like concat('%', #{q.username}, '%')
                         or nickname like concat('%', #{q.username}, '%'))
                </if>
                <if test="q.role != null and q.role != ''">
                    and role = #{q.role}
                </if>
                <if test="q.status != null">
                    and status = #{q.status}
                </if>
            </where>
            order by id asc
            limit #{offset}, #{q.pageSize}
            </script>
            """)
    List<SysUser> selectPage(@Param("q") UserQuery query, @Param("offset") int offset);

    @Select("""
            <script>
            select count(*) from sys_user
            <where>
                <if test="q.username != null and q.username != ''">
                    and (username like concat('%', #{q.username}, '%')
                         or nickname like concat('%', #{q.username}, '%'))
                </if>
                <if test="q.role != null and q.role != ''">
                    and role = #{q.role}
                </if>
                <if test="q.status != null">
                    and status = #{q.status}
                </if>
            </where>
            </script>
            """)
    long count(@Param("q") UserQuery query);

    @Insert("""
            insert into sys_user(username, password, nickname, role, phone, status)
            values(#{username}, #{password}, #{nickname}, #{role}, #{phone}, #{status})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(SysUser user);

    @Update("""
            update sys_user
            set username = #{username},
                nickname = #{nickname},
                role = #{role},
                phone = #{phone},
                status = #{status}
            where id = #{id}
            """)
    int update(SysUser user);

    @Update("update sys_user set password = #{password} where id = #{id}")
    int updatePassword(@Param("id") Long id, @Param("password") String password);

    @Update("update sys_user set status = #{status} where id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);

    @Delete("delete from sys_user where id = #{id}")
    int deleteById(Long id);

    @Select("select count(*) from sys_user")
    long countAll();
}

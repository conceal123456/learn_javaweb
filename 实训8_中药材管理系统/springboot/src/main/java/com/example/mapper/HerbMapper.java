package com.example.mapper;

import com.example.dto.HerbQuery;
import com.example.entity.Herb;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Map;

/**
 * 中药材 Mapper：使用注解方式写 SQL
 */
@Mapper
public interface HerbMapper {

    @Select("""
            <script>
            select * from herb
            <where>
                <if test="q.name != null and q.name != ''">
                    and name like concat('%', #{q.name}, '%')
                </if>
                <if test="q.origin != null and q.origin != ''">
                    and origin like concat('%', #{q.origin}, '%')
                </if>
                <if test="q.status != null">
                    and status = #{q.status}
                </if>
            </where>
            order by id desc
            limit #{offset}, #{q.pageSize}
            </script>
            """)
    List<Herb> selectPage(@Param("q") HerbQuery query, @Param("offset") int offset);

    @Select("""
            <script>
            select count(*) from herb
            <where>
                <if test="q.name != null and q.name != ''">
                    and name like concat('%', #{q.name}, '%')
                </if>
                <if test="q.origin != null and q.origin != ''">
                    and origin like concat('%', #{q.origin}, '%')
                </if>
                <if test="q.status != null">
                    and status = #{q.status}
                </if>
            </where>
            </script>
            """)
    long count(@Param("q") HerbQuery query);

    /** 导出用：不分页 */
    @Select("""
            <script>
            select * from herb
            <where>
                <if test="q.name != null and q.name != ''">
                    and name like concat('%', #{q.name}, '%')
                </if>
                <if test="q.origin != null and q.origin != ''">
                    and origin like concat('%', #{q.origin}, '%')
                </if>
                <if test="q.status != null">
                    and status = #{q.status}
                </if>
            </where>
            order by id desc
            </script>
            """)
    List<Herb> selectList(@Param("q") HerbQuery query);

    @Select("select * from herb where id = #{id}")
    Herb selectById(Long id);

    @Select("select * from herb order by create_time desc limit #{limit}")
    List<Herb> selectRecent(@Param("limit") int limit);

    @Insert("""
            insert into herb(name, alias, origin, price, stock, produce_date,
                             shelf_life, image, description, status)
            values(#{name}, #{alias}, #{origin}, #{price}, #{stock}, #{produceDate},
                   #{shelfLife}, #{image}, #{description}, #{status})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Herb herb);

    @Insert("""
            <script>
            insert ignore into herb(name, alias, origin, price, stock, produce_date,
                                    shelf_life, image, description, status)
            values
            <foreach collection="list" item="item" separator=",">
                (#{item.name}, #{item.alias}, #{item.origin}, #{item.price}, #{item.stock},
                 #{item.produceDate}, #{item.shelfLife}, #{item.image}, #{item.description}, #{item.status})
            </foreach>
            </script>
            """)
    int insertBatch(@Param("list") List<Herb> list);

    @Update("""
            update herb
            set name = #{name}, alias = #{alias}, origin = #{origin}, price = #{price},
                stock = #{stock}, produce_date = #{produceDate}, shelf_life = #{shelfLife},
                image = #{image}, description = #{description}, status = #{status}
            where id = #{id}
            """)
    int update(Herb herb);

    @Delete("delete from herb where id = #{id}")
    int deleteById(Long id);

    @Delete("""
            <script>
            delete from herb where id in
            <foreach collection="ids" item="id" open="(" separator="," close=")">
                #{id}
            </foreach>
            </script>
            """)
    int deleteBatch(@Param("ids") List<Long> ids);

    @Select("select count(*) from herb")
    long countAll();

    @Select("select ifnull(sum(stock), 0) from herb")
    long sumStock();

    @Select("select count(*) from herb where status = 1")
    long countOnSale();

    @Select("select left(origin, 4) as name, count(*) as value from herb group by left(origin, 4) order by value desc limit 6")
    List<Map<String, Object>> countByOrigin();

    @Select("select name, stock from herb order by stock desc limit 6")
    List<Map<String, Object>> selectTopStock();
}

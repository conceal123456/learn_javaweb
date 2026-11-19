package com.example;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 中药材管理系统启动类
 */
@SpringBootApplication
@MapperScan("com.example.mapper")
public class SpringbootApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringbootApplication.class, args);
        System.out.println("""
                ------------------------------------------------------------
                中药材管理系统后端启动成功
                接口地址：http://localhost:8080/api
                演示账号：admin / 123456
                ------------------------------------------------------------
                """);
    }
}

package com.example.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Web 相关配置：
 * 1. 统一响应的 UTF-8 编码，避免中文乱码
 * 2. 允许跨域，方便前端 5173 调用后端 8080
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Disposition")
                .maxAge(3600);
    }

    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        for (HttpMessageConverter<?> converter : converters) {
            if (converter instanceof StringHttpMessageConverter stringConverter) {
                stringConverter.setDefaultCharset(StandardCharsets.UTF_8);
                stringConverter.setWriteAcceptCharset(false);
            } else if (converter instanceof MappingJackson2HttpMessageConverter jsonConverter) {
                List<MediaType> types = new ArrayList<>(jsonConverter.getSupportedMediaTypes());
                types.removeIf(MediaType.APPLICATION_JSON::equals);
                types.add(new MediaType("application", "json", StandardCharsets.UTF_8));
                jsonConverter.setSupportedMediaTypes(types);
            }
        }
    }
}

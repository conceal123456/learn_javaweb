package com.example.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Web 相关配置：把所有 @ResponseBody 的响应编码统一成 UTF-8。
 * <p>
 * 为什么需要它：
 * 1）@ResponseBody 返回 String 时用的是 StringHttpMessageConverter，它自带的默认
 * 字符集是 ISO-8859-1，中文会显示成乱码；
 * 2）返回对象（Result、Map）走的是 MappingJackson2HttpMessageConverter，
 * 默认 Content-Type 是 application/json，不带 charset。
 * <p>
 * 统一的办法：给这两个转换器都指定 UTF-8，Content-Type 就会带上 charset=UTF-8，
 * 浏览器和前端（axios）都能确定按 UTF-8 解析，中文不再乱码。
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        for (HttpMessageConverter<?> converter : converters) {
            if (converter instanceof StringHttpMessageConverter) {
                StringHttpMessageConverter c = (StringHttpMessageConverter) converter;
                c.setDefaultCharset(StandardCharsets.UTF_8);
                c.setWriteAcceptCharset(false);
            } else if (converter instanceof MappingJackson2HttpMessageConverter) {
                MappingJackson2HttpMessageConverter c = (MappingJackson2HttpMessageConverter) converter;
                List<MediaType> types = new ArrayList<>(c.getSupportedMediaTypes());
                types.removeIf(MediaType.APPLICATION_JSON::equals);
                types.add(new MediaType("application", "json", StandardCharsets.UTF_8));
                c.setSupportedMediaTypes(types);
            }
        }
    }
}

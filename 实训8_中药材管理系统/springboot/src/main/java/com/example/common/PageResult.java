package com.example.common;

import java.util.List;

/**
 * 分页返回结构
 * 前端拿到 total 渲染分页条，拿到 records 渲染表格
 */
public class PageResult<T> {

    private long total;
    private List<T> records;

    public PageResult() {
    }

    public PageResult(long total, List<T> records) {
        this.total = total;
        this.records = records;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public List<T> getRecords() {
        return records;
    }

    public void setRecords(List<T> records) {
        this.records = records;
    }
}

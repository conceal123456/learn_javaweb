package com.example.controller;

import com.example.common.PageResult;
import com.example.common.Result;
import com.example.dto.HerbQuery;
import com.example.entity.Herb;
import com.example.service.HerbService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 中药材管理接口
 */
@RestController
@RequestMapping("/herb")
public class HerbController {

    private final HerbService herbService;

    public HerbController(HerbService herbService) {
        this.herbService = herbService;
    }

    /** 分页 + 条件查询 */
    @GetMapping("/page")
    public Result page(HerbQuery query) {
        return Result.success(herbService.page(query));
    }

    /** 根据 id 查询详情 */
    @GetMapping("/{id}")
    public Result detail(@PathVariable Long id) {
        return Result.success(herbService.getById(id));
    }

    /** 新增 */
    @PostMapping
    public Result add(@RequestBody @Valid Herb herb) {
        herbService.add(herb);
        return Result.success("新增成功", null);
    }

    /** 修改 */
    @PutMapping
    public Result update(@RequestBody @Valid Herb herb) {
        herbService.update(herb);
        return Result.success("修改成功", null);
    }

    /** 删除单条 */
    @DeleteMapping("/{id}")
    public Result delete(@PathVariable Long id) {
        herbService.delete(id);
        return Result.success("删除成功", null);
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result deleteBatch(@RequestBody List<Long> ids) {
        int rows = herbService.deleteBatch(ids);
        return Result.success("已删除 " + rows + " 条数据", null);
    }

    /** Excel 导入 */
    @PostMapping("/import")
    public Result importExcel(@RequestParam("file") MultipartFile file) {
        int rows = herbService.importExcel(file);
        return Result.success("成功导入 " + rows + " 条数据", null);
    }

    /** Excel 导出 */
    @GetMapping("/export")
    public void export(HerbQuery query, HttpServletResponse response) {
        herbService.exportExcel(response, query);
    }

    /** 下载导入模板 */
    @GetMapping("/template")
    public void template(HttpServletResponse response) {
        herbService.downloadTemplate(response);
    }
}

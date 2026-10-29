package com.example.service;

import com.example.common.CustomException;
import com.example.common.PageResult;
import com.example.dto.HerbQuery;
import com.example.entity.Herb;
import com.example.mapper.HerbMapper;
import com.example.util.ExcelUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 中药材业务层
 */
@Service
public class HerbService {

    private final HerbMapper herbMapper;

    public HerbService(HerbMapper herbMapper) {
        this.herbMapper = herbMapper;
    }

    public PageResult<Herb> page(HerbQuery query) {
        normalize(query);
        long total = herbMapper.count(query);
        List<Herb> records = herbMapper.selectPage(query, (query.getPageNum() - 1) * query.getPageSize());
        return new PageResult<>(total, records);
    }

    public Herb getById(Long id) {
        Herb herb = herbMapper.selectById(id);
        if (herb == null) {
            throw new CustomException("药材不存在或已被删除");
        }
        return herb;
    }

    public int add(Herb herb) {
        applyDefaults(herb);
        return herbMapper.insert(herb);
    }

    public int update(Herb herb) {
        if (herb.getId() == null) {
            throw new CustomException("缺少药材 id");
        }
        getById(herb.getId());
        applyDefaults(herb);
        return herbMapper.update(herb);
    }

    public int delete(Long id) {
        getById(id);
        return herbMapper.deleteById(id);
    }

    @Transactional
    public int deleteBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new CustomException("请先勾选要删除的药材");
        }
        return herbMapper.deleteBatch(ids);
    }

    @Transactional
    public int importExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("请选择要导入的 Excel 文件");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !(filename.endsWith(".xlsx") || filename.endsWith(".xls"))) {
            throw new CustomException("只支持 .xlsx 或 .xls 格式");
        }
        List<Herb> list = ExcelUtil.readHerbs(file);
        if (list.isEmpty()) {
            throw new CustomException("Excel 中没有可导入的数据");
        }
        list.forEach(this::applyDefaults);
        return herbMapper.insertBatch(list);
    }

    public void exportExcel(HttpServletResponse response, HerbQuery query) {
        List<Herb> list = herbMapper.selectList(query);
        ExcelUtil.writeHerbs(response, list);
    }

    public void downloadTemplate(HttpServletResponse response) {
        ExcelUtil.writeTemplate(response);
    }

    public List<Herb> recent(int limit) {
        return herbMapper.selectRecent(limit);
    }

    private void normalize(HerbQuery query) {
        if (query.getPageNum() == null || query.getPageNum() < 1) {
            query.setPageNum(1);
        }
        if (query.getPageSize() == null || query.getPageSize() < 1) {
            query.setPageSize(10);
        }
        if (query.getPageSize() > 100) {
            query.setPageSize(100);
        }
        if (query.getName() != null) {
            query.setName(query.getName().trim());
        }
        if (query.getOrigin() != null) {
            query.setOrigin(query.getOrigin().trim());
        }
    }

    private void applyDefaults(Herb herb) {
        if (herb.getStatus() == null) {
            herb.setStatus(1);
        }
        if (herb.getShelfLife() == null || herb.getShelfLife().isBlank()) {
            herb.setShelfLife("24个月");
        }
        if (herb.getStock() == null) {
            herb.setStock(0);
        }
        if (herb.getPrice() == null) {
            herb.setPrice(java.math.BigDecimal.ZERO);
        }
    }
}

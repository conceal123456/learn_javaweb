package com.example.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 中药材实体，字段与 herb 表一一对应
 */
public class Herb {

    private Long id;

    @NotBlank(message = "药材名称不能为空")
    @Size(max = 50, message = "药材名称不能超过 50 个字符")
    private String name;

    @Size(max = 50, message = "别名不能超过 50 个字符")
    private String alias;

    @Size(max = 100, message = "产地不能超过 100 个字符")
    private String origin;

    @DecimalMin(value = "0", message = "价格不能为负数")
    private BigDecimal price;

    @Min(value = 0, message = "库存不能为负数")
    private Integer stock;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate produceDate;

    @Size(max = 20, message = "保质期不能超过 20 个字符")
    private String shelfLife;

    private String image;

    @Size(max = 500, message = "功效描述不能超过 500 个字符")
    private String description;

    /** 1 上架，0 下架 */
    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public LocalDate getProduceDate() {
        return produceDate;
    }

    public void setProduceDate(LocalDate produceDate) {
        this.produceDate = produceDate;
    }

    public String getShelfLife() {
        return shelfLife;
    }

    public void setShelfLife(String shelfLife) {
        this.shelfLife = shelfLife;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
}

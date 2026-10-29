package com.example.util;

import com.example.common.CustomException;
import com.example.entity.Herb;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Excel 导入导出工具（Apache POI）
 * 表头：名称 / 别名 / 产地 / 价格 / 库存 / 生产日期 / 保质期 / 功效描述 / 状态
 */
public final class ExcelUtil {

    private static final String[] HEADERS = {
            "名称", "别名", "产地", "价格(元/公斤)", "库存(公斤)",
            "生产日期(yyyy-MM-dd)", "保质期", "功效描述", "状态(上架/下架)"
    };

    private static final DateTimeFormatter[] DATE_FORMATS = {
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("yyyy/M/d"),
            DateTimeFormatter.ofPattern("yyyy.MM.dd")
    };

    private ExcelUtil() {
    }

    // ------------------------------------------------------------
    // 导出
    // ------------------------------------------------------------
    public static void writeHerbs(HttpServletResponse response, List<Herb> list) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("中药材");
            createHeader(workbook, sheet, "中药材数据");

            int rowIndex = 1;
            for (Herb herb : list) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(nullToEmpty(herb.getName()));
                row.createCell(1).setCellValue(nullToEmpty(herb.getAlias()));
                row.createCell(2).setCellValue(nullToEmpty(herb.getOrigin()));
                row.createCell(3).setCellValue(herb.getPrice() == null ? 0 : herb.getPrice().doubleValue());
                row.createCell(4).setCellValue(herb.getStock() == null ? 0 : herb.getStock());
                row.createCell(5).setCellValue(herb.getProduceDate() == null ? "" : herb.getProduceDate().toString());
                row.createCell(6).setCellValue(nullToEmpty(herb.getShelfLife()));
                row.createCell(7).setCellValue(nullToEmpty(herb.getDescription()));
                row.createCell(8).setCellValue(herb.getStatus() != null && herb.getStatus() == 1 ? "上架" : "下架");
            }

            setWidths(sheet);
            sheet.createFreezePane(0, 1);
            download(response, workbook, "中药材数据.xlsx");
        } catch (IOException e) {
            throw new CustomException("500", "导出 Excel 失败：" + e.getMessage());
        }
    }

    public static void writeTemplate(HttpServletResponse response) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("中药材导入模板");
            createHeader(workbook, sheet, "中药材导入模板");
            setWidths(sheet);

            Sheet tips = workbook.createSheet("填写说明");
            String[] lines = {
                    "1. 第一行为表头，请勿修改或删除；从第二行开始填写数据。",
                    "2. 名称必填，且不能与系统中已有药材重名。",
                    "3. 价格填写数字，单位元/公斤；库存填写整数，单位公斤。",
                    "4. 生产日期格式：2026-05-20。",
                    "5. 状态只能填：上架 / 下架；留空默认上架。",
                    "6. 单次建议导入不超过 1000 行。"
            };
            for (int i = 0; i < lines.length; i++) {
                tips.createRow(i).createCell(0).setCellValue(lines[i]);
            }
            tips.setColumnWidth(0, 90 * 256);

            download(response, workbook, "中药材导入模板.xlsx");
        } catch (IOException e) {
            throw new CustomException("500", "生成模板失败：" + e.getMessage());
        }
    }

    // ------------------------------------------------------------
    // 导入
    // ------------------------------------------------------------
    public static List<Herb> readHerbs(MultipartFile file) {
        List<Herb> list = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }
                String name = getString(row.getCell(0), formatter);
                if (name.isBlank()) {
                    continue;
                }
                Herb herb = new Herb();
                herb.setName(name);
                herb.setAlias(getString(row.getCell(1), formatter));
                herb.setOrigin(getString(row.getCell(2), formatter));
                herb.setPrice(toDecimal(getString(row.getCell(3), formatter)));
                herb.setStock(toInteger(getString(row.getCell(4), formatter)));
                herb.setProduceDate(toDate(row.getCell(5), formatter));
                String shelfLife = getString(row.getCell(6), formatter);
                herb.setShelfLife(shelfLife.isBlank() ? "24个月" : shelfLife);
                herb.setDescription(getString(row.getCell(7), formatter));
                String status = getString(row.getCell(8), formatter);
                herb.setStatus(status.contains("下架") || "0".equals(status) ? 0 : 1);
                list.add(herb);
            }
            return list;
        } catch (IOException | RuntimeException e) {
            throw new CustomException("400", "Excel 解析失败，请使用下载的模板填写：" + e.getMessage());
        }
    }

    // ------------------------------------------------------------
    // 私有方法
    // ------------------------------------------------------------
    private static void createHeader(Workbook workbook, Sheet sheet, String title) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);

        Row header = sheet.createRow(0);
        header.setHeightInPoints(24);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(style);
        }
    }

    private static void setWidths(Sheet sheet) {
        int[] widths = {16, 14, 22, 14, 12, 20, 12, 46, 16};
        for (int i = 0; i < widths.length; i++) {
            sheet.setColumnWidth(i, widths[i] * 256);
        }
    }

    private static void download(HttpServletResponse response, Workbook workbook, String fileName) throws IOException {
        String encoded = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + encoded);
        workbook.write(response.getOutputStream());
        response.getOutputStream().flush();
    }

    private static String getString(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return "";
        }
        return formatter.formatCellValue(cell).trim();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static BigDecimal toDecimal(String value) {
        if (value == null || value.isBlank()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(value.replace(",", "").replace("元", "").trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private static Integer toInteger(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        try {
            return new BigDecimal(value.replace(",", "").replace("公斤", "").trim()).intValue();
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static LocalDate toDate(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toLocalDate();
        }
        String value = formatter.formatCellValue(cell).trim();
        if (value.isBlank()) {
            return null;
        }
        for (DateTimeFormatter format : DATE_FORMATS) {
            try {
                return LocalDate.parse(value, format);
            } catch (Exception ignored) {
                // 尝试下一种格式
            }
        }
        return null;
    }
}

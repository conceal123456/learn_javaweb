"""把 Markdown 开发文档转换成带截图的 Word 文档。"""
import os
import re

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD_PATH = os.path.join(BASE_DIR, "docs", "实训8_中药材管理系统_开发文档.md")
OUT_PATH = os.path.join(BASE_DIR, "docs", "实训8_中药材管理系统_开发文档.docx")

LATIN_FONT = "Times New Roman"
BODY_FONT = LATIN_FONT
HEAD_FONT = "黑体"
CODE_FONT = "Consolas"
CJK_FONT = "宋体"
BLACK = RGBColor(0, 0, 0)


def set_run_font(run, name=BODY_FONT, size=10.5, bold=None, color=None, east_asia=None):
    """西文统一 Times New Roman；中文按 name 判断宋体/黑体；颜色默认黑色。"""
    if east_asia is None:
        east_asia = HEAD_FONT if name == HEAD_FONT else CJK_FONT
    run.font.name = CODE_FONT if name == CODE_FONT else LATIN_FONT
    run.font.size = Pt(size)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), east_asia)
    if bold is not None:
        run.bold = bold
    run.font.color.rgb = BLACK


def shade(paragraph, fill):
    p_pr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    p_pr.append(shd)


def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = "PAGE"
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_end)
    set_run_font(run, BODY_FONT, 9)


def add_hyperlink_text(paragraph, text, bold=False, size=10.5, code=False):
    """按 **粗体**、`代码`、[文字](链接) 拆分并写入 run。"""
    pattern = re.compile(r"(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))")
    pos = 0
    for match in pattern.finditer(text):
        if match.start() > pos:
            run = paragraph.add_run(text[pos:match.start()])
            set_run_font(run, CODE_FONT if code else BODY_FONT, size, bold)
        token = match.group(0)
        if token.startswith("**"):
            run = paragraph.add_run(token[2:-2])
            set_run_font(run, BODY_FONT, size, True)
        elif token.startswith("`"):
            run = paragraph.add_run(token[1:-1])
            set_run_font(run, CODE_FONT, size - 0.5)

        else:
            label = re.match(r"\[([^\]]+)\]", token).group(1)
            run = paragraph.add_run(label)
            set_run_font(run, BODY_FONT, size, bold)
            run.underline = True
        pos = match.end()
    if pos < len(text):
        run = paragraph.add_run(text[pos:])
        set_run_font(run, CODE_FONT if code else BODY_FONT, size, bold)


def parse_table_block(lines):
    rows = []
    for line in lines:
        text = line.strip()
        if not text.startswith("|"):
            continue
        cells = [cell.strip() for cell in text.strip("|").split("|")]
        if all(re.fullmatch(r":?-{2,}:?", cell) for cell in cells):
            continue
        rows.append(cells)
    return rows


def set_three_line_borders(table, header_line=True):
    """三线表：顶线、表头下线、底线；无竖线、无内部横线。"""
    tbl_pr = table._tbl.tblPr
    style_el = tbl_pr.find(qn("w:tblStyle"))
    if style_el is not None:
        tbl_pr.remove(style_el)
    look_el = tbl_pr.find(qn("w:tblLook"))
    if look_el is not None:
        tbl_pr.remove(look_el)
    for old in tbl_pr.findall(qn("w:tblBorders")):
        tbl_pr.remove(old)
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "bottom"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "12")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), "000000")
        borders.append(element)
    for edge in ("left", "right", "insideH", "insideV"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), "FFFFFF")
        borders.append(element)
    tbl_pr.insert_element_before(borders, "w:tblLayout", "w:tblCellMar", "w:tblLook")

    # 所有单元格先显式清空边框，避免继承 Table Grid
    for row in table.rows:
        for cell in row.cells:
            tc_pr = cell._tc.get_or_add_tcPr()
            for old in tc_pr.findall(qn("w:tcBorders")):
                tc_pr.remove(old)
            tc_borders = OxmlElement("w:tcBorders")
            for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
                element = OxmlElement(f"w:{edge}")
                element.set(qn("w:val"), "single")
                element.set(qn("w:sz"), "4")
                element.set(qn("w:space"), "0")
                element.set(qn("w:color"), "FFFFFF")
                tc_borders.append(element)
            tc_pr.append(tc_borders)

    # 表头下方一条细线
    if not header_line:
        return
    for cell in table.rows[0].cells:
        tc_pr = cell._tc.get_or_add_tcPr()
        for old in tc_pr.findall(qn("w:tcBorders")):
            tc_pr.remove(old)
        tc_borders = OxmlElement("w:tcBorders")
        for edge in ("top", "left", "right"):
            element = OxmlElement(f"w:{edge}")
            element.set(qn("w:val"), "single")
            element.set(qn("w:sz"), "4")
            element.set(qn("w:space"), "0")
            element.set(qn("w:color"), "FFFFFF")
            tc_borders.append(element)
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), "6")
        bottom.set(qn("w:space"), "0")
        bottom.set(qn("w:color"), "000000")
        tc_borders.append(bottom)
        tc_pr.append(tc_borders)


def set_no_borders(table):
    tbl_pr = table._tbl.tblPr
    style_el = tbl_pr.find(qn("w:tblStyle"))
    if style_el is not None:
        tbl_pr.remove(style_el)
    for old in tbl_pr.findall(qn("w:tblBorders")):
        tbl_pr.remove(old)
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "none")
        borders.append(element)
    tbl_pr.insert_element_before(borders, "w:tblLayout", "w:tblCellMar", "w:tblLook")


def keep_row_together(row, repeat_header=False):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    tr_pr.append(cant_split)
    if repeat_header:
        header = OxmlElement("w:tblHeader")
        header.set(qn("w:val"), "true")
        tr_pr.append(header)


def add_table(doc, rows):
    if not rows:
        return
    cols = max(len(row) for row in rows)
    table = doc.add_table(rows=len(rows), cols=cols)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    for r_index, row in enumerate(rows):
        for c_index in range(cols):
            cell = table.cell(r_index, c_index)
            cell.text = ""
            paragraph = cell.paragraphs[0]
            paragraph.paragraph_format.space_before = Pt(2)
            paragraph.paragraph_format.space_after = Pt(2)
            value = row[c_index] if c_index < len(row) else ""
            add_hyperlink_text(paragraph, value, bold=(r_index == 0), size=9)
    set_three_line_borders(table)
    for index, row in enumerate(table.rows):
        keep_row_together(row, repeat_header=(index == 0))
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_code_block(doc, code_lines):
    """用 1×1 表格包住代码，避免长行换行后跑出灰底。"""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    set_no_borders(table)
    cell = table.cell(0, 0)
    cell.width = Cm(16.2)
    shade_cell(cell, "F5F5F5")

    first = True
    for line in code_lines:
        paragraph = cell.paragraphs[0] if first else cell.add_paragraph()
        first = False
        paragraph.paragraph_format.space_before = Pt(0)
        paragraph.paragraph_format.space_after = Pt(0)
        paragraph.paragraph_format.line_spacing = 1.0
        run = paragraph.add_run(line if line else " ")
        set_run_font(run, CODE_FONT, 8.2)

    if len(code_lines) < 28:
        keep_row_together(table.rows[0])
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_cover(doc):
    for _ in range(3):
        doc.add_paragraph()

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("实训8 中药材管理系统")
    set_run_font(run, HEAD_FONT, 28, True)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run("开发文档（前端 + 后端）")
    set_run_font(run, HEAD_FONT, 18, False)

    doc.add_paragraph()
    line = doc.add_paragraph()
    line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = line.add_run("—— 基于老师实训7 的 SpringBoot 工程与后台页面 ——")
    set_run_font(run, BODY_FONT, 11, False)

    for _ in range(3):
        doc.add_paragraph()

    info = doc.add_table(rows=4, cols=2)
    info.style = "Table Grid"
    info.alignment = WD_TABLE_ALIGNMENT.CENTER
    values = [
        ("项目位置", "D:\\course\\Javaweb\\实训8_中药材管理系统"),
        ("技术栈", "Spring Boot 3.5.16 + MyBatis 3.0.5 + MySQL 8 + Vue 3 + Element Plus"),
        ("数据库", "xm-pro（utf8mb4）"),
        ("日期", "2026 年 10 月 27 日"),
    ]
    for index, (key, value) in enumerate(values):
        left = info.cell(index, 0)
        right = info.cell(index, 1)
        left.text = ""
        right.text = ""
        p1 = left.paragraphs[0]
        p2 = right.paragraphs[0]
        r1 = p1.add_run(key)
        r2 = p2.add_run(value)
        set_run_font(r1, HEAD_FONT, 10, True)
        set_run_font(r2, BODY_FONT, 9.5)
    set_three_line_borders(info, header_line=False)

    doc.add_page_break()


def build():
    doc = Document()

    section = doc.sections[0]
    section.page_height = Cm(29.7)
    section.page_width = Cm(21.0)
    section.top_margin = Cm(2.2)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)

    normal = doc.styles["Normal"]
    normal.font.name = LATIN_FONT
    normal.font.size = Pt(10.5)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), CJK_FONT)
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.space_after = Pt(6)

    for name, size in (("Heading 1", 18), ("Heading 2", 14), ("Heading 3", 11.5)):
        style = doc.styles[name]
        style.font.name = LATIN_FONT
        style.font.size = Pt(size)
        style.element.rPr.rFonts.set(qn("w:eastAsia"), HEAD_FONT)
        style.font.color.rgb = BLACK

    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = header.add_run("中药材管理系统 · 开发文档")
    set_run_font(run, BODY_FONT, 9)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_page_number(footer)

    add_cover(doc)

    with open(MD_PATH, encoding="utf-8") as handle:
        lines = handle.read().splitlines()

    index = 0
    in_code = False
    code_buffer = []
    table_buffer = []
    skip_toc = False

    while index < len(lines):
        line = lines[index]
        stripped = line.strip()

        if in_code:
            if stripped.startswith("```"):
                add_code_block(doc, code_buffer)
                code_buffer = []
                in_code = False
            else:
                code_buffer.append(line)
            index += 1
            continue

        if stripped.startswith("```"):
            in_code = True
            index += 1
            continue

        if stripped.startswith("|"):
            table_buffer.append(stripped)
            index += 1
            if index >= len(lines) or not lines[index].strip().startswith("|"):
                add_table(doc, parse_table_block(table_buffer))
                table_buffer = []
            continue

        if stripped == "## 目录":
            skip_toc = True
            index += 1
            continue

        if skip_toc and stripped == "---":
            skip_toc = False
            index += 1
            continue

        if skip_toc:
            index += 1
            continue

        if not stripped:
            index += 1
            continue

        if stripped.startswith("# "):
            # 文档标题已在封面出现，正文里不再重复
            index += 1
            continue

        if stripped.startswith("## "):
            doc.add_heading(stripped[3:].strip().replace("`", ""), level=1)
            index += 1
            continue

        if stripped.startswith("### "):
            doc.add_heading(stripped[4:].strip().replace("`", ""), level=2)
            index += 1
            continue

        image_match = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", stripped)
        if image_match:
            image_path = os.path.join(BASE_DIR, "docs", image_match.group(2).replace("/", os.sep))
            if os.path.exists(image_path):
                paragraph = doc.add_paragraph()
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = paragraph.add_run()
                run.add_picture(image_path, width=Inches(6.0))
                caption = doc.add_paragraph()
                caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = caption.add_run(image_match.group(1))
                set_run_font(r, BODY_FONT, 9, False, "6B7D76")
            index += 1
            continue

        if stripped.startswith(">"):
            paragraph = doc.add_paragraph()
            paragraph.paragraph_format.left_indent = Cm(0.5)
            paragraph.paragraph_format.space_before = Pt(2)
            add_hyperlink_text(paragraph, stripped.lstrip("> ").strip(), size=9.5)
            for run in paragraph.runs:
                run.italic = True

            index += 1
            continue

        if re.match(r"^\d+\.\s+", stripped):
            text = re.sub(r"^\d+\.\s+", "", stripped)
            paragraph = doc.add_paragraph(style="List Number")
            add_hyperlink_text(paragraph, text)
            index += 1
            continue

        if stripped.startswith("- "):
            paragraph = doc.add_paragraph(style="List Bullet")
            add_hyperlink_text(paragraph, stripped[2:])
            index += 1
            continue

        if stripped == "---":
            index += 1
            continue

        paragraph = doc.add_paragraph()
        add_hyperlink_text(paragraph, stripped)
        index += 1

    doc.save(OUT_PATH)
    print(OUT_PATH)
    print("paragraphs:", len(doc.paragraphs))
    print("tables:", len(doc.tables))
    print("images:", len(doc.inline_shapes))


if __name__ == "__main__":
    build()

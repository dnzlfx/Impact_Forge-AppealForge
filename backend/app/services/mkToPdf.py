from pathlib import Path
import re
import shutil

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _clean_md_formatting(text: str) -> str:
    """Normalize markdown and unsupported HTML tags for ReportLab Paragraph parser."""
    text = re.sub(r"</?mark>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<br\s*/?>", "<br/>", text, flags=re.IGNORECASE)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*(.+?)\*", r"<i>\1</i>", text)
    text = re.sub(r"_(.+?)_", r"<i>\1</i>", text)
    return text


def _markdown_to_pdf_reportlab(md_filepath: Path, output_path: Path):
    """Fallback converter without external binaries using ReportLab."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    text = md_filepath.read_text(encoding="utf-8")

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    normal_style = styles["Normal"]
    normal_style.fontSize = 9.5
    normal_style.leading = 13

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Heading1"],
        fontSize=15,
        leading=18,
        spaceAfter=6,
    )
    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Heading2"],
        fontSize=12,
        leading=15,
        spaceBefore=8,
        spaceAfter=4,
    )
    h3_style = ParagraphStyle(
        "Heading3_Custom",
        parent=styles["Heading3"],
        fontSize=10.5,
        leading=13,
        spaceBefore=6,
        spaceAfter=3,
    )

    story = []
    lines = text.splitlines()
    in_table = False
    table_rows: list[list[str]] = []

    def flush_table():
        nonlocal in_table, table_rows
        if table_rows:
            col_count = max(len(r) for r in table_rows)
            processed_data = []
            for row in table_rows:
                padded = row + [""] * (col_count - len(row))
                row_paras = [
                    Paragraph(_clean_md_formatting(cell.strip()), normal_style)
                    for cell in padded
                ]
                processed_data.append(row_paras)

            t = Table(processed_data, repeatRows=1)
            t.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ]
                )
            )
            story.append(t)
            story.append(Spacer(1, 6))
            table_rows = []
        in_table = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            if all(re.match(r"^:?-+:?$", c) for c in cells if c):
                continue
            in_table = True
            table_rows.append(cells)
            continue
        elif in_table:
            flush_table()

        if not stripped:
            story.append(Spacer(1, 4))
            continue

        if stripped.startswith("# "):
            clean = re.sub(r"^#\s+", "", stripped)
            story.append(Paragraph(_clean_md_formatting(clean), h1_style))
        elif stripped.startswith("## "):
            clean = re.sub(r"^##\s+", "", stripped)
            story.append(Paragraph(_clean_md_formatting(clean), h2_style))
        elif stripped.startswith("### "):
            clean = re.sub(r"^###\s+", "", stripped)
            story.append(Paragraph(_clean_md_formatting(clean), h3_style))
        elif stripped.startswith("---") or stripped.startswith("***"):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=4, spaceAfter=4))
        else:
            story.append(Paragraph(_clean_md_formatting(stripped), normal_style))
            story.append(Spacer(1, 2))

    if in_table:
        flush_table()

    doc.build(story)


def markdown_to_pdf_pandoc(md_filepath: Path, output_path: Path):
    """Converts markdown file to PDF using pandoc if present, or ReportLab fallback."""
    if shutil.which("pandoc"):
        try:
            import pypandoc
            pypandoc.convert_file(
                str(md_filepath),
                "pdf",
                outputfile=str(output_path),
                extra_args=["-V", "geometry:margin=1in"],
            )
            return
        except Exception:
            pass

    _markdown_to_pdf_reportlab(md_filepath, output_path)

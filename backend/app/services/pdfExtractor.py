from pathlib import Path
import pymupdf4llm


class MarkdownStorageService:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def pdf_to_markdown(self, pdf_path: Path) -> dict:
        if not pdf_path.is_file():
            return {"status": "error", "message": "PDF no encontrado."}

        try:
            md_text = pymupdf4llm.to_markdown(str(pdf_path))
            md_filename = pdf_path.stem + ".md"
            md_filepath = self.output_dir / md_filename

            with open(md_filepath, "w", encoding="utf-8") as f:
                f.write(md_text)

            return {
                "status": "success",
                "markdown_content": md_text,
                "saved_path": md_filepath,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

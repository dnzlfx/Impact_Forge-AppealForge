# backend/app/services/markdown_extractor.py
import pymupdf4llm
from pathlib import Path

class MarkdownStorageService:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def pdf_to_markdown(self, pdf_path: Path) -> dict:

        # Extract the text content on PDF to MARKDOWN
        
        if not pdf_path.is_file():
            return {"status": "error", "message": "PDF no encontrado."}

        try:
            # With PyMuPDF we can convert everything, included tables to a string to Markdown

            md_text = pymupdf4llm.to_markdown(str(pdf_path))
            
            md_filename = pdf_path.stem + ".md"
            md_filepath = self.output_dir / md_filename
            
            with open(md_filepath, "w", encoding="utf-8") as f:
                f.write(md_text)
                
            return {
                "status": "success",
                "markdown_content": md_text,
                "saved_path": md_filepath
            }
            
        except Exception as e:
            return {"status": "error", "message": str(e)}

# 
# PROJECT_ROOT = Path(__file__).resolve().parents[3]
# PDF_PATH = PROJECT_ROOT / "docs" / "example.pdf"
# MD_OUTPUT_DIR = PROJECT_ROOT / "docs" / "markdown_raw"

# service = MarkdownStorageService(output_dir=MD_OUTPUT_DIR)
# resultado = service.pdf_to_markdown(PDF_PATH)

# if resultado["status"] == "success":
#    print("¡Markdown generado exitosamente!\n")
#    # Imprime los primeros 500 caracteres para verificar
#    print(resultado["markdown_content"][:500])
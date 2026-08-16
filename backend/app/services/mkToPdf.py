import pypandoc
from pathlib import Path


def markdown_to_pdf_pandoc(md_filepath: Path, output_path: Path):
    
    pypandoc.convert_file(
        str(md_filepath), 
        'pdf', 
        outputfile=str(output_path),
        extra_args=['-V', 'geometry:margin=1in']
    )
#
# PROJECT_ROOT = Path(__file__).resolve().parents[3]
# PDF_PATH = PROJECT_ROOT / "docs" / "finalExample.pdf"

# Cambié el nombre de la variable para que sea más descriptivo (es un archivo, no un directorio)
# MD_FILE_PATH = PROJECT_ROOT / "docs" / "markdown_raw" / "example.md"

# 1. Verificar que el archivo Markdown realmente exista antes de leerlo
# if MD_FILE_PATH.is_file():
    # 2. Leer el contenido del archivo como texto (string)
    
    # 3. Pasar el texto a tu función
#    markdown_to_pdf_pandoc(MD_FILE_PATH, PDF_PATH)
#else:
#    print(f"Error: No se encontró el archivo {MD_FILE_PATH}")

# markdown_to_pdf_pandoc(MD_FILE_PATH, PDF_PATH)
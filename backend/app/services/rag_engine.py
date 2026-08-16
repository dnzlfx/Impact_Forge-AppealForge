from pathlib import Path
from typing import List

import chromadb

from app.schemas.appeal import RagCitation

REPO_ROOT = Path(__file__).resolve().parents[3]
GUIDELINES_DIR = REPO_ROOT / "sample_data" / "guidelines"
DB_DIR = REPO_ROOT / "backend" / "data"

CHUNK_SIZE = 900
CHUNK_OVERLAP = 150


def _read_guidelines() -> List[tuple[str, str]]:
    """Read all .txt guidelines from disk -> list of (source_label, full_text)."""
    sources = []
    for path in sorted(GUIDELINES_DIR.glob("*.txt")):
        if path.name == "README.txt":
            continue
        text = path.read_text(encoding="utf-8").strip()
        if text:
            sources.append((path.stem.replace("_", " ").title(), text))
    return sources


def _chunk_text(text: str) -> List[str]:
    """Split a long guideline into overlapping chunks by paragraph/word."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    buffer = ""
    for para in paragraphs:
        if len(buffer) + len(para) > CHUNK_SIZE and buffer:
            chunks.append(buffer)
            buffer = buffer[-CHUNK_OVERLAP:] + para
        else:
            buffer = (buffer + "\n\n" + para).strip()
    if buffer:
        chunks.append(buffer)
    return chunks


class RAGEngine:
    def __init__(self):
        DB_DIR.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(DB_DIR))
        self.collection = self.client.get_or_create_collection(name="medical_guidelines")

        sources = _read_guidelines()
        docs, metas, ids = [], [], []
        for source, text in sources:
            for i, chunk in enumerate(_chunk_text(text)):
                docs.append(chunk)
                metas.append({"source": source})
                ids.append(f"{source}_{i}")

        if self.collection.count() != len(docs):
            self.client.delete_collection(name="medical_guidelines")
            self.collection = self.client.get_or_create_collection(name="medical_guidelines")
            if docs:
                self.collection.add(
                    documents=docs,
                    metadatas=metas,
                    ids=ids,
                )
            print(f"[RAG] Indexed {len(docs)} chunks from {len(sources)} guidelines into {DB_DIR}")

    def query_guidelines(self, query_text: str, n_results: int = 2) -> List[RagCitation]:
        if self.collection.count() == 0:
            return []
        results = self.collection.query(query_texts=[query_text], n_results=n_results)
        citations = []
        if results and results["documents"] and results["documents"][0]:
            for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
                citations.append(RagCitation(source=meta["source"], text=doc))
        return citations


rag_engine = RAGEngine()

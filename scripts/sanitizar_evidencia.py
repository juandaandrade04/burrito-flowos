# -*- coding: utf-8 -*-
"""Reemplaza la ruta absoluta del proyecto en evidencias de texto por <proyecto>.

Uso:
    python scripts/sanitizar_evidencia.py
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "evidence"

variantes = {
    str(ROOT),
    str(ROOT).replace("\\", "\\\\"),
    str(ROOT).replace("\\", "/"),
}

reemplazos = 0
for archivo in EVIDENCE.rglob("*"):
    if not archivo.is_file() or archivo.suffix.lower() not in {
        ".html", ".xml", ".txt", ".json", ".md", ".jtl"
    }:
        continue
    try:
        texto = archivo.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        continue
    nuevo = texto
    for variante in variantes:
        nuevo = nuevo.replace(variante, "<proyecto>")
    if nuevo != texto:
        archivo.write_text(nuevo, encoding="utf-8", errors="ignore")
        reemplazos += 1
        print(f"Sanitizado: {archivo.relative_to(ROOT)}")

# Log residual de la versión anterior con librería Browser (ya no aplica).
viejo = EVIDENCE / "entregable-1" / "robot" / "playwright-log.txt"
if viejo.exists():
    viejo.unlink()
    print("Eliminado log residual de Browser: playwright-log.txt")

print(f"Archivos modificados: {reemplazos}")

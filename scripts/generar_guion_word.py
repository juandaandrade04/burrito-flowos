# -*- coding: utf-8 -*-
"""Genera el guion de sustentación en Word a partir de GUION_SUSTENTACION.md.

Uso:
    python scripts/generar_guion_word.py

Salida:
    GUION_SUSTENTACION.docx
"""

import re
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

from generar_documento_word import (
    AZUL,
    AZUL_CLARO,
    GRIS,
    configuar_estilos,
    sombrear_parrafo,
    tabla,
)

ROOT = Path(__file__).resolve().parents[1]
FUENTE = ROOT / "GUION_SUSTENTACION.md"
OUT = ROOT / "GUION_SUSTENTACION.docx"

TOKEN = re.compile(r"(\*\*.*?\*\*|`.*?`|\[[^\]]*\])")
GRIS_TEXTO = "7F7F7F"


def limpiar(texto):
    """Quita los marcadores de Markdown para celdas de tabla."""
    texto = texto.replace("**", "").replace("`", "")
    return re.sub(r"\[([^\]]*)\]", r"\1", texto)


def add_inline(parrafo, texto):
    """Agrega texto con negrita, código y notas entre corchetes."""
    for parte in TOKEN.split(texto):
        if not parte:
            continue
        if parte.startswith("**") and parte.endswith("**"):
            r = parrafo.add_run(parte[2:-2])
            r.bold = True
        elif parte.startswith("`") and parte.endswith("`"):
            r = parrafo.add_run(parte[1:-1])
            r.font.name = "Consolas"
            r.font.size = Pt(9.5)
            rPr = r._element.get_or_add_rPr()
            rFonts = rPr.get_or_add_rFonts()
            rFonts.set(qn("w:ascii"), "Consolas")
            rFonts.set(qn("w:hAnsi"), "Consolas")
        elif parte.startswith("[") and parte.endswith("]"):
            r = parrafo.add_run(parte)
            r.italic = True
            r.font.color.rgb = RGBColor.from_string(GRIS_TEXTO)
        else:
            parrafo.add_run(parte)


def parrafo_normal(doc, texto):
    p = doc.add_paragraph()
    add_inline(p, texto)
    return p


def parrafo_leer(doc, texto):
    """Bloque sombreado con frase lista para decir en voz alta."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.right_indent = Inches(0.12)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    sombrear_parrafo(p, AZUL_CLARO)
    r = p.add_run("Para leer: ")
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(AZUL)
    add_inline(p, texto)
    return p


def parrafo_url(doc, texto):
    """URL para mostrar, en bloque monospace."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)
    sombrear_parrafo(p, GRIS)
    r = p.add_run(limpiar(texto))
    r.font.name = "Consolas"
    r.font.size = Pt(9.5)
    rPr = r._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:ascii"), "Consolas")
    rFonts.set(qn("w:hAnsi"), "Consolas")
    return p


def parrafo_nota(doc, texto):
    """Instrucción entre corchetes: qué mostrar en pantalla."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.15)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)
    sombrear_parrafo(p, "FFF2CC")
    r = p.add_run("Mostrar: ")
    r.bold = True
    add_inline(p, texto[1:-1])
    return p


def es_separador(fila):
    celdas = [c.strip() for c in fila.strip().strip("|").split("|")]
    return bool(celdas) and all(re.fullmatch(r":?-{3,}:?", c) for c in celdas)


def main():
    lineas = FUENTE.read_text(encoding="utf-8").splitlines()
    doc = Document()
    configuar_estilos(doc)

    seccion = doc.sections[0]
    seccion.top_margin = Inches(0.75)
    seccion.bottom_margin = Inches(0.7)
    seccion.left_margin = Inches(0.85)
    seccion.right_margin = Inches(0.85)

    doc.core_properties.title = "Guion de sustentación — Burrito FlowOS"
    doc.core_properties.subject = "Automatización, JMeter, Clarity y ZAP"
    doc.core_properties.author = "Equipo Burrito FlowOS"

    i = 0
    while i < len(lineas):
        linea = lineas[i].rstrip()

        if not linea or linea.strip() == "---":
            i += 1
            continue

        if linea.startswith("# "):
            p = doc.add_paragraph(style="Title")
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run(linea[2:])
            p2 = doc.add_paragraph()
            p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p2.add_run("Versión para compañeros · listo para leer en voz alta")
            r.font.size = Pt(10)
            r.font.color.rgb = RGBColor.from_string("595959")
            i += 1
            continue

        if linea.startswith("## "):
            doc.add_heading(linea[3:], level=1)
            i += 1
            continue

        if linea.startswith("### "):
            doc.add_heading(linea[4:], level=2)
            i += 1
            continue

        if linea.startswith("> "):
            bloque = []
            while i < len(lineas) and lineas[i].startswith(">"):
                contenido = lineas[i].lstrip(">").strip()
                if contenido:
                    bloque.append(contenido)
                i += 1
            texto = " ".join(bloque)
            if re.fullmatch(r"https?://\S+", limpiar(texto)):
                parrafo_url(doc, texto)
            else:
                parrafo_leer(doc, texto)
            continue

        if linea.startswith("|"):
            filas = []
            while i < len(lineas) and lineas[i].strip().startswith("|"):
                filas.append(lineas[i].strip())
                i += 1
            filas = [f for f in filas if not es_separador(f)]
            if filas:
                celdas = [[limpiar(c) for c in f.strip("|").split("|")] for f in filas]
                tabla(doc, celdas[0], celdas[1:], anchos=[2.4, 4.3])
            continue

        if linea.startswith("[") and linea.endswith("]"):
            parrafo_nota(doc, linea)
            i += 1
            continue

        parrafo_normal(doc, linea)
        i += 1

    # Pie de página con número de página.
    pie = seccion.footer.paragraphs[0]
    pie.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = pie.add_run("Burrito FlowOS · Guion de sustentación · ")
    r.font.size = Pt(8)
    r.font.color.rgb = RGBColor.from_string("595959")
    campo = OxmlElement("w:fldSimple")
    campo.set(qn("w:instr"), "PAGE")
    pie._p.append(campo)

    doc.save(OUT)
    print(f"Guion Word generado: {OUT}")


if __name__ == "__main__":
    main()

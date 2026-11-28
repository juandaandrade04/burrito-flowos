# -*- coding: utf-8 -*-
"""Genera una guía resumida en Word para ejecutar las pruebas en vivo.

Uso:
    python scripts/generar_guia_viva_word.py

Salida:
    GUIA_PRUEBAS_EN_VIVO.docx
"""

import os
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor

from generar_documento_word import (
    AZUL,
    AZUL_CLARO,
    AMARILLO,
    VERDE,
    codigo,
    configuar_estilos,
    nota,
    pie_de_pagina,
    sombrear_parrafo,
    tabla,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get("GUIA_OUT") or ROOT / "GUIA_PRUEBAS_EN_VIVO.docx")
TUNNEL = "https://jacob-editor-could-travels.trycloudflare.com/#/login"


def leer(doc, texto, color=AZUL_CLARO):
    """Bloque con frase lista para leer en voz alta."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.right_indent = Inches(0.12)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(10)
    sombrear_parrafo(p, color)
    r = p.add_run("Para leer: ")
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(AZUL)
    r2 = p.add_run(texto)
    r2.italic = True
    return p


def titulo(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(40)
    r = p.add_run("GUÍA RÁPIDA DE PRUEBAS EN VIVO")
    r.font.size = Pt(24)
    r.font.bold = True
    r.font.color.rgb = RGBColor.from_string(AZUL)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Burrito FlowOS — Pantalla de Login")
    r.font.size = Pt(14)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("JMeter · Microsoft Clarity · OWASP ZAP")
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor.from_string("595959")

    nota(
        doc,
        "Estado: aplicación, microservicios, MongoDB y túnel público encendidos. "
        "Puedes empezar la demostración sin levantar nada más.",
        VERDE,
    )


def antes(doc):
    doc.add_heading("Antes de empezar", level=1)
    doc.add_paragraph("Comprueba que la app responda (30 segundos):")
    codigo(
        doc,
        "Invoke-WebRequest http://localhost:3000/health -UseBasicParsing\n"
        "Invoke-WebRequest http://localhost:4002/health -UseBasicParsing",
    )
    tabla(
        doc,
        ["Si todo está bien", "Si algo falla"],
        [
            ["Ambos devuelven 200", "Vuelve a levantar: node server.js y los servicios en 4001-4004"],
        ],
        anchos=[3.2, 3.5],
    )
    nota(
        doc,
        "Orden recomendado: JMeter → Clarity → ZAP. No corras ZAP mientras JMeter mide, "
        "porque el active scan genera tráfico extra y contamina los tiempos.",
    )

    doc.add_heading("Orden y tiempos", level=2)
    tabla(
        doc,
        ["Momento", "Qué hacer", "Tiempo"],
        [
            ["1", "Mostrar la app y hacer login manual", "1 min"],
            ["2", "Ejecutar JMeter y abrir el dashboard", "2 min"],
            ["3", "Clarity en vivo con F12 → Network", "2 min"],
            ["4", "Ejecutar ZAP y abrir el reporte", "2 min"],
            ["5", "Mostrar el Word y conclusiones", "2 min"],
        ],
        anchos=[0.9, 4.7, 1.1],
    )


def jmeter(doc):
    doc.add_heading("1. JMeter en vivo", level=1)
    doc.add_paragraph("Ejecuta desde la raíz del proyecto:")
    codigo(doc, "cd <raíz del proyecto>\nnpm run test:jmeter")

    doc.add_paragraph("Verás en consola un resumen parecido a:")
    codigo(doc, "summary = 120 in 00:00:14 = 8.7/s Avg: 1464 Min: 5 Max: 6674 Err: 0 (0.00%)")

    doc.add_paragraph("Abre el dashboard:")
    codigo(doc, "start evidence\\entregable-2\\jmeter\\report\\index.html")

    doc.add_heading("Qué mostrar", level=2)
    for x in [
        "Resumen: 120 requests y 0 errores.",
        "Gráfica de tiempos de respuesta.",
        "Tabla por etiqueta: GET / ≈ 13.9 ms; POST /api/v1/auth/login ≈ 2914.8 ms.",
    ]:
        doc.add_paragraph(x, style="List Bullet")

    leer(
        doc,
        "Simulamos 20 usuarios concurrentes, con 5 segundos de ramp-up y 3 iteraciones por usuario, "
        "para un total de 120 peticiones. Validamos que el login devuelva 'Login exitoso'. "
        "La corrida terminó sin errores. El endpoint más costoso es el POST de autenticación porque "
        "bcrypt es intensivo en CPU; de ahí el promedio de 1,46 segundos.",
    )
    nota(
        doc,
        "Hallazgo extra: con 50 usuarios aparecieron timeouts y respuestas 502. "
        "Por eso se ajustó la carga a 20 para tener una línea base limpia.",
    )

    doc.add_heading("Archivos que genera", level=2)
    codigo(
        doc,
        "evidence/entregable-2/jmeter/results.jtl\n"
        "evidence/entregable-2/jmeter/report/index.html",
    )

    doc.add_heading("Si quieres ver la interfaz gráfica", level=2)
    codigo(doc, "jmeter   # o & $env:JMETER_BAT")
    doc.add_paragraph("Luego: File → Open → tests\\jmeter\\login.jmx y botón verde de Play.")


def clarity(doc):
    doc.add_heading("2. Microsoft Clarity en vivo", level=1)
    doc.add_paragraph("URL final del túnel (mantener abierto y compartir con el grupo):")
    codigo(doc, TUNNEL)
    nota(
        doc,
        "Entren varios integrantes desde PC y celular, hagan login y den clics reales. El script "
        "automático puede ser descartado por Clarity como bot; la interacción manual asegura datos.",
        VERDE,
    )

    doc.add_heading("Pasos en el navegador", level=2)
    for i, txt in enumerate(
        [
            "Abre la URL pública con #/login.",
            "Presiona F12 → pestaña Network.",
            "En el filtro escribe: clarity.ms.",
            "Recarga y haz login con admin@burritoflowos.com / Admin123!.",
            "Deja visible la lista de peticiones.",
        ],
        start=1,
    ):
        doc.add_paragraph(f"{i}. {txt}", style="List Number")

    tabla(
        doc,
        ["Petición", "Estado", "Qué significa"],
        [
            ["www.clarity.ms/tag/zkk57nzpdj", "200", "Tag del proyecto cargado"],
            ["scripts.clarity.ms/.../clarity.js", "200", "Script ejecutado"],
            ["r.clarity.ms/collect o l.clarity.ms/collect", "204", "Eventos enviados"],
        ],
        anchos=[3.0, 0.9, 2.8],
    )

    leer(
        doc,
        "Clarity está integrado en el index.html del frontend con el Project ID zkk57nzpdj. "
        "Como la app está en localhost, la expuse con un túnel público. En Network se ve el tag "
        "cargando con 200 y los eventos enviados con 204, lo que confirma que la sesión real del "
        "login está siendo recolectada.",
    )

    doc.add_heading("Si aparece '¡Casi terminamos!'", level=2)
    leer(
        doc,
        "Clarity empieza a recolectar al instante, pero el propio producto indica que pueden pasar "
        "hasta 2 horas antes de que el dashboard muestre datos. Por eso dejamos evidencia técnica "
        "del envío con los códigos 200 y 204.",
        AMARILLO,
    )

    doc.add_heading("Si el túnel se cae", level=2)
    codigo(doc, "cloudflared tunnel --url http://localhost:3000")
    doc.add_paragraph("Copia la nueva URL del log y úsala en el paso 1.")

    doc.add_heading("Regenerar evidencia de Clarity", level=2)
    codigo(doc, "node tests\\clarity\\capturar-vivo.mjs")

    doc.add_heading("Archivos que genera / usa", level=2)
    codigo(
        doc,
        "evidence/entregable-2/clarity/evidencia-red-vivo.json\n"
        "evidence/entregable-2/clarity/clarity-vivo-login.png\n"
        "evidence/entregable-2/clarity/clarity-vivo-dashboard.png",
    )


def zap(doc):
    doc.add_heading("3. OWASP ZAP en vivo", level=1)
    codigo(
        doc,
        "cd <raíz del proyecto>\n"
        "$env:ZAP_BAT = '<ruta local>\\ZAP_2.17.0\\zap.bat'\n"
        "npm run test:zap",
    )

    doc.add_paragraph("Qué hace internamente:")
    for x in [
        "Levanta ZAP en daemon en el puerto 8090.",
        "Corre el spider sobre http://localhost:3000/.",
        "Registra un login válido y otro inválido vía proxy (node tests/zap/trafico-login.mjs).",
        "Corre el active scan, incluido el endpoint de autenticación.",
        "Exporta reportes en HTML y JSON y un resumen con alertas e instancias.",
        "Apaga el daemon automáticamente.",
    ]:
        doc.add_paragraph(x, style="List Bullet")

    doc.add_paragraph("Abre el resultado:")
    codigo(
        doc,
        "start evidence\\entregable-2\\zap\\report.html\n"
        "Get-Content evidence\\entregable-2\\zap\\resumen.json -Raw",
    )
    codigo(
        doc,
        "Alertas: High 0, Medium 3, Low 2, Informational 3\n"
        "Instancias: High 0, Medium 6, Low 10, Informational 7",
    )

    leer(
        doc,
        "Ejecutamos spider, registramos el formulario de login a través del proxy y aplicamos active "
        "scan. No hay riesgos altos; hay 3 medios, 2 bajos y 3 informativos. Los hallazgos principales "
        "son Missing Anti-clickjacking Header, CSP y X-Content-Type-Options ausentes, además de "
        "X-Powered-By. Son recomendaciones de endurecimiento, no bloqueantes.",
    )

    doc.add_heading("Archivos que genera", level=2)
    codigo(
        doc,
        "evidence/entregable-2/zap/report.html\n"
        "evidence/entregable-2/zap/report.json\n"
        "evidence/entregable-2/zap/resumen.json",
    )

    doc.add_heading("Si quieres ver la interfaz gráfica", level=2)
    codigo(doc, "& $env:ZAP_BAT   # o ejecuta zap.bat desde tu carpeta portable")
    doc.add_paragraph("Quick Start → URL to scan → http://localhost:3000.")


def final(doc):
    doc.add_heading("Problemas rápidos", level=1)
    tabla(
        doc,
        ["Síntoma", "Solución"],
        [
            ["JMeter: 'Results file is not empty'", "Vuelve a correr npm run test:jmeter; el script limpia el JTL"],
            ["ZAP no responde en :8090", "No dejes otra instancia corriendo; el script ya usa el directorio correcto"],
            ["Clarity no muestra datos", "Es normal hasta 2 horas; valida con los 200/204 en Network"],
            ["La URL del túnel cambió", "Reinicia cloudflared y copia la nueva URL del log"],
            ["La app no responde", "Verifica /health y vuelve a levantar node server.js"],
        ],
        anchos=[2.6, 4.1],
    )

    doc.add_heading("Hoja de trucos", level=1)
    codigo(
        doc,
        "# Health\n"
        "Invoke-WebRequest http://localhost:3000/health -UseBasicParsing\n\n"
        "# JMeter\n"
        "npm run test:jmeter\n\n"
        "# Clarity\n"
        "node tests\\clarity\\capturar-vivo.mjs\n\n"
        "# ZAP\n"
        "npm run test:zap\n\n"
        "# Túnel\n"
        "cloudflared tunnel --url http://localhost:3000\n\n"
        "# Robot (SeleniumLibrary)\n"
        "npm run test:robot",
    )
    nota(doc, "Todo lo anterior se ejecuta desde la raíz del proyecto.", VERDE)


def main():
    doc = Document()
    configuar_estilos(doc)
    section = doc.sections[0]
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.85)
    section.right_margin = Inches(0.85)

    doc.core_properties.title = "Guía rápida de pruebas en vivo — Burrito FlowOS"
    doc.core_properties.subject = "JMeter, Microsoft Clarity y OWASP ZAP"
    pie_de_pagina(doc)

    titulo(doc)
    antes(doc)
    jmeter(doc)
    clarity(doc)
    zap(doc)
    final(doc)

    doc.save(OUT)
    print(f"Guía generada: {OUT}")


if __name__ == "__main__":
    main()

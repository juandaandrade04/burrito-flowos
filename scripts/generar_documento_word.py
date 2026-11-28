# -*- coding: utf-8 -*-
"""Genera un documento Word con la documentación completa de las pruebas.

Uso:
    python scripts/generar_documento_word.py

Salida:
    DOCUMENTACION_PRUEBAS_BURRITO_FLOWOS.docx
"""

from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "DOCUMENTACION_PRUEBAS_BURRITO_FLOWOS.docx"

E1 = ROOT / "evidence" / "entregable-1"
E2 = ROOT / "evidence" / "entregable-2"

AZUL = "1F4E79"
AZUL_CLARO = "D9EAF7"
GRIS = "F2F2F2"
VERDE = "E2F0D9"
AMARILLO = "FFF2CC"


def sombrear_parrafo(p, color):
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    pPr.append(shd)


def sombrear_celda(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tcPr.append(shd)


def configuar_estilos(doc):
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10.5)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.15

    for name, size, color in [
        ("Title", 26, AZUL),
        ("Heading 1", 16, AZUL),
        ("Heading 2", 13, AZUL),
        ("Heading 3", 11, AZUL),
    ]:
        st = doc.styles[name]
        st.font.name = "Calibri"
        st.font.size = Pt(size)
        st.font.color.rgb = RGBColor.from_string(color)
        st.font.bold = True

    caption = doc.styles["Caption"]
    caption.font.name = "Calibri"
    caption.font.size = Pt(8.5)
    caption.font.italic = True
    caption.font.color.rgb = RGBColor.from_string("595959")
    caption.paragraph_format.space_after = Pt(10)


def codigo(doc, texto):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.right_indent = Inches(0.1)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)
    sombrear_parrafo(p, GRIS)
    run = p.add_run(texto)
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:ascii"), "Consolas")
    rFonts.set(qn("w:hAnsi"), "Consolas")
    return p


def nota(doc, texto, color=AMARILLO):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.15)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    sombrear_parrafo(p, color)
    r = p.add_run("Nota: ")
    r.bold = True
    p.add_run(texto)
    return p


def tabla(doc, encabezados, filas, anchos=None, estilo="Table Grid"):
    t = doc.add_table(rows=1, cols=len(encabezados))
    t.style = estilo
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0].cells
    for i, h in enumerate(encabezados):
        hdr[i].text = ""
        p = hdr[i].paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.color.rgb = RGBColor.from_string("FFFFFF")
        r.font.size = Pt(9)
        sombrear_celda(hdr[i], AZUL)
    for fila in filas:
        cells = t.add_row().cells
        for i, valor in enumerate(fila):
            cells[i].text = ""
            p = cells[i].paragraphs[0]
            r = p.add_run(str(valor))
            r.font.size = Pt(9)
    if anchos:
        for row in t.rows:
            for i, w in enumerate(anchos):
                row.cells[i].width = Inches(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def imagen(doc, ruta, ancho=6.0, titulo=None):
    if not Path(ruta).exists():
        nota(doc, f"No se encontró la evidencia: {ruta}")
        return
    doc.add_picture(str(ruta), width=Inches(ancho))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    if titulo:
        p = doc.add_paragraph(titulo, style="Caption")
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER


def imagenes_en_tabla(doc, items, cols=2, ancho=2.65):
    """items = [(ruta, titulo), ...]"""
    filas = (len(items) + cols - 1) // cols
    t = doc.add_table(rows=filas, cols=cols)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    idx = 0
    for fila in t.rows:
        for cell in fila.cells:
            if idx >= len(items):
                cell.text = ""
                continue
            ruta, titulo = items[idx]
            cell.text = ""
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if Path(ruta).exists():
                run = p.add_run()
                run.add_picture(str(ruta), width=Inches(ancho))
            cp = cell.add_paragraph(titulo, style="Caption")
            cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
            idx += 1
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def pie_de_pagina(doc):
    section = doc.sections[0]
    p = section.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("Burrito FlowOS — Documentación de pruebas | Página ")
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor.from_string("7F7F7F")

    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "end")
    r = p.add_run()
    r._r.append(fld1)
    r._r.append(instr)
    r._r.append(fld2)
    r.font.size = Pt(8)
    r.font.color.rgb = RGBColor.from_string("7F7F7F")


def portada(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(70)
    r = p.add_run("PROYECTO FINAL — COMPUTACIÓN ORIENTADA A SERVICIOS (SOA)")
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor.from_string("595959")
    r.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(24)
    r = p.add_run("Documentación técnica de pruebas")
    r.font.size = Pt(28)
    r.font.bold = True
    r.font.color.rgb = RGBColor.from_string(AZUL)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Burrito FlowOS\nSistema de Gestión de Ventas e Insumos")
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor.from_string("404040")

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(22)
    r = p.add_run("Pantalla evaluada: Login (http://localhost:3000/#/login)")
    r.font.size = Pt(12)
    r.bold = True

    tabla(
        doc,
        ["Entregable", "Enfoque", "Herramientas", "Fecha"],
        [
            ["1", "Automatización funcional", "Playwright + Robot Framework", "27/11/2026"],
            ["2", "Pruebas especializadas", "JMeter + OWASP ZAP + Microsoft Clarity", "28/11/2026"],
        ],
        anchos=[1.0, 1.7, 2.7, 1.2],
    )

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(30)
    r = p.add_run("Documento preparado para la exposición y sustentación ante el profesor.")
    r.italic = True
    r.font.color.rgb = RGBColor.from_string("595959")

    doc.add_page_break()


def indice(doc):
    doc.add_heading("Contenido", level=1)
    items = [
        "1. Introducción y objetivo",
        "2. Sistema bajo prueba",
        "3. Guía de instalación y puesta en marcha",
        "4. Entregable 1 — Automatización de la pantalla de Login",
        "5. Entregable 2 — Pruebas especializadas",
        "6. Matriz de evidencias",
        "7. Guion sugerido para la exposición",
        "8. Conclusiones y recomendaciones",
        "9. Anexos: comandos, estructura y solución de problemas",
    ]
    for it in items:
        p = doc.add_paragraph(it, style="List Number")
        p.paragraph_format.space_after = Pt(3)
    doc.add_page_break()


def seccion1(doc):
    doc.add_heading("1. Introducción y objetivo", level=1)
    doc.add_paragraph(
        "Este documento reúne la planificación, ejecución, resultados y evidencias de las pruebas "
        "realizadas sobre Burrito FlowOS, un sistema de gestión de ventas e insumos desarrollado "
        "con arquitectura de microservicios. El trabajo se dividió en dos entregables: el primero "
        "centrado en automatización funcional y el segundo en pruebas especializadas de carga, "
        "seguridad y usabilidad."
    )
    doc.add_paragraph(
        "El objetivo general fue validar una única pantalla —el inicio de sesión— desde tres "
        "perspectivas complementarias: que el flujo funcione de forma repetible (automatización), "
        "que soporte carga razonable (desempeño), que no exponga vulnerabilidades altas (seguridad) "
        "y que pueda observarse el comportamiento del usuario (usabilidad/practicidad)."
    )
    doc.add_heading("1.1 Objetivos específicos", level=2)
    for txt in [
        "Automatizar tres escenarios de Login con dos enfoques distintos: código (Playwright) y palabras clave (Robot Framework).",
        "Medir el comportamiento del endpoint de autenticación ante 20 usuarios concurrentes con JMeter.",
        "Ejecutar spider y active scan con OWASP ZAP para identificar riesgos de seguridad.",
        "Integrar Microsoft Clarity para capturar señales de uso real de la pantalla mediante un túnel público.",
        "Dejar evidencia verificable (reportes HTML, capturas y logs) para la sustentación.",
    ]:
        doc.add_paragraph(txt, style="List Bullet")

    doc.add_heading("1.2 Alcance", level=2)
    tabla(
        doc,
        ["Elemento", "Detalle"],
        [
            ["Pantalla seleccionada", "Login — http://localhost:3000/#/login"],
            ["Endpoints probados", "GET /, POST /api/v1/auth/login, health checks de servicios"],
            ["Perfiles de prueba", "Administrador y cajero (credenciales de demostración)"],
            ["Entorno", "Local (Node + MongoDB) y URL pública temporal con Cloudflare Tunnel"],
            ["Fuera de alcance", "Despliegue definitivo en Docker/Kubernetes (diferido por el equipo)"],
        ],
        anchos=[1.8, 4.9],
    )
    nota(
        doc,
        "El despliegue general en Docker/Kubernetes se dejó para una etapa posterior; no fue necesario "
        "para ejecutar ninguna de las pruebas de este documento.",
    )


def seccion2(doc):
    doc.add_heading("2. Sistema bajo prueba", level=1)
    doc.add_paragraph(
        "La aplicación está compuesta por un frontend React + TypeScript servido por un gateway "
        "Express, cuatro microservicios REST y una base de datos MongoDB. Todas las peticiones "
        "del frontend pasan por el gateway, que también expone una capa GraphQL usada por el dashboard."
    )
    tabla(
        doc,
        ["Componente", "Tecnología", "Puerto / URL", "Función"],
        [
            ["Frontend", "React 19 + TypeScript + Vite", "http://localhost:3000/#/login", "Interfaz de usuario, incluida la pantalla de Login"],
            ["API Gateway", "Node.js + Express", "http://localhost:3000/api/v1/", "Autenticación, proxy a microservicios y GraphQL"],
            ["Auth service", "Node.js + Express", "http://localhost:4002", "Validación de credenciales y bcrypt"],
            ["Inventory service", "Node.js + Express", "http://localhost:4001", "Insumos"],
            ["Recetas service", "Node.js + Express", "http://localhost:4003", "Recetas"],
            ["Sales service", "Node.js + Express", "http://localhost:4004", "Ventas"],
            ["Base de datos", "MongoDB", "localhost:27017", "Persistencia de usuarios, insumos, recetas y ventas"],
        ],
        anchos=[1.3, 1.7, 2.0, 1.7],
    )

    doc.add_heading("2.1 Credenciales de demostración", level=2)
    tabla(
        doc,
        ["Perfil", "Correo", "Contraseña", "Uso en pruebas"],
        [
            ["Administrador", "admin@burritoflowos.com", "Admin123!", "Playwright, Robot, JMeter, Clarity"],
            ["Cajero", "cajero@burritoflowos.com", "Cajero123!", "Validación de roles (referencia)"],
        ],
        anchos=[1.2, 2.4, 1.3, 1.8],
    )
    nota(doc, "Estas credenciales son creadas por el seed de demostración y están documentadas en README.md. No se incluye ninguna clave secreta de .env en este documento.", VERDE)


def seccion3(doc):
    doc.add_heading("3. Guía de instalación y puesta en marcha", level=1)
    doc.add_paragraph(
        "Esta sección permite reproducir el entorno completo desde cero. Los comandos están en "
        "PowerShell/Windows, que es el entorno donde se ejecutaron las pruebas."
    )

    doc.add_heading("3.1 Requisitos generales", level=2)
    tabla(
        doc,
        ["Requisito", "Versión recomendada", "Se usa para"],
        [
            ["Node.js", "v18 o superior", "Gateway, microservicios y build de React"],
            ["MongoDB", "Community local o Atlas", "Base de datos del sistema"],
            ["Python", "3.11 o superior", "Robot Framework y generación de este documento"],
            ["Java", "17 o 21 (Temurin/OpenJDK)", "JMeter y OWASP ZAP"],
            ["winget", "Integrado en Windows 10/11", "Instalación de JMeter, ZAP y cloudflared"],
            ["Cuenta Microsoft", "Cualquier cuenta personal", "Crear el proyecto de Microsoft Clarity"],
            ["Navegador Chromium", "Gestionado por Playwright", "Automatización y revisión de evidencias"],
        ],
        anchos=[1.5, 2.0, 3.2],
    )

    doc.add_heading("3.2 Instalar y arrancar la aplicación", level=2)
    codigo(
        doc,
        "cd <raíz del proyecto>\n"
        "npm install\n"
        "Copy-Item .env.example .env\n"
        "# Revisar .env (MONGO_URI, JWT_SECRET). NO subir .env al repositorio.\n"
        "npm run seed\n"
        "npm --prefix frontend-react install\n"
        "npm --prefix frontend-react run build\n"
        "npm start",
    )
    doc.add_paragraph(
        "Si se desea trabajar con recarga automática, se puede usar npm run dev. En modo desarrollo "
        "Vite levanta el frontend en http://localhost:5173 y redirige /api hacia el gateway en :3000."
    )

    doc.add_heading("3.3 Verificación rápida", level=2)
    codigo(
        doc,
        "# Health checks\n"
        "Invoke-RestMethod http://localhost:3000/health\n"
        "Invoke-RestMethod http://localhost:4001/health\n"
        "Invoke-RestMethod http://localhost:4002/health\n"
        "Invoke-RestMethod http://localhost:4003/health\n"
        "Invoke-RestMethod http://localhost:4004/health\n\n"
        "# Prueba manual de login\n"
        "$body = @{ email='admin@burritoflowos.com'; password='Admin123!' } | ConvertTo-Json\n"
        "Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/v1/auth/login `\n"
        "  -ContentType 'application/json' -Body $body",
    )

    doc.add_heading("3.4 Instalación de las herramientas de prueba", level=2)
    doc.add_heading("Playwright", level=3)
    codigo(doc, "npm install\nnpx playwright install chromium")
    doc.add_heading("Robot Framework + SeleniumLibrary", level=3)
    codigo(
        doc,
        "python -m pip install -r tests/robot/requirements.txt\n"
        "# Requiere Google Chrome; Selenium Manager descarga el driver automáticamente",
    )
    nota(
        doc,
        "Se usa SeleniumLibrary (Selenium/WebDriver), no la librería Browser, para que las dos suites "
        "sean tecnológicamente independientes y coincidan con lo visto en clase.",
        VERDE,
    )

    doc.add_heading("Apache JMeter 5.6.3", level=3)
    codigo(
        doc,
        "winget install --id DEVCOM.JMeter --source winget `\n"
        "  --accept-package-agreements --accept-source-agreements\n\n"
        "# El script detecta jmeter.bat en PATH o en %LOCALAPPDATA%\\Programs\\JMeter\\bin.\n"
        "# Si está en otra carpeta: $env:JMETER_BAT = '<ruta>\\jmeter.bat'",
    )

    doc.add_heading("OWASP ZAP 2.17.0", level=3)
    doc.add_paragraph(
        "El instalador silencioso de winget terminó con error en este entorno, por lo que se utilizó "
        "el paquete portable Core desde los releases oficiales de GitHub."
    )
    codigo(
        doc,
        "$dir = '<carpeta local para ZAP>'\n"
        "New-Item -ItemType Directory -Force -Path $dir | Out-Null\n"
        "Invoke-WebRequest -Uri 'https://github.com/zaproxy/zaproxy/releases/download/v2.17.0/ZAP_2.17.0_Core.zip' `\n"
        "  -OutFile \"$dir\\zap-core.zip\"\n"
        "Expand-Archive \"$dir\\zap-core.zip\" -DestinationPath $dir -Force\n\n"
        "# El script scan.ps1 necesita esta variable:\n"
        "$env:ZAP_BAT = \"$dir\\ZAP_2.17.0\\zap.bat\"",
    )

    doc.add_heading("Cloudflare Tunnel y Microsoft Clarity", level=3)
    codigo(
        doc,
        "winget install --id Cloudflare.cloudflared --source winget `\n"
        "  --accept-package-agreements --accept-source-agreements\n\n"
        "cloudflared tunnel --url http://localhost:3000",
    )
    doc.add_paragraph(
        "Para Clarity: entrar a https://clarity.microsoft.com/, iniciar sesión con una cuenta "
        "Microsoft, crear el proyecto Burrito FlowOS usando la URL del túnel y copiar el Project ID. "
        "En este trabajo el ID fue zkk57nzpdj."
    )

    doc.add_heading("3.5 Despliegue alternativo (referencia, no ejecutado)", level=2)
    doc.add_paragraph(
        "El repositorio incluye manifiestos para Docker Compose y Kubernetes. No se usaron en las "
        "pruebas porque el despliegue general se dejó para después, pero se documentan para completar la guía."
    )
    codigo(
        doc,
        "# Docker Compose (referencia)\n"
        "docker compose up --build\n"
        "docker compose exec api-gateway npm run seed\n\n"
        "# Kubernetes (referencia)\n"
        "kubectl apply -k k8s\n"
        "kubectl port-forward -n burrito-flowos svc/frontend 8080:80",
    )


def seccion4(doc):
    doc.add_heading("4. Entregable 1 — Automatización de la pantalla de Login", level=1)
    doc.add_paragraph(
        "Se automatizaron los mismos tres casos con dos herramientas distintas para demostrar dos "
        "estilos de trabajo: Playwright mediante código JavaScript y Robot Framework mediante "
        "palabras clave legibles con SeleniumLibrary. Playwright usa Chromium y Robot usa Google "
        "Chrome a través de Selenium/WebDriver; son tecnologías independientes y usan los mismos selectores."
    )

    doc.add_heading("4.1 Casos automatizados", level=2)
    tabla(
        doc,
        ["#", "Caso de prueba", "Resultado esperado"],
        [
            ["1", "Login correcto con administrador", "Redirección a #/dashboard y texto 'Dashboard' visible"],
            ["2", "Contraseña incorrecta", "Mensaje 'Credenciales incorrectas.' y permanencia en #/login"],
            ["3", "Campos vacíos", "Mensaje 'Por favor completa todos los campos.'"],
        ],
        anchos=[0.5, 2.7, 3.5],
    )

    doc.add_heading("4.2 Selectores estables", level=2)
    tabla(
        doc,
        ["Elemento", "Selector"],
        [
            ["Correo electrónico", "#email"],
            ["Contraseña", "#password"],
            ["Botón de ingreso", "button.login-btn"],
            ["Mensaje de error", ".alert-inline.error"],
        ],
        anchos=[2.2, 4.5],
    )

    doc.add_heading("4.3 Ejecución", level=2)
    codigo(
        doc,
        "# Playwright\n"
        "npm run test:e2e\n\n"
        "# Robot Framework\n"
        "npm run test:robot\n\n"
        "# Modo presentación (navegador visible)\n"
        "$env:HEADED='1'; npx playwright test\n"
        "python -m robot --variable HEADLESS:False --outputdir evidence/entregable-1/robot tests/robot/login.robot\n\n"
        "# Si la app está en otro puerto\n"
        "$env:BASE_URL='http://localhost:8080'; npx playwright test\n"
        "python -m robot --variable BASE_URL:http://localhost:8080 --outputdir evidence/entregable-1/robot tests/robot/login.robot",
    )

    doc.add_heading("4.4 Resultados", level=2)
    tabla(
        doc,
        ["Suite", "Casos", "Pasados", "Fallidos", "Evidencia principal"],
        [
            ["Playwright", "3", "3", "0", "playwright-report/index.html"],
            ["Robot Framework (SeleniumLibrary)", "3", "3", "0", "robot/report.html y robot/log.html"],
        ],
        anchos=[1.5, 0.8, 0.9, 0.9, 2.6],
    )
    nota(doc, "Resultado 3/3 en ambas suites. Las seis capturas se guardaron en evidence/entregable-1/capturas/.", VERDE)

    doc.add_heading("4.5 Evidencias visuales de la automatización", level=2)
    imagenes_en_tabla(
        doc,
        [
            (E1 / "capturas" / "playwright-login-ok.png", "Playwright — login correcto"),
            (E1 / "capturas" / "robot-login-ok.png", "Robot/Selenium — login correcto"),
            (E1 / "capturas" / "playwright-login-invalido.png", "Playwright — credenciales inválidas"),
            (E1 / "capturas" / "robot-login-invalido.png", "Robot/Selenium — credenciales inválidas"),
            (E1 / "capturas" / "playwright-login-vacios.png", "Playwright — campos vacíos"),
            (E1 / "capturas" / "robot-login-vacios.png", "Robot/Selenium — campos vacíos"),
        ],
    )

    doc.add_heading("4.6 Reportes HTML", level=2)
    imagen(doc, E2 / "capturas" / "reporte-playwright.png", 6.0, "Figura 1. Reporte HTML de Playwright: 3 pruebas aprobadas.")
    imagen(doc, E2 / "capturas" / "reporte-robot.png", 6.0, "Figura 2. Reporte HTML de Robot Framework: 3 pruebas aprobadas.")

    doc.add_heading("4.7 Valor de usar dos enfoques", level=2)
    doc.add_paragraph(
        "Playwright permite escribir aserciones explícitas con expect y es ideal para integración "
        "continua. Robot Framework usa palabras clave de SeleniumLibrary (Input Text, Click Button, "
        "Wait Until Element Is Visible) que resultan más legibles para perfiles no técnicos. "
        "Al ejecutar ambos sobre el mismo caso "
        "de uso se comprueba que el resultado no depende de la herramienta, sino del comportamiento "
        "real de la aplicación."
    )


def seccion5(doc):
    doc.add_heading("5. Entregable 2 — Pruebas especializadas", level=1)
    doc.add_paragraph(
        "Este entregable aplicó tres técnicas complementarias sobre la misma pantalla de Login: "
        "prueba de carga con JMeter, análisis de seguridad con OWASP ZAP y observación de usabilidad "
        "con Microsoft Clarity."
    )

    # ---------------- JMeter ----------------
    doc.add_heading("5.1 JMeter — Pruebas de carga y desempeño", level=2)
    doc.add_paragraph(
        "El plan de pruebas simuló usuarios que abren la pantalla de Login y envían credenciales "
        "válidas. Se validó el código HTTP y el contenido de la respuesta de autenticación."
    )
    tabla(
        doc,
        ["Parámetro", "Valor"],
        [
            ["Plan de pruebas", "tests/jmeter/login.jmx"],
            ["Script de ejecución", "tests/jmeter/run.ps1"],
            ["Usuarios concurrentes", "20"],
            ["Ramp-up", "5 segundos"],
            ["Iteraciones por usuario", "3"],
            ["Requests totales", "120"],
            ["Endpoints", "GET / y POST /api/v1/auth/login"],
            ["Assertion", "La respuesta del login contiene 'Login exitoso'"],
            ["Timeout de respuesta", "30 segundos"],
        ],
        anchos=[2.0, 4.7],
    )
    codigo(
        doc,
        "cd <raíz del proyecto>\n"
        ".\\tests\\jmeter\\run.ps1\n\n"
        "# Equivalente npm:\n"
        "npm run test:jmeter",
    )
    doc.add_paragraph(
        "El script elimina resultados anteriores, ejecuta el plan en modo no interactivo y genera un "
        "dashboard HTML. Esto evita el error 'Results file is not empty' en corridas repetidas."
    )

    doc.add_heading("5.1.1 Resultados de JMeter", level=3)
    tabla(
        doc,
        ["Métrica", "Valor"],
        [
            ["Requests totales", "120"],
            ["Errores", "0 (0.00%)"],
            ["Tiempo mínimo", "5 ms"],
            ["Tiempo promedio general", "1464.4 ms"],
            ["Percentil 95", "4154 ms"],
            ["Tiempo máximo", "6674 ms"],
            ["GET / promedio", "13.9 ms (60 peticiones)"],
            ["POST /api/v1/auth/login promedio", "2914.8 ms (60 peticiones)"],
        ],
        anchos=[2.8, 3.9],
    )
    nota(
        doc,
        "Primera corrida exploratoria con 50 usuarios: aparecieron 206 timeouts y 6 respuestas 502 en el login. "
        "La causa es el costo de CPU de bcrypt. Se ajustó la carga a 20 usuarios y la corrida final quedó sin errores. "
        "Este hallazgo es parte del análisis de desempeño.",
    )
    imagen(
        doc,
        E2 / "capturas" / "reporte-jmeter.png",
        6.0,
        "Figura 3. Dashboard HTML de JMeter con el resumen de la corrida en vivo (01:49).",
    )

    # ---------------- ZAP ----------------
    doc.add_heading("5.2 OWASP ZAP — Pruebas de seguridad", level=2)
    doc.add_paragraph(
        "Se levantó ZAP en modo daemon a través de su API, se ejecutó un spider sobre la raíz de la "
        "aplicación y, mediante un navegador que pasa por el proxy de ZAP, se hicieron un login válido "
        "y uno inválido para registrar el formulario. Después se ejecutó el active scan. El script "
        "cierra el daemon automáticamente y exporta reportes en HTML y JSON."
    )
    codigo(
        doc,
        "# Fases automatizadas por tests/zap/scan.ps1\n"
        "1. Start-Process zap.bat -daemon -port 8090 -config api.disablekey=true\n"
        "2. GET /JSON/core/view/version/\n"
        "3. GET /JSON/spider/action/scan/?url=http://localhost:3000/\n"
        "4. node tests/zap/trafico-login.mjs  (login válido e inválido vía proxy)\n"
        "5. GET /JSON/ascan/action/scan/?url=http://localhost:3000/\n"
        "6. GET /OTHER/core/other/htmlreport/ y /jsonreport/\n\n"
        "# Ejecución (definir $env:ZAP_BAT con la ruta local a zap.bat):\n"
        ".\\tests\\zap\\scan.ps1\n"
        "# Equivalente npm:\n"
        "npm run test:zap",
    )

    doc.add_heading("5.2.1 Resultados de ZAP", level=3)
    tabla(
        doc,
        ["Nivel de riesgo", "Alertas (tipos únicos)", "Instancias", "Interpretación"],
        [
            ["High", "0", "0", "No se encontraron vulnerabilidades críticas"],
            ["Medium", "3", "6", "Cabeceras, CORS y anti-clickjacking"],
            ["Low", "2", "10", "Información exponible y detalles menores"],
            ["Informational", "3", "7", "Huellas tecnológicas y observaciones generales"],
        ],
        anchos=[1.2, 1.2, 1.0, 3.3],
    )
    nota(
        doc,
        "El resumen anterior (7/8/38) contabilizaba instancias acumuladas por la API alertsSummary, "
        "no alertas. Ahora resumen.json se calcula desde el reporte exportado: alertas = tipos únicos "
        "e instancias = suma del campo count.",
    )
    doc.add_paragraph("Alertas principales detectadas:")
    for a in [
        "Missing Anti-clickjacking Header",
        "X-Content-Type-Options Header Missing",
        "Content Security Policy (CSP) Header Not Set",
        "Server Leaks Information via X-Powered-By",
        "Cross-Domain Misconfiguration",
        "Information Disclosure — Suspicious Comments",
        "Modern Web Application y User Agent Fuzzer (informativas)",
    ]:
        doc.add_paragraph(a, style="List Bullet")
    doc.add_paragraph(
        "Recomendación técnica: agregar cabeceras de seguridad en Express (CSP, X-Content-Type-Options "
        "y X-Frame-Options), desactivar X-Powered-By y revisar la configuración CORS para permitir solo "
        "orígenes necesarios. El endpoint POST /api/v1/auth/login quedó incluido en el análisis gracias "
        "al tráfico del formulario registrado vía proxy."
    )
    imagen(
        doc,
        E2 / "capturas" / "reporte-zap.png",
        6.0,
        "Figura 4. Reporte HTML actualizado de OWASP ZAP: 0/3/2/3 alertas.",
    )

    # ---------------- Clarity ----------------
    doc.add_heading("5.3 Microsoft Clarity — Usabilidad y practicidad", level=2)
    doc.add_paragraph(
        "Clarity se integró para observar el recorrido real del usuario en la pantalla de Login. Como "
        "la aplicación estaba en localhost, se expuso temporalmente con Cloudflare Tunnel para que el "
        "servicio pudiera cargar el tag y recibir eventos."
    )
    tabla(
        doc,
        ["Elemento", "Valor"],
        [
            ["Project ID", "zkk57nzpdj"],
            ["Nombre del proyecto", "Burrito FlowOS"],
            ["URL final del túnel", "https://quad-scene-ceremony-world.trycloudflare.com/#/login"],
            ["Túnel", "cloudflared tunnel --url http://localhost:3000"],
            ["Snippet", "frontend-react/index.html, antes de </head>"],
            ["Recompilación", "npm --prefix frontend-react run build"],
        ],
        anchos=[1.7, 5.0],
    )
    codigo(
        doc,
        '<script type="text/javascript">\n'
        "  (function (c, l, a, r, i, t, y) {\n"
        "    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };\n"
        '    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;\n'
        "    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);\n"
        '  })(window, document, "clarity", "script", "zkk57nzpdj");\n'
        "</script>",
    )

    doc.add_heading("5.3.1 Verificación técnica", level=3)
    tabla(
        doc,
        ["Petición observada", "Estado", "Significado"],
        [
            ["https://www.clarity.ms/tag/zkk57nzpdj", "200", "Tag del proyecto cargado"],
            ["https://scripts.clarity.ms/.../clarity.js", "200", "Script ejecutado correctamente"],
            ["https://c.clarity.ms/c.gif", "302 / 200", "Inicio de sesión y sincronización"],
            ["https://r.clarity.ms/collect", "204", "Eventos de la sesión enviados"],
        ],
        anchos=[2.9, 1.0, 2.8],
    )
    doc.add_paragraph(
        "El código 204 en /collect confirma que Clarity está recolectando la sesión real del recorrido: "
        "carga del Login, llenado de credenciales, click en Iniciar sesión y llegada al Dashboard."
    )
    doc.add_paragraph(
        "El túnel se mantiene abierto y la URL final se compartió con el grupo para que varias personas "
        "entren desde PC y celular, hagan login y den clics reales. Las sesiones generadas por el script "
        "automático pueden ser descartadas por Clarity como bot, por lo que la interacción manual es la "
        "que asegura datos de usabilidad aprovechables."
    )

    doc.add_heading("5.3.2 Estado del panel visual", level=3)
    doc.add_paragraph(
        "Al iniciar sesión en Clarity se entró al proyecto Burrito FlowOS, pero el panel continúa en "
        "la pantalla '¡Casi terminamos!'. El propio producto indica que pueden pasar hasta 2 horas "
        "antes de ver datos por primera vez, y el FAQ oficial coincide: después de instalar el script "
        "Clarity empieza a recolectar de inmediato, pero el dashboard tarda unas horas en procesarlos. "
        "Esto no es un fallo de integración: el snippet coincide con el generado por Clarity y el tráfico "
        "/collect responde 204."
    )
    nota(
        doc,
        "Pendiente de procesamiento por el proveedor: heatmap-login.png (mapa de calor del Login), "
        "grabacion-login.png (sesión real) y metricas-proyecto.png (clics muertos, clics de rabia y "
        "tiempo en la página). Se capturarán cuando el panel muestre datos y con ellas se redactará el "
        "análisis corto de usabilidad.",
    )
    imagen(doc, E2 / "clarity" / "clarity-login-pantalla.png", 5.6, "Figura 5. Pantalla de Login sirviéndose con el snippet de Clarity activo.")
    imagen(doc, E2 / "clarity" / "clarity-login-sesion.png", 5.6, "Figura 6. Dashboard alcanzado tras el login dentro de la sesión monitorizada.")
    imagen(doc, E2 / "clarity" / "clarity-codigo-instalado-2-horas.png", 5.6, "Figura 7. Clarity muestra el mismo snippet y advierte de hasta 2 horas de procesamiento.")
    imagen(doc, E2 / "clarity" / "clarity-estado-datos-pendientes.png", 5.6, "Figura 8. Estado actual del panel de Clarity: '¡Casi terminamos!'.")
    imagen(doc, E2 / "clarity" / "clarity-faq-tiempo-procesamiento.png", 5.6, "Figura 9. FAQ oficial de Microsoft Clarity sobre el tiempo de aparición de datos.")
    doc.add_paragraph(
        "En la sesión en vivo se generó tráfico adicional por la nueva URL pública y se guardó el "
        "detalle de las respuestas en evidencia-red-vivo.json (3 respuestas 200, 2 redirecciones 302 "
        "y 3 envíos 204 a /collect)."
    )
    imagen(doc, E2 / "clarity" / "clarity-vivo-login.png", 5.6, "Figura 10. Recorrido en vivo: Login sobre el túnel público actual.")
    imagen(doc, E2 / "clarity" / "clarity-vivo-dashboard.png", 5.6, "Figura 11. Recorrido en vivo: Dashboard alcanzado tras el login monitorizado.")


def seccion6(doc):
    doc.add_heading("6. Matriz de evidencias", level=1)
    doc.add_paragraph(
        "La siguiente tabla relaciona cada archivo de evidencia con lo que demuestra. Todas las rutas "
        "son relativas a la raíz del repositorio."
    )
    filas = [
        ["evidence/entregable-1/capturas/*.png", "6 capturas (3 por herramienta) de los casos de Login", "Funcionalidad"],
        ["evidence/entregable-1/playwright-report/index.html", "Reporte HTML con 3/3 pruebas aprobadas", "Funcionalidad"],
        ["evidence/entregable-1/robot/report.html", "Reporte HTML de Robot Framework con 3/3", "Funcionalidad"],
        ["evidence/entregable-1/robot/log.html", "Log detallado de ejecución paso a paso", "Funcionalidad"],
        ["evidence/entregable-2/jmeter/results.jtl", "120 muestras, 0 errores, tiempos por etiqueta", "Desempeño"],
        ["evidence/entregable-2/jmeter/report/index.html", "Dashboard HTML de JMeter", "Desempeño"],
        ["evidence/entregable-2/zap/report.html", "Reporte HTML de spider + tráfico del login + active scan", "Seguridad"],
        ["evidence/entregable-2/zap/report.json", "Detalle de alertas e instancias por riesgo", "Seguridad"],
        ["evidence/entregable-2/zap/resumen.json", "Alertas 0/3/2/3 e instancias 0/6/10/7; login probado", "Seguridad"],
        ["tests/zap/trafico-login.mjs", "Registro del formulario vía proxy de ZAP", "Seguridad"],
        ["evidence/entregable-2/clarity/evidencia-red.md", "Peticiones 200/204 a clarity.ms", "Usabilidad"],
        ["evidence/entregable-2/clarity/clarity-login-pantalla.png", "Login con snippet activo", "Usabilidad"],
        ["evidence/entregable-2/clarity/clarity-login-sesion.png", "Dashboard tras login monitorizado", "Usabilidad"],
        ["evidence/entregable-2/clarity/clarity-codigo-instalado-2-horas.png", "Snippet idéntico y aviso de 2 horas", "Usabilidad"],
        ["evidence/entregable-2/clarity/clarity-estado-datos-pendientes.png", "Panel en configuración", "Usabilidad"],
        ["evidence/entregable-2/clarity/clarity-faq-tiempo-procesamiento.png", "FAQ oficial de procesamiento", "Usabilidad"],
        ["evidence/entregable-2/clarity/evidencia-red-vivo.json", "8 respuestas de clarity.ms en la corrida en vivo", "Usabilidad"],
        ["evidence/entregable-2/clarity/clarity-vivo-login.png", "Login del recorrido en vivo", "Usabilidad"],
        ["evidence/entregable-2/clarity/clarity-vivo-dashboard.png", "Dashboard del recorrido en vivo", "Usabilidad"],
        ["evidence/entregable-2/capturas/*.png", "Capturas de los reportes para este documento", "Documentación"],
    ]
    tabla(doc, ["Ruta", "Qué demuestra", "Categoría"], filas, anchos=[3.0, 2.7, 1.0])


def seccion7(doc):
    doc.add_heading("7. Guion sugerido para la exposición", level=1)
    doc.add_paragraph(
        "Secuencia de 10 a 12 minutos para mostrar el trabajo ante el profesor. Cada paso indica qué "
        "ejecutar y qué explicar."
    )
    pasos = [
        ("1. Contexto (1 min)", "Mostrar README.md y explicar la arquitectura: React → gateway Express → microservicios → MongoDB. Indicar que el análisis se centra en Login."),
        ("2. Aplicación (1 min)", "Abrir http://localhost:3000/#/login e iniciar sesión con admin@burritoflowos.com / Admin123!. Mostrar el dashboard."),
        ("3. Automatización Playwright (2 min)", "Ejecutar npm run test:e2e con HEADED=1 para que se vea el navegador. Mostrar después el reporte playwright-report/index.html."),
        ("4. Automatización Robot (2 min)", "Ejecutar npm run test:robot con HEADLESS:False. Aclarar que usa SeleniumLibrary, no Browser. Mostrar robot/report.html y una de las capturas."),
        ("5. Carga JMeter (2 min)", "Ejecutar npm run test:jmeter. Explicar 20 usuarios, 3 iteraciones y 120 peticiones. Abrir el dashboard y remarcar 0 errores y el promedio de 1.46 s."),
        ("6. Hallazgo de desempeño (1 min)", "Explicar la corrida de 50 usuarios con timeouts/502 y que el cuello está en bcrypt; por eso se ajustó la carga."),
        ("7. Seguridad ZAP (2 min)", "Ejecutar npm run test:zap con ZAP_BAT definido. Mostrar resumen.json (0 altos, 3 medios, 2 bajos, 3 informativos) y el reporte HTML. Mencionar el login probado vía proxy, Missing Anti-clickjacking, CSP y X-Powered-By."),
        ("8. Clarity (2 min)", "Mostrar el snippet en frontend-react/index.html, la URL final https://quad-scene-ceremony-world.trycloudflare.com/#/login y las peticiones 200/204 de evidencia-red-vivo.json. Comentar que el grupo entró desde PC y celular y que Clarity puede descartar las sesiones del script como bot."),
        ("9. Cierre (1 min)", "Mostrar la matriz de evidencias y las conclusiones."),
    ]
    tabla(doc, ["Paso", "Acción y mensaje clave"], pasos, anchos=[2.0, 4.7])

    doc.add_heading("7.1 Frase de cierre sugerida", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.2)
    sombrear_parrafo(p, AZUL_CLARO)
    r = p.add_run(
        "“Sobre la pantalla de Login aplicamos tres pruebas especializadas. Con JMeter simulamos 20 "
        "usuarios concurrentes y validamos 120 peticiones sin errores; el login es el punto más costoso "
        "por bcrypt. Con OWASP ZAP corrimos spider, registramos el formulario vía proxy y aplicamos "
        "active scan: 0 riesgos altos y 3 medios, sobre todo cabeceras de seguridad ausentes. Con "
        "Microsoft Clarity integramos el tag mediante un túnel público, verificamos el envío de eventos "
        "y compartimos la URL con el grupo para generar sesiones reales; el dashboard visual quedará "
        "disponible una vez el proveedor procese los datos.”"
    )
    r.italic = True


def seccion8(doc):
    doc.add_heading("8. Conclusiones y recomendaciones", level=1)
    tabla(
        doc,
        ["Área", "Conclusión", "Recomendación"],
        [
            ["Funcionalidad", "3/3 casos aprobados en Playwright y en Robot/SeleniumLibrary", "Mantener los selectores estables y ejecutar en CI"],
            ["Desempeño", "20 usuarios sin errores; 50 usuarios generaron timeouts y 502", "Ajustar parámetros de bcrypt, aplicar rate limiting y escalar el servicio de autenticación"],
            ["Seguridad", "0 riesgos altos; 3 medios y 2 bajos; login incluido en el escaneo", "Añadir CSP, X-Content-Type-Options, X-Frame-Options, ocultar X-Powered-By y revisar CORS"],
            ["Usabilidad", "Tag 200 y eventos /collect 204; túnel abierto y grupo generando sesiones reales", "Esperar hasta 2 horas, descargar heatmap, grabación y métricas, y redactar el análisis"],
        ],
        anchos=[1.2, 2.8, 2.7],
    )
    doc.add_paragraph(
        "El conjunto de pruebas permitió cubrir tres dimensiones de calidad complementarias sobre un "
        "mismo caso de uso. La automatización demostró consistencia funcional, JMeter reveló el "
        "cuello de CPU del hash de contraseñas, ZAP entregó una línea base de seguridad sin riesgos "
        "altos y Clarity dejó instalada la observación de comportamiento real del usuario."
    )


def seccion9(doc):
    doc.add_heading("9. Anexos: comandos, estructura y solución de problemas", level=1)

    doc.add_heading("9.1 Comandos rápidos", level=2)
    tabla(
        doc,
        ["Acción", "Comando"],
        [
            ["Arrancar app", "npm start"],
            ["Cargar datos demo", "npm run seed"],
            ["Playwright", "npm run test:e2e"],
            ["Robot", "npm run test:robot"],
            ["JMeter", "npm run test:jmeter"],
            ["ZAP", "npm run test:zap"],
            ["Túnel público", "cloudflared tunnel --url http://localhost:3000"],
            ["Recompilar frontend", "npm --prefix frontend-react run build"],
        ],
        anchos=[1.8, 4.9],
    )

    doc.add_heading("9.2 Estructura de evidencias y scripts", level=2)
    codigo(
        doc,
        "tests/\n"
        "├── e2e/login.spec.js\n"
        "├── robot/login.robot\n"
        "├── jmeter/login.jmx\n"
        "├── jmeter/run.ps1\n"
        "├── zap/scan.ps1\n"
        "└── clarity/SNIPPET.md\n\n"
        "evidence/\n"
        "├── entregable-1/\n"
        "│   ├── capturas/\n"
        "│   ├── playwright-report/\n"
        "│   └── robot/\n"
        "└── entregable-2/\n"
        "    ├── jmeter/\n"
        "    ├── zap/\n"
        "    ├── clarity/\n"
        "    └── capturas/",
    )

    doc.add_heading("9.3 Solución de problemas", level=2)
    tabla(
        doc,
        ["Síntoma", "Causa probable", "Solución"],
        [
            ["JMeter: 'Results file is not empty'", "Corrida repetida sin limpiar JTL", "El script run.ps1 ya elimina results.jtl y el reporte"],
            ["ZAP no responde en :8090", "Directorio de trabajo incorrecto", "scan.ps1 usa -WorkingDirectory donde está zap.bat"],
            ["ZAP API sin clave", "Protección por API key", "Se inicia con -config api.disablekey=true"],
            ["Clarity sigue en '¡Casi terminamos!'", "Procesamiento pendiente del proveedor", "Verificar /collect 204 y esperar hasta 2 horas"],
            ["Playwright no encuentra Chromium", "Navegador no descargado", "npx playwright install chromium"],
            ["Robot/Selenium falla", "Chrome o dependencias ausentes", "python -m pip install -r tests/robot/requirements.txt e instalar Google Chrome"],
        ],
        anchos=[2.2, 2.2, 2.3],
    )

    doc.add_heading("9.4 Notas finales", level=2)
    for txt in [
        "No se subió el archivo .env ni ninguna clave secreta al repositorio.",
        "El Project ID de Clarity es público por diseño; forma parte del snippet del sitio.",
        "Este documento y el script generador se pueden versionar sin exponer credenciales.",
    ]:
        doc.add_paragraph(txt, style="List Bullet")


def main():
    doc = Document()
    configuar_estilos(doc)
    section = doc.sections[0]
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.85)
    section.right_margin = Inches(0.85)

    doc.core_properties.title = "Documentación técnica de pruebas — Burrito FlowOS"
    doc.core_properties.subject = "Automatización, carga, seguridad y usabilidad de la pantalla de Login"
    doc.core_properties.keywords = "JMeter, OWASP ZAP, Microsoft Clarity, Playwright, Robot Framework"
    doc.core_properties.comments = "Generado con scripts/generar_documento_word.py"

    pie_de_pagina(doc)

    portada(doc)
    indice(doc)
    seccion1(doc)
    seccion2(doc)
    seccion3(doc)
    seccion4(doc)
    seccion5(doc)
    seccion6(doc)
    seccion7(doc)
    seccion8(doc)
    seccion9(doc)

    doc.save(OUT)
    print(f"Documento generado: {OUT}")


if __name__ == "__main__":
    main()

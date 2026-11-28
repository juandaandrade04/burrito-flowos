*** Settings ***
Documentation    Automatización de la pantalla de Login con Robot Framework y SeleniumLibrary.
Library          SeleniumLibrary

Test Setup       Abrir Login
Test Teardown    Cerrar Navegador


*** Variables ***
${BASE_URL}          http://localhost:3000
${URL}               ${BASE_URL}/#/login
${BROWSER}           chrome
${HEADLESS}          True
${ADMIN_EMAIL}       admin@burritoflowos.com
${ADMIN_PASSWORD}    Admin123!
${PASSWORD_MALO}     PasswordIncorrecta123!
${CAPTURAS}          ${CURDIR}/../../evidence/entregable-1/capturas
${TIMEOUT}           15s


*** Keywords ***
Abrir Login
    Run Keyword If      ${HEADLESS}    Open Browser    ${URL}    ${BROWSER}    options=add_argument("--headless=new");add_argument("--window-size=1365,900")
    Run Keyword If      not ${HEADLESS}    Open Browser    ${URL}    ${BROWSER}
    Set Browser Implicit Wait    ${TIMEOUT}
    Wait Until Element Is Visible    id:email    timeout=${TIMEOUT}

Cerrar Navegador
    Close Browser

Tomar Captura
    [Arguments]    ${nombre}
    Capture Page Screenshot    filename=${CAPTURAS}/${nombre}.png

Enviar Credenciales
    [Arguments]    ${correo}    ${clave}
    Input Text    id:email    ${correo}
    Input Text    id:password    ${clave}
    Click Button    css:button.login-btn


*** Test Cases ***
Login correcto con administrador
    [Documentation]    Credenciales válidas redirigen al dashboard.
    Enviar Credenciales    ${ADMIN_EMAIL}    ${ADMIN_PASSWORD}
    Wait Until Page Contains Element    css:main h1    timeout=${TIMEOUT}
    ${titulo}=    Get Text    css:main h1
    Should Be Equal    ${titulo}    Dashboard
    ${url}=    Get Location
    Should Contain    ${url}    /#/dashboard
    Tomar Captura    robot-login-ok

Login con contraseña incorrecta
    [Documentation]    Una contraseña inválida muestra el error de credenciales.
    Enviar Credenciales    ${ADMIN_EMAIL}    ${PASSWORD_MALO}
    Wait Until Element Is Visible    css:.alert-inline.error    timeout=${TIMEOUT}
    ${mensaje}=    Get Text    css:.alert-inline.error
    Should Contain    ${mensaje}    Credenciales incorrectas.
    ${url}=    Get Location
    Should Contain    ${url}    /#/login
    Tomar Captura    robot-login-invalido

Validación de campos vacíos
    [Documentation]    El formulario no permite enviar sin correo y contraseña.
    Click Button    css:button.login-btn
    Wait Until Element Is Visible    css:.alert-inline.error    timeout=${TIMEOUT}
    ${mensaje}=    Get Text    css:.alert-inline.error
    Should Contain    ${mensaje}    Por favor completa todos los campos.
    Tomar Captura    robot-login-vacios

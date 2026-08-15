# ESPECIFICACIÓN DE REQUISITOS DE SOFTWARE

**Sistema de Gestión Administrativa y de Caja**

*Documento de referencia para estudiantes*

| Dato | Valor |
|---|---|
| Versión | 1.0 |
| Fecha | 20 de julio de 2026 |

---

## 1. Propósito y alcance

Este documento describe los requisitos del Sistema de Gestión Administrativa y de Caja. El sistema apoya la administración de socios, puestos, giros, servicios, cuentas por cobrar, ingresos, egresos, bancos, comprobantes y reportes.

La aplicación consume servicios REST externos, por lo que las reglas de autorización, integridad y persistencia deben confirmarse también con el backend y los usuarios del negocio.

---

## 2. Actores y entidades principales

| Elemento | Descripción / responsabilidad |
|---|---|
| Operador de caja | Inicia sesión, consulta deudas, registra pagos, ingresos, egresos y descarga reportes. |
| Administrador | Gestiona catálogos de socios, puestos, giros, servicios y bancos. |
| Socio | Persona asociada con código, nombres, apellidos, acción, etapa y fecha de nacimiento. |
| Puesto | Unidad o local asociado a un socio y giro; puede contener inquilino y vigencia. |
| Servicio / cuenta | Concepto cobrable con recurrencia, costo, moneda, destino de cargo y, opcionalmente, consumo. |
| Recibo | Comprobante correlativo de ingreso, egreso o movimiento bancario. |
| Banco | Cuenta bancaria disponible para registrar o canjear operaciones. |

---

## 3. Convenciones de redacción

| Campo | Convención |
|---|---|
| Identificador | RF-XX para requisitos funcionales y RNF-XX para requisitos no funcionales. |
| Redacción | Usar "El sistema deberá...", evitando términos ambiguos. |
| Prioridad | Alta: indispensable; Media: importante; Baja: deseable. |
| Criterio de aceptación | Evidencia observable para comprobar el requisito. |
| Origen | Módulo de frontend donde se observó la funcionalidad. |

---

## 4. Requisitos funcionales

Los requisitos siguientes expresan el comportamiento del sistema.

### 4.1 Acceso y sesión

| ID | Requisito | Pri. | Criterio de aceptación |
|---|---|---|---|
| RF-01 | Permitir iniciar sesión con usuario y contraseña. | Alta | Con credenciales válidas se almacena la sesión y se abren recibos. |
| RF-02 | Impedir el acceso a la aplicación cuando no exista un token de sesión válido. | Alta | Sin token se redirige a inicio de sesión. |
| RF-03 | Mostrar la identidad del usuario autenticado en el encabezado. | Media | El encabezado muestra el nombre, apellido o identificador del token. |
| RF-04 | Permitir cerrar sesión y eliminar la credencial local. | Alta | Después del cierre se muestra acceso y no queda token disponible. |

> **Historia de usuario:** Como usuario del sistema, quiero iniciar y cerrar sesión de forma segura, para acceder solo a la información que me corresponde y proteger mis credenciales.

### 4.2 Catálogos

| ID | Requisito | Pri. | Criterio de aceptación |
|---|---|---|---|
| RF-05 | Listar los socios registrados. | Alta | Se visualiza una tabla con sus datos principales. |
| RF-06 | Crear y editar socios con código, nombres, apellidos, acción, etapa y fecha de nacimiento. | Alta | Al guardar, el socio aparece actualizado en el listado. |
| RF-07 | Eliminar un socio previa confirmación del operador. | Media | Luego de confirmar, el socio deja de aparecer en el listado. |
| RF-08 | Listar, crear, editar y eliminar giros comerciales. | Media | Los cambios quedan disponibles al registrar un puesto. |
| RF-09 | Listar, crear, editar y eliminar puestos. | Alta | El listado permite abrir el formulario o eliminar un puesto. |
| RF-10 | Asociar cada puesto a un giro y, cuando corresponda, a un socio. | Alta | El formulario permite seleccionar ambas referencias existentes. |
| RF-11 | Registrar número, datos de inquilino y período de vigencia del puesto. | Media | Los valores se conservan al reabrir el puesto. |
| RF-12 | Listar, crear, editar y eliminar bancos o cuentas bancarias. | Alta | Se administran nombre, cuenta, CCI y moneda. |

> **Historia de usuario:** Como administrador, quiero gestionar los catálogos de socios, puestos, giros y bancos, para mantener actualizada la información base que utiliza el resto del sistema.

### 4.3 Servicios y cuentas por cobrar

| ID | Requisito | Pri. | Criterio de aceptación |
|---|---|---|---|
| RF-13 | Listar, crear, editar y eliminar servicios cobrables. | Alta | El usuario administra servicios desde su listado y formulario. |
| RF-14 | Configurar un servicio con recurrencia, costo, moneda y destinatario del cargo. | Alta | Los atributos quedan asociados tras guardar. |
| RF-15 | Indicar si un servicio es costo fijo o depende de consumo. | Media | El formulario conserva ambos indicadores. |
| RF-16 | Generar cuentas por cobrar de un servicio para puestos indicando período y monto. | Alta | Al guardar se crean las cuentas por puesto. |
| RF-17 | Registrar lecturas iniciales/finales y calcular el monto de servicios por consumo. | Alta | El importe es diferencia positiva por costo unitario; si no hay consumo positivo, es cero. |
| RF-18 | Generar cuentas por cobrar para socios filtrables por etapa y por socios únicos. | Alta | El operador puede seleccionar etapas y filtro de duplicados. |

> **Historia de usuario:** Como administrador, quiero configurar servicios y generar las cuentas por cobrar correspondientes a puestos y socios, para poder cobrar correctamente los conceptos vigentes de cada período.

### 4.4 Cobranza e ingresos

| ID | Requisito | Pri. | Criterio de aceptación |
|---|---|---|---|
| RF-19 | Consultar cuentas por cobrar buscando por socio o por puesto. | Alta | Al seleccionar la entidad se muestran sus cuentas asociadas. |
| RF-20 | Separar cuentas de socios. | Media | Cada cuenta aparece en la sección que corresponde. |
| RF-21 | Marcar cuentas como abonadas o exoneradas antes de procesar un pago. | Alta | Las marcas se reflejan en el proceso de pago. |
| RF-22 | Calcular y mostrar el total de las cuentas seleccionadas para pago. | Alta | El total equivale a la suma de cuentas abonadas. |
| RF-23 | Procesar pagos de cuentas por puesto y socio y emitir recibos para las abonadas. | Alta | Se actualizan cuentas y se generan recibos con correlativo. |
| RF-24 | Canjear una cuenta de socio por una operación bancaria indicando banco y fecha de depósito. | Media | Se registra recibo bancario asociado a cuenta y banco. |
| RF-25 | Registrar ingresos externos con depositante, categoría, concepto y monto. | Alta | Se crea un recibo y el movimiento aparece en recibos. |
| RF-26 | Abrir en otra ventana un resumen de cuentas por socio o puesto. | Media | El resumen muestra cuentas y movimientos relacionados. |

> **Historia de usuario:** Como operador de caja, quiero consultar las cuentas por cobrar de un socio o puesto y procesar su pago, para registrar la cobranza y emitir el recibo correspondiente de forma confiable.

### 4.5 Egresos, comprobantes y reportes

| ID | Requisito | Pri. | Criterio de aceptación |
|---|---|---|---|
| RF-27 | Registrar egresos individuales con documento, proveedor, fecha, importes, documento asociado y motivo. | Alta | El egreso queda registrado y puede generar comprobante. |
| RF-28 | Registrar egresos masivos mediante carga de archivo. | Media | El operador selecciona un archivo y se procesa su contenido. |
| RF-29 | Listar recibos de ingreso por fecha y visualizar el voucher de uno seleccionado. | Alta | La lista se actualiza por fecha y muestra el comprobante. |
| RF-30 | Listar comprobantes de egresos por mes y permitir visualizar, anular o procesar el seleccionado. | Alta | El usuario ejecuta las acciones disponibles sobre el egreso. |
| RF-31 | Listar recibos bancarios por fecha y visualizar su voucher. | Media | Se muestran los recibos bancarios del día elegido. |
| RF-32 | Descargar reportes XLSX para movimientos diarios, totales y mensuales. | Alta | Se descarga un Excel al seleccionar fecha/mes y tipo. |
| RF-33 | Generar reportes específicos de socios, no socios, egresos y bancos. | Alta | Cada opción descarga el reporte del período elegido. |

> **Historia de usuario:** Como operador de caja, quiero registrar egresos y descargar reportes de movimientos, para llevar el control de la caja y sustentar la información ante la administración.

---

## 5. Reglas de negocio identificadas

| ID | Regla de negocio | Evidencia funcional |
|---|---|---|
| RN-01 | Un puesto puede estar asociado a un socio y a un giro comercial. | El formulario de puesto solicita ambas referencias. |
| RN-02 | Los servicios pueden cargarse a puestos o socios. | El formulario contiene "Cargo a". |
| RN-03 | Las cuentas cobrables pueden quedar abonadas o exoneradas. | La pantalla de ingresos presenta ambas marcas. |
| RN-04 | Los recibos utilizan un correlativo recuperado del último comprobante. | Los flujos de pago consultan el último correlativo. |
| RN-05 | El importe por consumo depende de la diferencia positiva de lecturas y del costo unitario. | La generación realiza ese cálculo. |
| RN-06 | La generación para socios puede incluir etapas 1, 2 y 3, y limitar repetidos por nombre y apellido. | Se ofrecen filtros de etapas y socios únicos. |
| RN-07 | Los reportes se solicitan por fecha diaria o por mes según su tipo. | La pantalla incorpora ambos filtros. |

---

## 6. Requisitos no funcionales

| ID | Categoría | Requisito no funcional | Pri. | Criterio de aceptación |
|---|---|---|---|---|
| RNF-01 | Seguridad | Autenticar solicitudes protegidas con token Bearer. | Alta | Una solicitud sin token o con token inválido es rechazada. |
| RNF-02 | Seguridad | Validar permisos y reglas de negocio en el backend, no solo en el frontend. | Alta | Una llamada directa no autorizada no accede ni modifica datos. |
| RNF-03 | Seguridad | Eliminar la credencial local al cerrar sesión. | Alta | Tras cerrar sesión no se accede a rutas protegidas. |
| RNF-04 | Integridad | Mantener consistencia entre cuentas pagadas, recibos y caja/banco. | Alta | Ante fallo parcial, la operación se confirma o revierte controladamente. |
| RNF-05 | Integridad | Garantizar correlativos únicos ante operaciones simultáneas. | Alta | Dos operaciones concurrentes no obtienen el mismo correlativo. |
| RNF-06 | Usabilidad | Validar campos requeridos antes del envío y mostrar mensajes claros. | Alta | Datos incompletos no generan una operación. |
| RNF-07 | Usabilidad | Permitir buscar o filtrar listas extensas. | Media | Se localiza un registro sin recorrer toda la lista. |
| RNF-08 | Usabilidad | Mostrar éxito, error o carga después de cada operación relevante. | Alta | Guardar, eliminar, pagar y descargar dan retroalimentación visible. |
| RNF-09 | Rendimiento | Responder consultas habituales en máximo 3 segundos bajo carga normal. | Media | El 95 % de consultas con datos representativos cumple el umbral. |
| RNF-10 | Compatibilidad | Operar en Chrome, Edge y Firefox, en sus dos últimas versiones. | Media | Los flujos críticos pasan pruebas en dichos navegadores. |
| RNF-11 | Mantenibilidad | Centralizar URL de API y configuración de ambientes fuera de los componentes. | Alta | Cambiar ambiente no exige modificar múltiples componentes. |
| RNF-12 | Mantenibilidad | Separar presentación, acceso a datos y lógica de negocio. | Media | La revisión evidencia responsabilidades claras y pruebas por módulo. |
| RNF-13 | Confiabilidad | Manejar errores de red/API sin perder silenciosamente datos ingresados. | Alta | Se informa el error y se puede reintentar o conservar información. |
| RNF-14 | Auditabilidad | Registrar usuario, fecha, importe y entidad en pagos, egresos, anulaciones y canjes. | Alta | Se identifica quién realizó cada movimiento y cuándo. |
| RNF-15 | Accesibilidad | Permitir operar controles con teclado y etiquetas asociadas. | Media | Tab alcanza los controles y lector de pantalla identifica propósito. |
| RNF-16 | Portabilidad | Construir y ejecutar con las versiones declaradas de Angular y dependencias. | Media | Build y pruebas finalizan en entorno limpio documentado. |

---

## 7. Casos de uso de referencia

| Caso de uso | Actor | Flujo principal resumido | Requisitos relacionados |
|---|---|---|---|
| CU-01: Registrar pago | Operador de caja | Selecciona socio o puesto, marca cuentas abonadas/exoneradas, verifica total y confirma. El sistema actualiza cuentas, emite recibos y refresca la consulta. | RF-19–RF-23; RNF-04, RNF-05, RNF-08 |
| CU-02: Generar cargos | Administrador u operador autorizado | Elige servicio y período, define montos o lecturas, filtra destinatarios y guarda las cuentas generadas. | RF-13–RF-18; RNF-04, RNF-06 |
| CU-03: Registrar egreso | Operador de caja | Ingresa datos del comprobante, proveedor, importes, motivo y documento asociado; guarda y consulta voucher. | RF-27, RF-30; RNF-04, RNF-08, RNF-14 |
| CU-04: Descargar reporte | Operador de caja / administrador | Elige fecha o mes, selecciona tipo de reporte y descarga el XLSX generado. | RF-32, RF-33; RNF-09, RNF-10 |

---

## 8. Plantilla para estudiantes

| Campo | Contenido esperado |
|---|---|
| ID | Código único: RF-01, RF-02, RNF-01, etc. |
| Nombre | Nombre breve, por ejemplo: "Procesar pago". |
| Descripción | Una frase con "El sistema deberá..." y resultado verificable. |
| Actor / fuente | Quién lo usa y de dónde se obtuvo: entrevista, pantalla, API o normativa. |
| Prioridad | Alta, Media o Baja, con breve justificación. |
| Precondiciones | Usuario autenticado, registro existente, período elegido, etc. |
| Criterios de aceptación | Escenarios Dado/Cuando/Entonces o lista comprobable. |
| Reglas y restricciones | Cálculos, validaciones, permisos, correlativos, formatos y límites. |
| Dependencias | Datos, interfaces, servicios externos y requisitos relacionados. |

---

## 9. Ejemplo de requisito bien especificado

| Campo | Ejemplo |
|---|---|
| ID | RF-EJ-01 |
| Nombre | Procesar pago de cuentas seleccionadas |
| Descripción | El sistema deberá procesar en una única operación las cuentas que el operador haya marcado como abonadas y generar los recibos correspondientes. |
| Precondiciones | Usuario autenticado; socio o puesto seleccionado; existe al menos una cuenta pendiente. |
| Criterios de aceptación | Dado un conjunto de cuentas seleccionadas, cuando el operador confirme el pago, entonces las cuentas quedan abonadas, se generan recibos con correlativo único y se actualiza el total mostrado. |
| Excepciones | Si falla la operación, el sistema informará el error y no dejará cuentas pagadas sin recibo ni recibos sin cuenta asociada. |
| Relación | Nivel de detalle esperado para RF-23 y RNF-04/RNF-05. |

---

## 10. Lista de verificación para la entrega

- Cada requisito tiene ID, prioridad y criterio de aceptación.
- Los requisitos funcionales expresan una necesidad del usuario, no una tecnología o pantalla.
- Los no funcionales contienen una medida o condición verificable.
- Las reglas de negocio se separan de los requisitos y se indica su fuente.
- Los casos de uso cubren los flujos de mayor impacto.

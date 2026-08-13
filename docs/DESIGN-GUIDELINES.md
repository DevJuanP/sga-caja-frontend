# Guía de Diseño — SGA Caja

> Sistema de Gestión de Caja: back-office para la administración de un mercado (socios, puestos,
> servicios cobrables, cuentas por cobrar, cobranza, egresos, ingresos y reportes).
>
> Este documento define los lineamientos generales de diseño. Implementación visual: **Angular
> Material** con theming **Material 3 (design tokens)**. Tema base: **"Caja Segura"**.

---

## 1. Contexto y filosofía

- **Tipo de app:** sistema interno (back-office), de uso diario en PC de oficina/mostrador. **Desktop-first**.
- **Público:** dos perfiles — `Administrator` (configuración y gestión de maestros, reportes) y
  `CashierOperator` (cobranza diaria: pagos, recibos, ingresos, egresos, canjes).
- **Principios de diseño:**
  - **Institucional y de confianza:** look formal, estilo financiero sobrio.
  - **Densidad de datos:** tablas con búsqueda, filtros y paginación maximizan el espacio útil.
  - **Velocidad de caja:** flujos cortos ("buscar → seleccionar → cobrar → imprimir recibo"),
    menos clics, soporte de teclado.
  - **Los números importan:** montos con formato correcto (PEN/USD), tipografía tabular y alineación derecha.
  - **Estados claros:** color semántico consistente en chips de estado (pendiente, pagado, exonerado, anulado).

---

## 2. Paleta "Caja Segura"

Inspirada en entidades financieras: máxima sobriedad y seriedad, con ámbar reservado al dinero.

### 2.1 Tokens base — tema claro

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#14304F` | Acciones principales, navegación activa, encabezados |
| `on-primary` | `#FFFFFF` | Texto/iconos sobre primary |
| `primary-container` | `#D8E5F5` | Superficies con énfasis primario (fondo de chip/footer) |
| `on-primary-container` | `#0A1C31` | Texto sobre primary-container |
| `tertiary` | `#D9A441` | Montos, dinero, elementos de énfasis (señalización de caja) |
| `on-tertiary` | `#FFFFFF` | Texto/iconos sobre tertiary |
| `tertiary-container` | `#FBEBD0` | Fondo de badges de dinero |
| `on-tertiary-container` | `#3A2A08` | Texto sobre tertiary-container |
| `background` | `#F5F7FA` | Fondo general de la app |
| `on-background` | `#1C2838` | Texto principal sobre background |
| `surface` | `#FFFFFF` | Tarjetas, tablas, formularios, sidebar |
| `on-surface` | `#1C2838` | Texto principal sobre surface |
| `surface-variant` | `#ECEFF4` | Superficies secundarias (headers de tabla, inputs) |
| `on-surface-variant` | `#46556B` | Texto secundario (labels, placeholders) |
| `outline` | `#C6D0DC` | Bordes, dividers, inputs |
| `outline-variant` | `#DFE5EC` | Bordes suaves, hover rows |
| `error` | `#C62828` | Errores, anulaciones, acciones destructivas |
| `on-error` | `#FFFFFF` | Texto/iconos sobre error |
| `error-container` | `#F9DEDC` | Fondo de chips/badges de error |
| `on-error-container` | `#5F0A0A` | Texto sobre error-container |

### 2.2 Tokens base — tema oscuro

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#7AA7D9` | Acciones principales, navegación activa, encabezados |
| `on-primary` | `#0F1722` | Texto/iconos sobre primary |
| `primary-container` | `#1F3A5F` | Superficies con énfasis primario |
| `on-primary-container` | `#D8E5F5` | Texto sobre primary-container |
| `tertiary` | `#D9A441` | Montos, dinero, elementos de énfasis |
| `on-tertiary` | `#0F1722` | Texto/iconos sobre tertiary |
| `tertiary-container` | `#3A2A08` | Fondo de badges de dinero |
| `on-tertiary-container` | `#FBEBD0` | Texto sobre tertiary-container |
| `background` | `#0F1722` | Fondo general de la app |
| `on-background` | `#E6EBF2` | Texto principal sobre background |
| `surface` | `#1A2433` | Tarjetas, tablas, formularios, sidebar |
| `on-surface` | `#E6EBF2` | Texto principal sobre surface |
| `surface-variant` | `#242F41` | Superficies secundarias (headers de tabla, inputs) |
| `on-surface-variant` | `#A9B7C9` | Texto secundario (labels, placeholders) |
| `outline` | `#3C4B60` | Bordes, dividers, inputs |
| `outline-variant` | `#2C3A4E` | Bordes suaves, hover rows |
| `error` | `#EF5350` | Errores, anulaciones, acciones destructivas |
| `on-error` | `#0F1722` | Texto/iconos sobre error |
| `error-container` | `#5F0A0A` | Fondo de chips/badges de error |
| `on-error-container` | `#F9DEDC` | Texto sobre error-container |

### 2.3 Colores semánticos de estado (común, con variante por tema)

Usados en **chips de estado** de CxC, egresos y pagos.

| Estado | Claro | Oscuro | Significado |
|---|---|---|---|
| Pendiente (`Pending`) | `#B8860B` sobre `#FBEBD0` | `#E0A526` sobre `#3A2A08` | Falta cobrar/procesar |
| Pagado (`Paid`) | `#2E7D32` sobre `#D7E8D3` | `#66BB6A` sobre `#1E3B22` | Completado |
| Exonerado (`Exempt`) | `#616E7C` sobre `#ECEFF4` | `#A9B7C9` sobre `#242F41` | Exento de cobro |
| Anulado (`Voided`/`Cancelled`) | `#C62828` sobre `#F9DEDC` | `#EF5350` sobre `#5F0A0A` | Invalidado |
| Procesado (`Processed`) | `#14304F` sobre `#D8E5F5` | `#7AA7D9` sobre `#1F3A5F` | Comprobante emitido |

---

## 3. Tipografía

### 3.1 Familia

- **Public Sans** para toda la UI (cuerpo, headings, labels, botones).
- **`font-variant-numeric: tabular-nums` obligatorio en todo monto** (y en correlativos) para
  alineación decimal perfecta en tablas y columnas numéricas.

### 3.2 Escala tipográfica

| Rol | Tamaño | Peso | Line-height | Uso |
|---|---|---|---|---|
| Display | 36px | 700 | 44px | Números grandes (totales en caja) |
| Headline | 28px | 700 | 36px | Encabezados de módulo |
| Title | 20px | 600 | 28px | Títulos de tarjeta/página |
| Body | 16px | 400 | 24px | Texto general |
| Label | 14px | 500 | 20px | Botones, tabs, labels |
| Caption | 12px | 400 | 16px | Notas, fechas, metadatos |

Regla de uso: montos siempre **Body–Title con tabular-nums** y alineados a la derecha.

---

## 4. Tokens de typography de Material

Mapeo de los roles de Material 3 a la escala definida:

| Token Material | Fuente | Tamaño | Peso | Line-height | Observación |
|---|---|---|---|---|---|
| `display-small` | Public Sans | 36px | 700 | 44px | Totales grandes |
| `headline-medium` | Public Sans | 28px | 700 | 36px | Encabezados de módulo |
| `headline-small` | Public Sans | 24px | 600 | 32px | Encabezados de página |
| `title-large` | Public Sans | 20px | 600 | 28px | Títulos de tarjeta |
| `title-medium` | Public Sans | 16px | 600 | 24px | Títulos de sección/tabla |
| `title-small` | Public Sans | 14px | 600 | 20px | Encabezados de columna |
| `body-large` | Public Sans | 16px | 400 | 24px | Texto general |
| `body-medium` | Public Sans | 14px | 400 | 20px | Contenido de tablas |
| `body-small` | Public Sans | 12px | 400 | 16px | Notas, metadatos |
| `label-large` | Public Sans | 14px | 500 | 20px | Botones, tabs |
| `label-medium` | Public Sans | 12px | 500 | 16px | Chips, etiquetas |
| `label-small` | Public Sans | 11px | 500 | 16px | Badges, tooltips |
| `amount` (custom) | Public Sans | 14–20px | 500–600 | — | **Siempre `tabular-nums`**, alineado derecha |

---

## 5. Espaciado, radio y elevación

### 5.1 Espaciado (escala base 4px)

| Token | Valor | Uso |
|---|---|---|
| `space-1` | 4px | Gaps mínimos entre iconos/texto |
| `space-2` | 8px | Padding compacto, gaps de chips |
| `space-3` | 12px | Padding de inputs/botones |
| `space-4` | 16px | Padding estándar de cards y celdas |
| `space-5` | 24px | Gaps entre secciones |
| `space-6` | 32px | Padding de páginas y modales |
| `space-7` | 48px | Separación de bloques mayores |

### 5.2 Radio de esquina

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 6px | Inputs, chips, badges |
| `radius-md` | 10px | Botones, cards, tablas |
| `radius-lg` | 16px | Modales, diálogos, recibo |

### 5.3 Elevación

| Nivel | Sombra | Uso |
|---|---|---|
| `elevation-1` | `0 1px 2px rgba(12,20,35,0.08)` | Cards, filas destacadas |
| `elevation-2` | `0 2px 6px rgba(12,20,35,0.12)` | Topbar, tablas fijas |
| `elevation-3` | `0 4px 12px rgba(12,20,35,0.16)` | Sidebar, menús |
| `elevation-4` | `0 8px 24px rgba(12,20,35,0.24)` | Modales, diálogos |

---

## 6. Componentes base (estándar de uso)

### Botones
- **Filled** (primary): acción principal de la pantalla (Crear, Procesar pago, Guardar).
- **Filled tonal** (primary-container): acciones secundarias de contexto.
- **Outlined** (outline): acciones alternativas (Cancelar, Ver detalle).
- **Text**: acciones de baja jerarquía (Limpiar filtros).
- **Danger** (error): acciones destructivas o de anulación (Anular egreso), siempre con confirmación.

### Tablas de datos
- Densidad media (`dense`), encabezados fijos con `title-small` + `surface-variant`.
- Fila con **hover**, selección con **checkbox** en pantallas de cobro.
- Columnas numéricas (montos) **alineadas a la derecha con tabular-nums**.
- Columna de estado siempre como **chip** (ver §2.3).
- Paginación en la base; búsqueda y filtros arriba en una barra de filtros.

### Formularios
- Campos `outlined`, labels visibles, `mat-hint` para ayudas, `mat-error` para validación.
- Selects alimentados por los catálogos de solo lectura.
- Validación en tiempo real; botón submit deshabilitado mientras sea inválido.

### Chips de estado
- Fondo = container del color semántico, texto = `on-*` del mismo estado (§2.3).
- Nunca usar solo color: acompañar con texto del estado.

### Tarjetas
- `surface` + `elevation-1` + `radius-md` + padding `space-4/5`.
- Encabezado con `title-medium` y acciones a la derecha.

### Page header
- Título del módulo (`headline-small`), subtítulo opcional, acciones a la derecha (Crear/Exportar).

### Recibo / comprobante (impresión)
- Vista dedicada con `@media print`: solo el recibo en papel, `print-color-adjust: exact`,
  ocultar sidebar/topbar/botones, formato A5/A4 según tipo de comprobante.

---

## 7. Iconografía

- **Material Icons** (estándar), tamaño base 20–24px.
- Estilo consistente (filled o outlined por contexto, no mezclar dentro de un mismo componente).
- Iconos siempre acompañados de texto en acciones principales de tablas y headers.

---

## 8. Accesibilidad y modo oscuro

- **Contraste WCAG AA** mínimo en texto (verificado en los pares on-primary/on-surface/on-* de §2).
- **Focus visible** en todos los elementos interactivos (anillo `primary` de 2px).
- **Toggle claro/oscuro** global, persistido en `localStorage`, aplicado antes del render
  (evitar flash) y sincronizado con `prefers-color-scheme` como valor inicial.
- No usar el color como único medio de transmitir estado (chips llevan texto).
- Targets táctiles ≥ 40px y navegación completa por teclado.

---

## 9. Do & Don't

### Do
- Usar **siempre tokens** del tema; nunca hex hardcodeados en vistas.
- Formatear **todo monto** con moneda (PEN/USD), 2 decimales y `tabular-nums`.
- Representar estados con **chips** de la paleta semántica.
- Mantener densas las tablas (velocidad de caja) y compactos los formularios.
- Confirmar acciones destructivas o de anulación.

### Don't
- No mezclar azul marino con tonos de acento aleatorios: el ámbar es **solo** para dinero/énfasis.
- No usar rojo para algo que no sea error/anulación.
- No alinear montos a la izquierda.
- No duplicar navegación que confunda al operador de caja (flujo corto primero).
- No romper el contraste por estética en modo oscuro.

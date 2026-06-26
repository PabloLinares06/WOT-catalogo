# Guía de Migración de Cambios: Kiosco, Tarjetas y Medidas de Tablet

Este documento consolida todos los cambios realizados en **NaTec** para que puedan ser aplicados fácilmente a la otra aplicación heredada (**ZonaDigital** o similar).

---

## 📋 Resumen de Cambios a Migrar

1. **Remoción de Categorías de las Tarjetas**: Eliminar el badge de categoría de la parte superior de las imágenes.
2. **Modo Kiosco en PC**: Adaptar la lógica y la plantilla para que funcione en pantallas grandes convencionales sin requerir soporte táctil.
3. **Ajuste de la Tarjeta al Tamaño de la Imagen (Sin Franjas)**: Modificar el CSS para que el fondo se adapte mediante `cover`.
4. **Nuevas Medidas de Imágenes y Backgrounds para Tablet/PC**: Medios y nombres de archivos de fondo actualizados según las resoluciones recomendadas.

---

## 🛠️ Paso a Paso y Código de los Cambios

### 1. Remoción del Badge de Categorías en Tarjetas
En el componente de la tarjeta de producto (`product-card.component.html`), se retiró la etiqueta de categoría (`{{ product.category }}`) que flotaba en la parte superior izquierda de las imágenes.

* **Archivo a modificar**: `src/app/features/catalog/product-card/product-card.component.html`
* **Acción**: Eliminar cualquier etiqueta `<span>` o elemento que renderice la categoría sobre el contenedor de la imagen (`product-img-container`). Dejar únicamente el indicador de Stock (en el lado superior derecho) y el carrusel de imágenes.
* **Nota**: La categoría del bloque ahora solo queda visible al inicio de cada grupo de productos en el catálogo principal (`catalog.component.html`).

---

### 2. Modo Kiosco en PC y Escritorio
Para permitir que computadores y pantallas no táctiles de cualquier tamaño activen y operen el Modo Kiosco con el teclado y el mouse:

#### A. Cambios en el Servicio (`kiosk.service.ts`)
* **Archivo**: `src/app/core/services/kiosk.service.ts`
* **Modificación**: Cambiar la consulta del `BreakpointObserver` para que no tenga límite de ancho máximo (`max-width: 1399px`) y remover la validación táctil (`this.hasTouchSupport()`).

```typescript
  constructor() {
    // Escucha cambios de viewport (cualquier pantalla >= 480px, incluyendo tablets y PCs)
    this.breakpoints
      .observe(['(min-width: 480px)'])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        const isTabletDevice = result.matches;
        this.isTablet.set(isTabletDevice);
        
        if (!isTabletDevice && this.kioskEnabled()) {
          this.disableKiosk();
        }
      });
  }
```

#### B. Cambios en el HTML del Catálogo (`catalog.component.html`)
* **Archivo**: `src/app/features/catalog/catalog.component.html`
* **Modificación**: Remover la clase `2xl:hidden` de todos los elementos del Modo Kiosco para que no se oculten en pantallas de computadores grandes (ancho >= 1536px).
* **Elementos específicos**:
  1. **Botón de Activación** (`#kiosk-toggle-btn`):
     ```html
     <!-- De: -->
     class="fixed bottom-6 left-6 z-50 flex 2xl:hidden ... "
     <!-- A: -->
     class="fixed bottom-6 left-6 z-50 flex ... "
     ```
  2. **Barra Superior de Estado**:
     ```html
     <!-- De: -->
     <div class="fixed top-0 left-0 right-0 z-[60] flex 2xl:hidden ... ">
     <!-- A: -->
     <div class="fixed top-0 left-0 right-0 z-[60] flex ... ">
     ```
  3. **Barra Fija de Filtros del Kiosco**:
     ```html
     <!-- De: -->
     <div class="fixed top-[42px] left-0 right-0 z-[59] flex 2xl:hidden ... ">
     <!-- A: -->
     <div class="fixed top-[42px] left-0 right-0 z-[59] flex ... ">
     ```
  4. **Flechas Laterales de Navegación** (`#kiosk-arrow-up` y `#kiosk-arrow-down`):
     ```html
     <!-- De: -->
     class="fixed ... flex 2xl:hidden ... "
     <!-- A: -->
     class="fixed ... flex ... "
     ```
  5. **Indicador de Posición Inferior**:
     ```html
     <!-- De: -->
     <div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex 2xl:hidden ... ">
     <!-- A: -->
     <div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex ... ">
     ```

---

### 3. Ajuste de la Tarjeta al Tamaño de la Imagen (Aspect Ratio y Sin Franjas ni Recortes)
Para eliminar las molestas franjas blancas en las tarjetas que resultaban de la desproporción entre la imagen del producto y su contenedor, y asegurar que los diseños de fondo (incluyendo logos y esquinas) no se recorten en ninguna resolución (como en la simulación de iPad Pro u otros tamaños de PC/Tablets), implementamos un contenedor responsivo con la proporción exacta de las imágenes de fondo:

* **A. Archivo a modificar (HTML)**: `src/app/features/catalog/product-card/product-card.component.html`
* **Modificación**: En el contenedor de la imagen de la tarjeta Desktop, reemplazamos la altura fija `h-44` por la clase responsiva `card-img-container`.
  ```html
  <!-- Antes: -->
  <div
    [class.product-bg-dark]="themeService.isDark()"
    class="product-img-container product-card-bg relative overflow-hidden h-44 flex-shrink-0">
  
  <!-- Después: -->
  <div
    [class.product-bg-dark]="themeService.isDark()"
    class="product-img-container product-card-bg card-img-container relative overflow-hidden flex-shrink-0">
  ```

* **B. Archivo a modificar (CSS)**: `src/styles.css`
* **Modificación**: Cambiamos el comportamiento de `.product-card-bg` de `cover` a `contain` (para evitar recortar las esquinas decorativas y logos de los fondos) y añadimos la definición de `.card-img-container` con la propiedad responsiva `aspect-ratio` según la pantalla:

  ```css
  .product-card-bg {
    background-image: url('/fondo-producto-claro.png') !important;
    background-size: contain !important; /* Muestra el fondo completo sin recortar nada */
    background-position: center !important;
    background-repeat: no-repeat !important;
    background-color: #f1f5f9 !important;
  }
  
  .dark .product-card-bg {
    background-image: url('/fondo-producto-oscuro.png') !important;
    background-color: #0f172a !important;
  }
  
  /* Contenedor de proporción adaptada */
  .card-img-container {
    width: 100% !important;
    aspect-ratio: 1920 / 1200 !important; /* Proporción estándar de PC (1.6:1) */
    height: auto !important;
  }
  ```

---

### 4. Nuevas Medidas de Imágenes y Fondos para Tablets y PC
Para optimizar la visualización en los distintos dispositivos, se definieron resoluciones recomendadas que deben coordinarse con el diseñador gráfico, y se configuraron consultas de medios en CSS para cargar los archivos de fondo optimizados correspondientes:

#### A. Resoluciones Recomendadas para Diseño (Garantizan la relación de aspecto exacta)
1. **Celulares y Tarjeta Ordinaria Móvil**: **1700 x 1700 px** (Relación de aspecto 1:1 / Cuadrado).
2. **Tablet Vertical (Catálogo Ordinario)**: **2000 x 1000 px** (Relación de aspecto 2:1).
3. **Tablet Horizontal (Catálogo Ordinario)**: **1920 x 780 px** (Relación de aspecto 2.46:1).
4. **PC / Escritorio (Catálogo Ordinario y Modo Kiosco Horizontal)**: **1920 x 1200 px** (Relación de aspecto 1.6:1 / 8:5).
5. **Modo Kiosco Vertical (Tablet en Vertical)**: 
   * **Opción Optimizada para iPad Pro (Relación 9:16)**: **1400 x 2480 px** (o **1080 x 1920 px**). Es la ideal para pantallas muy altas.
   * **Opción Vertical Estándar (Relación 2:3)**: **1400 x 2100 px** (o **1200 x 1800 px**).

#### B. Implementación de Hojas de Estilo (`styles.css`)
* **Archivo**: `src/styles.css`
* **Modificación**: Cargar la imagen adecuada y ajustar la proporción del contenedor responsivo según la combinación de ancho y orientación.

```css
/* ── Celular Vertical / Base ── */
.product-card-bg {
  background-image: url('/fondo-producto-claro.png') !important; /* 1700x1700 px */
}
.dark .product-card-bg {
  background-image: url('/fondo-producto-oscuro.png') !important;
}

/* ── Tablets (600px - 1399px) en Vertical ── */
@media (min-width: 600px) and (max-width: 1399px) and (orientation: portrait) {
  .product-card-bg {
    background-image: url('/fondo-producto-claro-tablet-vertical.png') !important; /* 2000x1000 px */
  }
  .dark .product-card-bg {
    background-image: url('/fondo-producto-oscuro-tablet-vertical.png') !important;
  }
  .card-img-container {
    aspect-ratio: 2000 / 1000 !important; /* Relación de aspecto 2:1 */
    height: auto !important;
  }
}

/* ── Tablets (600px - 1399px) en Horizontal ── */
@media (min-width: 600px) and (max-width: 1399px) and (orientation: landscape) {
  .product-card-bg {
    background-image: url('/fondo-producto-claro-tablet-horizontal.png') !important; /* 1920x780 px */
  }
  .dark .product-card-bg {
    background-image: url('/fondo-producto-oscuro-tablet-horizontal.png') !important;
  }
  .card-img-container {
    aspect-ratio: 1920 / 780 !important; /* Relación de aspecto 2.46:1 */
    height: auto !important;
  }
}

/* ── PC / Escritorio (>= 1400px) ── */
@media (min-width: 1400px) {
  .product-card-bg {
    background-image: url('/fondo-producto-claro-grande.png') !important; /* 1920x1200 px */
  }
  .dark .product-card-bg {
    background-image: url('/fondo-producto-oscurio-grande.png') !important;
  }
  .card-img-container {
    aspect-ratio: 1920 / 1200 !important; /* Relación de aspecto 1.6:1 (8:5) */
    height: auto !important;
  }
}
```

#### C. Fondos Exclusivos del Modo Kiosco
En el Modo Kiosco, la tarjeta del producto activo tiene una estructura fija muy diferente (se estira a lo alto en vertical y a lo ancho en horizontal). Para esto, heredamos la propiedad global `background-size: contain` para que los fondos diseñados a la medida exacta (sin franjas y con la proporción ideal) se muestren completos y sin recortes:

```css
/* ── Modo Kiosco Horizontal (Tablet Horizontal y PC) ── */
@media (orientation: landscape) {
  body.kiosk-mode .product-card-bg {
    background-image: url('/fondo-producto-claro-grande.png') !important;
  }
  .dark body.kiosk-mode .product-card-bg {
    background-image: url('/fondo-producto-oscurio-grande.png') !important;
  }
}

/* ── Modo Kiosco Vertical (Tablet Vertical) ── */
@media (orientation: portrait) {
  body.kiosk-mode .product-card-bg {
    background-image: url('/fondo-kiosko-vertical-claro.png') !important; /* Recomendado: 1200x1800 px */
  }
  .dark body.kiosk-mode .product-card-bg {
    background-image: url('/fondo-kiosko-vertical-oscuro.png') !important;
  }
}
```

---

## 🚀 Archivos Estáticos a Copiar en `/public`
Para que las hojas de estilo resuelvan correctamente las rutas, asegúrate de colocar las imágenes correspondientes en la carpeta `public` (o donde sirvas los recursos estáticos de tu otra app) con los nombres exactos:

* **Móvil / Base**: `fondo-producto-claro.png` / `fondo-producto-oscuro.png`
* **Tablet Vertical**: `fondo-producto-claro-tablet-vertical.png` / `fondo-producto-oscuro-tablet-vertical.png`
* **Tablet Horizontal**: `fondo-producto-claro-tablet-horizontal.png` / `fondo-producto-oscuro-tablet-horizontal.png`
* **PC / Kiosco Horizontal**: `fondo-producto-claro-grande.png` / `fondo-producto-oscurio-grande.png`
* **Kiosco Vertical**: `fondo-kiosko-vertical-claro.png` / `fondo-kiosko-vertical-oscuro.png`

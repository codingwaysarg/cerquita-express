
# Backoffice SmartFridge — Plan de construcción

Construir un panel de administración SPA completo bajo `/admin/*`, separado de la app de consumidor existente en `/`. Stack ya disponible en el proyecto: React + TanStack Router + TanStack Query + shadcn/ui + Tailwind + lucide-react + sonner + recharts. Todo mockeado en memoria (sin backend real), con una capa única `src/lib/admin/api/client.ts` que mapea 1:1 cada endpoint REST descrito para poder reemplazarla por llamadas reales después.

Es un volumen de trabajo muy grande (16 rutas, tablas con sort/filtros/atajos, video, crops, command palette, bulk actions, training jobs con polling, simulador, planograma, etc.). Voy a entregarlo en una sola pasada con todas las pantallas y funcionalidad descritas, pero por escala algunas piezas serán implementaciones funcionales mínimas viables del comportamiento pedido (no demos de UI). Si algo queda corto te lo marco al final para iterarlo.

## Arquitectura

```text
src/
  lib/admin/
    api/
      client.ts            # única superficie de datos (todos los endpoints)
      endpoints.ts         # tabla de rutas REST (para swap a real)
    mock/
      db.ts                # state machine en memoria + seeds
      seed.ts              # heladeras, productos, txs, jobs, crops
      timers.ts            # polling/auto-progress (sesiones sim, jobs training)
    auth.ts                # token operador en localStorage + guard
    format.ts              # ARS, relativo es-AR, fechas
    keyboard.ts            # helpers ↑/↓/Enter/Space/a/c/w/Esc/⌘K
    url-filters.ts         # sync querystring <-> estado de filtros
  components/admin/
    primitives/
      StatusPill.tsx
      ConfidenceBar.tsx
      EmptyState.tsx
      InlineRetry.tsx
      QueryBoundary.tsx
      TrainingPill.tsx
      DensityToggle.tsx
      ViewToggle.tsx
      KpiCard.tsx
    layout/
      AdminShell.tsx       # grid sidebar + topbar + <main>
      Sidebar.tsx          # colapsable, persiste, grupos, tooltips
      MobileNav.tsx        # drawer
      TopBar.tsx           # breadcrumb + search + theme + user menu
      Breadcrumb.tsx
      ThemeToggle.tsx
      UserMenu.tsx         # con "Cerrar sesión"
      CommandPalette.tsx   # ⌘K, modos default/search-tx/jump-to-fridge
    tx/
      TransactionsTable.tsx
      TransactionsCard.tsx
      TxFilters.tsx
      BulkBar.tsx
      VideoPlayer.tsx      # single/dual/combined, polling combinado
      CropStrip.tsx + Lightbox.tsx
      ItemRow.tsx + ProductPicker.tsx
      OverrideQueue.tsx + CommitBar.tsx
      UnsavedGuard.tsx
      DisputePanel.tsx + ReturnsPanel.tsx
    review/
      ReviewQueueCard.tsx
      ReviewSplitPane.tsx
      MobileReviewBar.tsx
      CropLabeler.tsx
    products/
      ProductCard.tsx + ProductsGrid.tsx + ProductsTable.tsx
      NewProductDialog.tsx
      GalleryTabs.tsx + UploadDropzone.tsx
    training/
      JobsTable.tsx + JobsCards.tsx + JobLogSheet.tsx + JobFilters.tsx
    fridges/
      FridgeCard.tsx + NewFridgeDialog.tsx
      LiveSnapshot.tsx + Sparkline24h.tsx
      ThresholdEditor.tsx + ShelfCard.tsx + PlanogramRow.tsx
    sim/
      SessionControls.tsx + WeightControls.tsx + Scenarios.tsx
      SnapshotGallery.tsx
    dashboard/
      KpiStrip.tsx + TimelineChart.tsx + TopProducts.tsx + FleetStatus.tsx
  routes/
    admin.tsx                          # layout protegido (guard + AdminShell)
    admin.index.tsx                    # /admin Dashboard
    admin.login.tsx                    # standalone
    admin.transactions.tsx             # lista
    admin.transactions.$id.tsx         # detalle
    admin.review.tsx                   # cola
    admin.review.labeling.tsx          # cola etiquetado
    admin.review.label.$transactionId.tsx
    admin.products.tsx
    admin.products.$id.tsx
    admin.training.tsx
    admin.fridges.tsx
    admin.fridges.$id.tsx
    admin.sim.tsx
    admin.sim.$fridgeId.tsx
    admin.settings.tsx
```

## Capa de datos mock

`src/lib/admin/mock/db.ts` mantiene un store reactivo (event emitter simple) con: `fridges, products, productImages, transactions, txItems, txCrops, txEvents, reviewQueue, trainingJobs, jobLogs, simSessions, weightSamples, snapshots, planograms, shelves, kpiTimeline, topProductsByWindow, operatorSession`.

`timers.ts` simula:
- progresión de `trainingJobs` (queued→running→completed con líneas de log cada seg)
- progresión de sesiones del simulador (door open → streaming → close → inference → tx creada)
- heartbeats de heladeras y refresh de kpis cada 10s

`api/client.ts` expone funciones tipadas (`getTransactions(params)`, `getTransaction(id)`, `bulkReview(ids)`, `correctItem`, `waiveItem`, `addItem`, `getCrops`, `getCropUrl`, `resolveDispute`, `resolveReturn`, `getDashboardTimeline`, `getTopProducts(window)`, `getFridges`, `getFridge`, `patchFridge`, `calibrateFridge`, `createFridge`, `addShelf`, `removeShelf`, `addPlanogram`, `removePlanogram`, `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct`, `uploadProductImages`, `deleteProductImage`, `getEmbeddingStats`, `getTrainingJobs`, `createTrainingJob`, `cancelTrainingJob`, `getJobLog`, `getReviewQueue`, `getReviewItem`, `approveItem`, `submitLabel`, `submitTextLabel`, `simulateUnlock`, `simulateSnapshot`, `simulateAssign`, `simulateWeightDelta`, `simulateForceClose`, `adminLogin`, `adminLogout`). Devuelven Promises con latencia simulada (150–400ms) y posibilidad de error inyectado.

## Primitivos compartidos

Implementar exactamente como se describe: `StatusPill` (mapa de estados tx/heladera/job a color+label+punto, soporta needs_review como badge outline secundario), `ConfidenceBar` (meter accesible, bandas 85/65), `EmptyState` (3 variantes), `InlineRetry`, `QueryBoundary` (envoltorio de TanStack Query con suspense/error/empty), `TrainingPill`, `KpiCard`, `DensityToggle`, `ViewToggle`.

## Layout global

- `admin.tsx` aplica `requireOperator()` (sin token → `<Navigate to="/admin/login">`) y renderiza `<AdminShell>` con sidebar colapsable (persistido en localStorage), grupos exactos pedidos, item activo con barra de acento, tooltips en colapsado, mobile drawer espejando los grupos, TopBar sticky con blur on scroll, breadcrumb dinámico (txid → `tx_<8>…`, fridge/product → id), botón de búsqueda con hint `⌘K`/`Ctrl K` según `navigator.platform`, ThemeToggle (radio Light/Dark/System persistido, escucha mediaquery), **UserMenu nuevo con "Cerrar sesión"** que limpia token y redirige a `/admin/login`.
- `CommandPalette` montada una vez, tres modos con flujo Enter/Back según spec, búsqueda de tx via `getTransaction(id)` con estados idle/searching/404/error, jump-to-fridge con filtro substring.

## Pantallas (cada una con states loading/empty/error)

1. **/admin/login** — card centrada, submit con errores 401/otro como `role="alert"`.
2. **/admin** — 4 paneles independientes con su QueryBoundary: KPI strip, recharts barras apiladas 24h, TopProducts con toggle de ventana 24h/7d/30d (`aria-pressed`), FleetStatus pills con forma distinta online/offline.
3. **/admin/transactions** — tabla con 9 columnas, sort en status/amount/created_at, densidad, fila clickeable, hover-actions con menú "⋯", filtros chips sincronizados a URL, conteo, paginación cursor "Load 25 more" con toast de reinicio si cambian filtros mientras paginás, selección + bulk bar sticky desktop con Mark reviewed, atajos ↑/↓/Enter/Space (Space previene scroll, ↓ en última fila carga más y enfoca la primera nueva). Mobile → cards.
4. **/admin/transactions/:id** — header con toolbar (Marcar revisada, Solicitar revisión toast, Copiar enlace, Commit N), banner aria-live de cambios, columna izquierda con VideoPlayer (single/dual/combinada con polling 10s), StatusBar 6 KPIs, badges de tier/riesgo/modelos, CropStrip + Lightbox con teclas ←/→/Esc, banner de devoluciones, DisputePanel, ReturnsPanel, sección Items con ProductPicker + stepper + estados visuales por edición pendiente; columna derecha customer / pipeline events (oculta los vacíos) / scale deltas. OverrideQueue local + Commit secuencial con resultados parciales. UnsavedGuard al navegar/Esc. Mobile → apilado + barra sticky inferior + swipe dual.
5. **/admin/review** — split-pane desktop (lista 360px + detalle), cards live (refetch 10s), filtros banda/fridge/date_from/date_to en URL, panel detalle con video y leyenda de atajos, **atajos a/c/w** con updates optimistas + rollback + toasts exactos del spec, ProductPicker apuntando al item de menor confianza. Mobile → cards + barra sticky inferior.
6. **/admin/review/labeling** — lista plana 50 items, links a `/admin/review/label/:id`, estados loading/error/empty.
7. **/admin/review/label/:transactionId** — videos Top+Side, dos filmstrips con selección múltiple y badges de confianza/margen, "Auto-seleccionar mejores 5", ProductPicker, input text-prior, botones Confirmar/No es producto/Dudoso/Caja mal que postean a `/api/review/labels` (último con `mark_transaction_reviewed`), text-label opcional, toast y vuelta a la cola.
8. **/admin/products** — buscador con debounce 250ms (param `q`), ViewToggle grid/tabla persistido (`view`), grid auto-fill 220px, tabla sortable client-side, TrainingPill con tooltip, NewProductDialog con validaciones y subida de fotos secundaria, toasts de warning si fallan fotos. Mobile fuerza grid.
9. **/admin/products/:id** — header con menú peligroso (AlertDialog), galería con tabs Todas/Catálogo/Feedback, eliminar foto con **undo de 5s** (toast con acción), lightbox, dropzone con progreso, KPI strip, botón Entrenar ahora, editor inline de precio/sku/peso/tolerancia con Guardar. Mobile → barra sticky inferior con Entrenar.
10. **/admin/training** — botón "Entrenar todos…" con AlertDialog contado, tabla con polling 5s mientras haya jobs activos, sheet lateral de log con toggle autoscroll, poll log 2s/30s, "Cargar más" tail, cancelar optimista (rollback), filtros estado+desde en URL. Mobile → cards + log full-width.
11. **/admin/fridges** — grid responsive de FridgeCard, NewFridgeDialog con validación de secret ≥6 y cámaras 1–2.
12. **/admin/fridges/:id** — LiveSnapshot con poll 7s y badge puerta abierta pulsante (<90s), Sparkline24h, últimas 10 tx con link a lista filtrada, KPI strip 4, ThresholdEditor slider+input sincronizados (commit en blur/Enter/release, optimista con rollback), Re-tare con `window.confirm` y mapeo de errores 503/502, gestión de estantes/planograma completa (agregar/eliminar shelf y entries, select que filtra ya asignados).
13. **/admin/sim** — selector de heladeras, refetch 15s, botón "Iniciar sim".
14. **/admin/sim/:fridgeId** — control de sesión (unlock por Redis simulado), foto sin entrenar, captura entrenamiento con galería + asignar+entrenar, estado de sesión con banner por evento (poll 1s), grilla de escenarios de un toque, ShelfCard con −/+ rápidos y custom, cerrar/abortar, tabla de muestras buffer.
15. **/admin/settings** — página real: ThemeToggle, secciones "API keys", "Credenciales de pago", "Feature flags" con campos deshabilitados y nota "próximamente" (sin endpoints inventados).

## Reglas transversales aplicadas

- es-AR/voseo en cuerpo, manteniendo labels EN existentes ("Transactions", "Products").
- Todos los filtros/orden/vista en query params (links compartibles); cursor jamás en URL.
- A11y: labels asociados, `role="alert"` en errores form, `aria-live` en cambios async, `aria-current="page"` en breadcrumb final y nav activa, targets ≥44px, foco visible, dialogs con título, estado no comunicado solo por color (formas distintas en pills de heladera).
- Tablas degradan a cards en mobile; barras de acción sticky inferiores en mobile; drawer de nav; video dual con swipe.
- Toda llamada pasa por `api/client.ts`.

## Notas de scope realistas

- **Charts**: barras apiladas con recharts (ya instalado si está; si no, lo agrego).
- **Video**: usa los URLs sample que ya están en la app del consumidor; el modo dual muestra dos `<video>` lado a lado y polling al combinado simulado.
- **Crops**: imágenes placeholder generadas (data-URL o picsum) tageadas por sku.
- **Login**: cualquier email + password ≥4 chars autentica; el endpoint mock valida formato y devuelve token fake.
- **Atajos por página** sólo activos cuando la página es visible y el foco no está en un input editable (excepto el palette que sí funciona en inputs por spec).
- **Persistencia**: tema, sidebar colapsado, vista de productos, densidad de tx → localStorage.

## Entregable

Una pasada con todo el árbol de rutas, primitivos, layout, mocks y todas las pantallas con la funcionalidad descrita. Confirmá el plan y arranco.

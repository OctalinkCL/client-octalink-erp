# ERP Octalink — Brief de proyecto

## Objetivo

Sistema interno simple para que JuanAndres (único usuario por ahora) ordene:

- Cotizaciones
- Cobros puntuales
- Suscripciones mensuales

Sabiendo en todo momento: si el cliente pagó o no, si se cobró o no, y si se envió boleta o no.

## Contexto / proceso actual (manual)

1. Llega una solicitud → se hace una cotización.
2. Si se acepta → se genera una OT (Orden de Trabajo).
3. La OT queda pendiente de cobro → se cobra.
4. Existe además un servicio WaaS por suscripción mensual (se cobra el día 1 de cada mes), hoy generado manualmente cada mes.
5. Algunos cobros llevan boleta, otros son informales (sin boleta).
6. Hoy todo el envío de cobros y boletas se hace a mano por correo; las boletas las pide manualmente al contador.

## Filosofía del proyecto

"Primero creamos, después mejoramos": todo manual y con botones en esta primera versión. Sin automatizaciones de fondo (sin Cloud Functions, sin cron, sin envío de correo automático sin intervención).

## Stack decidido

- **Frontend:** Vue 3
- **Backend/DB:** Firebase (Firestore + Auth)
- **Envío de correos:** Resend
- **Hosting:** Vercel
- Se descarta Supabase por límite de proyectos gratuitos alcanzado.

## Diseño modular

Módulos pensados para poder crecer agregando más adelante:

1. **Clientes**
2. **Comercial** (cotizaciones)
3. **OTs** (Órdenes de Trabajo)
4. **Cobranza**
5. **Suscripciones**
6. **Dashboard**

## Decisiones clave de modelo de datos

### Cobro: dos estados independientes que se combinan

- **Estado de pago:** `pendiente` → `enviado` → `pagado`
- **Estado de boleta:** `no_aplica` (informal) | `pendiente` (falta subir) | `enviada`

Estos dos estados son independientes entre sí, de modo que cualquier combinación es representable (ej. pagado + sin boleta, pendiente + boleta pendiente, etc.) y siempre se puede ver de un vistazo si pagó y si se envió boleta.

### Flujo de cobro

1. OT pasa a estado "pendiente de cobro" → se genera un **PDF interno** (Orden de Cobro, no es boleta): cliente, concepto, monto, datos bancarios BCI de Octalink. Este documento lo arma el propio sistema, no depende del contador.
2. Botón "Enviar cobro" → se manda al cliente por correo (vía Resend) → estado de pago pasa a `enviado`.
3. Cuando el cliente paga, se marca manualmente `pagado` (con fecha de pago).
4. Si la OT es "con boleta": cuando el contador envía el PDF de la boleta SII, se sube al cobro correspondiente → botón dispara el correo "aquí tu boleta" vía Resend → estado de boleta pasa a `enviada`.
5. Si es "sin boleta": el campo queda en `no_aplica`, el cobro se cierra solo con el pago.

### Flujo de suscripciones (100% manual, sin automatización de fondo)

- Al entrar al Dashboard, se consulta Firestore: para cada suscripción activa, se revisa si ya existe un `cobro` con `mes_ciclo` = mes actual.
- Si no existe, se muestra una alerta tipo "Tienes N suscripciones sin cobro generado este mes" con botón "Generar" por cada una.
- Al generar, se crea el registro de `cobro` en estado `pendiente`, y de ahí sigue exactamente el mismo flujo de cobro descrito arriba.
- No hay cron ni Cloud Function: el cálculo se hace en el momento, cada vez que se abre la app.

## Estructura de datos propuesta (Firestore)

- **clientes**: datos de contacto, nombre, etc.
- **cotizaciones**: cliente, ítems, monto, estado (`pendiente` / `aceptada` / `rechazada`)
- **ots**: cliente, origen (de cotización aceptada o puntual), estado (`pendiente` / `en_curso` / `completada`)
- **cobros**: cliente, ot_id (opcional, si viene de OT) o suscripcion_id (opcional, si viene de suscripción), mes_ciclo (para suscripciones), monto, estado_pago, estado_boleta, fecha_pago, url_boleta
- **suscripciones**: cliente, monto, día de cobro, estado (`activa` / `pausada`)

_(Nota: campos exactos, tipos y relaciones se terminan de definir al construir en Claude Code.)_

## Pendiente para próximas iteraciones (fuera de este MVP)

- Automatización real del recordatorio de suscripciones (cron / Cloud Function)
- Envío automático de correos sin intervención manual
- Integración directa con el contador / SII para boletas
- Vistas y pantallas específicas (aún no revisadas)
- Reglas de seguridad de Firestore (a definir al implementar)

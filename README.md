# FrederickListaB

Portal del Consejo Estudiantil: página pública, registro, chat, calendario y sugerencias.

## Organización de estudiantes

- Cursos iniciales: 8vo, 9no y 10mo de básica; 1ro, 2do y 3ro de bachillerato.
- Paralelos iniciales: A y B.
- En **Usuarios → Cursos, paralelos y especialidades**, una persona con permiso `users.manage` puede agregar opciones.
- Las especialidades las crea el consejo. Solo se muestran al seleccionar bachillerato. No se inventaron especialidades ni se asignaron automáticamente a estudiantes.
- **Inicio** permite al estudiante actualizar su curso, paralelo y especialidad.
- **Usuarios** y **Sugerencias** incluyen filtros combinables. Los mensajes conservan el curso del estudiante en el momento del envío.
- Los cursos antiguos sin equivalencia inequívoca se conservan y aparecen como “Curso anterior” hasta que el estudiante o administrador los clasifique.

## Registro

El proyecto Supabase `Frederickconsejo` usa correo y contraseña, con **Authentication → Sign In / Providers → Confirm email** desactivado. El registro devuelve una sesión e ingresa al inicio. Esta configuración pertenece al proyecto alojado; no se cambia solamente editando el frontend.

El enlace de recuperación debe permitir `login.html?view=reset` dentro de las URL de redirección de Supabase.

## Desarrollo y verificación

El sitio es estático. Servir la carpeta con cualquier servidor HTTP local (por ejemplo, `python -m http.server 8766`).

- `tests/courses.integration.sql`: verifica catálogos, metadatos de registro, permisos, edición, especialidades solo en bachillerato y privacidad de sugerencias. Usa una transacción y revierte los datos de prueba.
- `node tests/ui-fixture.mjs`: genera `.preview/` con datos ficticios y sin escrituras a Supabase. Abrir `/.preview/app.html#users` para comprobar edición, filtros, catálogos y diseño móvil.
- Las migraciones de `supabase/migrations` corresponden a la actualización del proyecto existente; no son un instalador del esquema original.

Validado el 20 de octubre de 2026: registro real con sesión inmediata (cuenta temporal eliminada), pruebas de permisos y campos, filtros de interfaz, logo, recuperación y pantallas de 320 y 360 píxeles.

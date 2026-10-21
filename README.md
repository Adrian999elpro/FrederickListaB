# FrederickListaB

Portal del Consejo Estudiantil: página pública, registro, chat, calendario y sugerencias.

La portada muestra al equipo en tarjetas contiguas, siguiendo el orden de cargos y miembros de **Lista e integrantes**. En teléfonos, las tarjetas usan una disposición compacta.

## Organización de estudiantes

- Cursos iniciales: 8vo, 9no y 10mo de básica; 1ro, 2do y 3ro de bachillerato.
- Paralelos iniciales: A y B.
- En **Usuarios → Cursos, paralelos y especialidades**, una persona con permiso `users.manage` puede agregar opciones.
- Las especialidades las crea el consejo. Solo se muestran al seleccionar bachillerato. No se inventaron especialidades ni se asignaron automáticamente a estudiantes.
- **Mi perfil**, dentro del panel, permite al estudiante actualizar su curso, paralelo y especialidad.
- **Usuarios** y **Sugerencias** incluyen filtros combinables. Los mensajes conservan el curso del estudiante en el momento del envío.
- Los cursos antiguos sin equivalencia inequívoca se conservan y aparecen como “Curso anterior” hasta que el estudiante o administrador los clasifique.

## Registro

El proyecto Supabase `Frederickconsejo` usa correo y contraseña, con **Authentication → Sign In / Providers → Confirm email** desactivado. El registro y el inicio de sesión llevan a la portada pública de Revolución Estudiantil (`index.html`), conservando la sesión y el botón **Ir al panel**. Esta configuración pertenece al proyecto alojado; no se cambia solamente editando el frontend.

El enlace de recuperación debe permitir `login.html?view=reset` dentro de las URL de redirección de Supabase.

La sesión se conserva en el navegador entre visitas y se renueva automáticamente. No hay cierre por inactividad. Se migra la sesión anterior de la pestaña al almacenamiento persistente, y **Salir** la elimina. Un error temporal al consultar permisos no elimina la sesión; una cuenta desactivada sigue sin poder acceder.

## Desarrollo y verificación

El sitio es estático. Servir la carpeta con cualquier servidor HTTP local (por ejemplo, `python -m http.server 8766`).

- `tests/courses.integration.sql`: verifica catálogos, metadatos de registro, permisos, edición, especialidades solo en bachillerato y privacidad de sugerencias. Usa una transacción y revierte los datos de prueba.
- `node tests/ui-fixture.mjs`: genera `.preview/` con datos ficticios y sin escrituras a Supabase. Abrir `/.preview/app.html#users` para comprobar edición, filtros, catálogos y diseño móvil.
- `node tests/session.test.mjs`: verifica conservación y migración de sesión, renovación habilitada, errores temporales, cuentas desactivadas y salida voluntaria, sin credenciales reales.
- El plan de trabajo público se divide automáticamente según el espacio de pantalla. Los títulos acompañan a sus propuestas; solo los párrafos demasiado largos se separan por oraciones o palabras. Al cambiar el tamaño de pantalla se conserva la posición de lectura.
- `node tests/plan-pager.test.mjs`: comprueba que la paginación conserve todo el contenido en orden, no deje títulos huérfanos y divida correctamente las propuestas extensas.
- Las migraciones de `supabase/migrations` corresponden a la actualización del proyecto existente; no son un instalador del esquema original.

Validado el 20 de octubre de 2026: registro real con sesión inmediata (cuenta temporal eliminada), pruebas de permisos y campos, filtros de interfaz, logo, recuperación y pantallas de 320 y 360 píxeles.

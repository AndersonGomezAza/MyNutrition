# MyNutrition

Catálogo de supermercado (Ara, D1), lista de compras, generador de plan de
comidas y seguimiento de peso. PWA de un solo usuario, Next.js + Supabase,
desplegada en Vercel.

## Setup local

```bash
npm install
cp .env.local.example .env.local   # completa con tu proyecto de Supabase
npx supabase login
npx supabase link --project-ref <tu-ref>
npx supabase db push                # crea las tablas
```

`supabase db push` **no** corre `supabase/seed.sql` contra un proyecto
remoto (solo lo hace `supabase db reset`, que es para desarrollo local). En
un proyecto remoto nuevo, pega el contenido de `supabase/seed.sql` en el
SQL Editor del dashboard de Supabase una vez, para crear las filas de
`stores` (Ara, D1).

```bash
npm run dev
npm run test    # vitest: parser del scraper + categorizador
```

Para poblar el catálogo con datos reales, con el server corriendo:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/scrape
```

(usa el mismo valor de `CRON_SECRET` que pusiste en `.env.local`). En
producción esto lo dispara solo el cron de Vercel (`vercel.json`), semanal.

## Estructura

- `lib/scraper/` — parser + orquestador del scraping de losprecios.co (mismo
  HTML para cualquier tienda de ese sitio; agregar una tienda nueva es una
  fila en la tabla `stores`, no código nuevo).
- `lib/generator/` — generador de plan de compras + menú (presupuesto +
  exclusiones -> lista + plan de 7 días).
- `lib/db/` — acceso a Supabase, siempre server-side con el service role key
  (RLS está activo sin políticas: el navegador nunca habla directo con
  Supabase).
- `supabase/migrations/` — esquema completo.

Ver el plan de arquitectura completo en el historial de la conversación
donde se diseñó, o pregúntale a Claude por el contexto del proyecto.

export function SetupNotice({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Supabase todavía no está conectado.</p>
      <p className="mt-1">{error}</p>
      <p className="mt-2">
        Copia <code className="rounded bg-amber-100 px-1">.env.local.example</code> a{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code>, complétalo con los
        valores de tu proyecto de Supabase, y corre{" "}
        <code className="rounded bg-amber-100 px-1">npx supabase db push</code> para crear las
        tablas.
      </p>
    </div>
  );
}

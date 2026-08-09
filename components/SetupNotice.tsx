export function SetupNotice({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-amber-700/50 bg-amber-500/10 p-4 text-sm text-amber-200">
      <p className="font-semibold text-amber-100">Supabase todavía no está conectado.</p>
      <p className="mt-1">{error}</p>
      <p className="mt-2">
        Copia <code className="rounded bg-amber-500/20 px-1">.env.local.example</code> a{" "}
        <code className="rounded bg-amber-500/20 px-1">.env.local</code>, complétalo con los
        valores de tu proyecto de Supabase, y corre{" "}
        <code className="rounded bg-amber-500/20 px-1">npx supabase db push</code> para crear las
        tablas.
      </p>
    </div>
  );
}

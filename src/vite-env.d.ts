/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://your-project-ref.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Publishable (or legacy anon) key. Public by design; access is enforced by database rules. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Older name for the same key, still accepted. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

-- Supabase publica automáticamente una API REST de todas las tablas del esquema
-- "public". Con RLS (Row Level Security) activado y sin ninguna regla, esa API no
-- puede leer ni escribir nada. El backend no se ve afectado: Prisma entra con el
-- usuario dueño de las tablas, que no está sujeto a RLS.
-- Si más adelante se crea una tabla nueva, hay que activarle RLS también
-- (ALTER TABLE "Nueva" ENABLE ROW LEVEL SECURITY;).
DO $$
DECLARE
  tabla RECORD;
BEGIN
  FOR tabla IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabla.tablename);
  END LOOP;
END $$;

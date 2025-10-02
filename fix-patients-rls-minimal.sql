-- Script mínimo para permitir criação de pacientes temporariamente
-- Execute no Supabase Dashboard > SQL Editor

-- Opção 1: Desabilitar RLS temporariamente (CUIDADO: menos seguro)
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;

-- Opção 2: Ou manter RLS mas com política muito permissiva
-- ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "temp_allow_all" ON public.patients;
-- CREATE POLICY "temp_allow_all" ON public.patients FOR ALL USING (true) WITH CHECK (true);

-- Verificar status do RLS
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'patients' AND schemaname = 'public';
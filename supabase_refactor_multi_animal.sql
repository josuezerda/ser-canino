-- Fase 8: Migración a Sistema Multiusuario y Multi-Animal

-- 1. Asegurarnos que el ENUM exista y esté completo
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_system_role') THEN
        CREATE TYPE user_system_role AS ENUM ('tutor', 'veterinaria', 'moderador', 'superadmin', 'colaborador');
    END IF;
END $$;

-- 2. Crear nueva tabla para PERFILES HUMANOS (Usuarios)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    system_role user_system_role DEFAULT 'tutor',
    home_lat DOUBLE PRECISION,
    home_lng DOUBLE PRECISION
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crear nueva tabla para MASCOTAS (Inventario / Sub-Cuentas)
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pet_name TEXT NOT NULL,
    breed TEXT,
    age_years INTEGER,
    medical_notes TEXT,
    avatar_url TEXT
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- 4. Migrar los datos desde la tabla vieja `animal_profiles` (si existiera y tuviera datos) a las nuevas tablas
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'animal_profiles') THEN
        -- 4a. Pasar los usuarios (Manteniendo el rol de Super Admin)
        INSERT INTO public.user_profiles (id, created_at, updated_at, full_name, system_role, home_lat, home_lng)
        SELECT 
            id, 
            created_at, 
            updated_at, 
            pet_name, -- Lo que antes era nombre temporal del animal ahora es el alias del usuario
            CASE WHEN is_super_admin = true THEN 'superadmin'::user_system_role ELSE COALESCE(system_role, 'tutor') END, 
            home_lat, 
            home_lng 
        FROM public.animal_profiles
        ON CONFLICT (id) DO NOTHING;

        -- 4b. Anexar el animal a la nueva tabla de pets (Solo si tenían nombre)
        INSERT INTO public.pets (owner_id, created_at, updated_at, pet_name, breed, age_years, medical_notes, avatar_url)
        SELECT 
            id, 
            created_at, 
            updated_at, 
            pet_name, 
            breed, 
            age_years, 
            medical_notes, 
            avatar_url
        FROM public.animal_profiles
        WHERE pet_name IS NOT NULL AND pet_name != '';
    END IF;
END $$;

-- 5. Actualizar Funciones de Roles para que lean de la tabla NUEVA (user_profiles)
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_id AND system_role = 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_moderator(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_id AND system_role IN ('moderador', 'superadmin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_veterinary(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_id AND system_role IN ('veterinaria', 'superadmin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Actualizar el Trigger Principal de Registro Inicial (Onboarding)
-- Antes esto insertaba en animal_profiles, ahora debe insertar el "tutor" en user_profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, system_role)
  VALUES (new.id, split_part(new.email, '@', 1), 'tutor');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS de las Nuevas Tablas
-- RLS para user_profiles (Solo tú puedes editar tus datos humanos, todos pueden verlos)
CREATE POLICY "Perfiles humanos públicos" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Tutor edita su propio perfil humano" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Tutor crea su perfil humano" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS para pets (Solo el dueño modifica a sus mascotas, todos pueden verlas caso emergencia)
CREATE POLICY "Mascotas visibles públicamente" ON public.pets FOR SELECT USING (true);
CREATE POLICY "Tutor edita a su mascota" ON public.pets FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Tutor inserta mascota" ON public.pets FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Tutor borra mascota" ON public.pets FOR DELETE USING (auth.uid() = owner_id);

-- 8. Limpiar: Ahora sí, podemos eliminar la tabla vieja `animal_profiles` sin miedo (Los datos ya están migrados)
DROP TABLE IF EXISTS public.animal_profiles CASCADE;

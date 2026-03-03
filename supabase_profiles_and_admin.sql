-- Fase 5: Identidad Digital Canina y Super Admin

-- 1. Tabla de Perfiles de Animales (El 'DNI' canino)
CREATE TABLE public.animal_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pet_name TEXT,
    breed TEXT,
    age_years INTEGER,
    medical_notes TEXT,
    avatar_url TEXT,
    home_lat DOUBLE PRECISION,
    home_lng DOUBLE PRECISION,
    is_super_admin BOOLEAN DEFAULT false
);

ALTER TABLE public.animal_profiles ENABLE ROW LEVEL SECURITY;

-- Bucket para las fotos de perfil de los animales
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Políticas de Storage para los Avatares
CREATE POLICY "Avatares públicos" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Tutor sube avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Tutor actualiza avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Políticas (RLS) para animal_profiles
-- Cualquiera puede ver los perfiles públicos (necesario para cuando se escanea el token o se ve en comunidad)
CREATE POLICY "Perfiles visibles públicamente" ON public.animal_profiles FOR SELECT USING (true);

-- Solo el dueño de la cuenta (el tutor) puede actualizar el perfil de su animal
CREATE POLICY "El tutor puede actualizar el perfil" ON public.animal_profiles FOR UPDATE USING (auth.uid() = id);

-- El perfil se crea o inserta automáticamente mediante un trigger en auth.users, pero permitimos insert si es el mismo usuario
CREATE POLICY "El tutor puede insertar su perfil" ON public.animal_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Funciones de Base de Datos para Rol de Administrador ('Súper Admin')
-- Creamos una función segura para comprobar si un usuario es super admin buscando su email directamente en auth.users
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
    user_email text;
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    -- Aquí definimos los correos que tienen poder absoluto
    IF user_email IN ('admin@sercanino.com.ar') THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Actualizar las Políticas de tablas anteriores para incluir el acceso total del Super Admin

-- Permisos Super Admin en Reports (Alertas)
CREATE POLICY "Super Admin: Control total de reportes" ON public.reports FOR ALL USING (public.is_super_admin(auth.uid()));

-- Permisos Super Admin en Directories (Refugios/Vets)
CREATE POLICY "Super Admin: Control total de directorios" ON public.directories FOR ALL USING (public.is_super_admin(auth.uid()));

-- 5. Trigger Automatizado: Al registrarse un usuario, crear su "Pergamino" (Perfil vacío)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.animal_profiles (id, pet_name)
  VALUES (new.id, split_part(new.email, '@', 1)); -- Pone la primera parte del email como nombre temporal
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists para que no de error si corres este script 2 veces
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- IMPORTANTE: Para testing local, si ya hay cuentas creadas, puedes correr esto para generarles un perfil vacío y enlazar el super admin:
INSERT INTO public.animal_profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Marcar la cuenta admin si ya existe:
UPDATE public.animal_profiles SET is_super_admin = true WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@sercanino.com.ar');

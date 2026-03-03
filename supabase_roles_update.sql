-- 1. Crear el tipo ENUM para los roles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_system_role') THEN
        CREATE TYPE user_system_role AS ENUM ('tutor', 'veterinaria', 'moderador', 'superadmin');
    END IF;
END $$;

-- 2. Agregar la columna a la tabla existente 'animal_profiles'
ALTER TABLE public.animal_profiles 
ADD COLUMN IF NOT EXISTS system_role user_system_role DEFAULT 'tutor';

-- 3. Mover a los súper administradores existentes a este nuevo sistema
UPDATE public.animal_profiles 
SET system_role = 'superadmin' 
WHERE is_super_admin = true;

-- 4. Modificar la función 'is_super_admin' para que lea el nuevo rol y sea más abarcativa
-- Nota: Usamos OR REPLACE para actualizar la existente sin romper dependencias donde sea posible
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.animal_profiles
    WHERE id = user_id AND (is_super_admin = true OR system_role = 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Crear una función similar para verificar si alguien es moderador (o superior)
CREATE OR REPLACE FUNCTION public.is_moderator(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.animal_profiles
    WHERE id = user_id AND (system_role = 'moderador' OR system_role = 'superadmin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear función para verificar si es veterinaria (Puede leer tokens futuros)
CREATE OR REPLACE FUNCTION public.is_veterinary(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.animal_profiles
    WHERE id = user_id AND (system_role = 'veterinaria' OR system_role = 'superadmin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
# Make first user admin + seed courses

## Changes
1. Updates `handle_new_user()` so the very first employee account created
   becomes the admin automatically. Subsequent sign-ups default to 'sales'.
   This bootstraps role-based access without a manual admin-creation step.
2. Seeds the `courses` table with six tech courses (title, description,
   duration, price, cost) so the Courses page and profit dashboard have
   meaningful data on first load.

## Security
- No policy changes. The trigger remains SECURITY DEFINER so it can write
  to profiles during the auth sign-up flow.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first boolean;
BEGIN
  SELECT (COUNT(*) = 0) INTO is_first FROM public.profiles;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN is_first THEN 'admin' ELSE 'sales' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Seed courses
INSERT INTO courses (title, description, duration_weeks, price, cost)
VALUES
  ('Full-Stack Web Development', 'Master HTML, CSS, JavaScript, React, Node.js, and databases to build and deploy complete web applications from scratch.', 16, 1200.00, 400.00),
  ('Data Science & Machine Learning', 'Learn Python, statistics, data visualization, and ML algorithms including regression, classification, and neural networks.', 20, 1800.00, 600.00),
  ('UI/UX Design Fundamentals', 'Design thinking, wireframing, prototyping, and user research using Figma to create intuitive digital experiences.', 10, 900.00, 250.00),
  ('Cloud & DevOps Engineering', 'AWS, Docker, Kubernetes, CI/CD pipelines, infrastructure as code, and monitoring for modern cloud deployments.', 14, 1500.00, 500.00),
  ('Mobile App Development', 'Build cross-platform iOS and Android apps with React Native, covering navigation, state, and native APIs.', 12, 1100.00, 350.00),
  ('Cybersecurity Essentials', 'Network security, ethical hacking, threat analysis, and compliance fundamentals for protecting modern systems.', 8, 1000.00, 300.00)
ON CONFLICT DO NOTHING;

-- Create user_defined types for stages and categories
CREATE TYPE public.recovery_stage AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE public.task_category AS ENUM ('mindfulness', 'physical', 'social', 'reflection');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  recovery_stage recovery_stage NOT NULL DEFAULT 'mild',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create psychological assessments table
CREATE TABLE public.psychological_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL,
  score INTEGER NOT NULL,
  stage recovery_stage NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily tasks table
CREATE TABLE public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category task_category NOT NULL,
  stage recovery_stage NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychological_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for psychological assessments
CREATE POLICY "Users can view their own assessments" ON public.psychological_assessments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assessments" ON public.psychological_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for daily tasks
CREATE POLICY "Users can view their own tasks" ON public.daily_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.daily_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.daily_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for user streaks
CREATE POLICY "Users can view their own streaks" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, recovery_stage)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'User'),
    'mild'::recovery_stage
  );
  
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
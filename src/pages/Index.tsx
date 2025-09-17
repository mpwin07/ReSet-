import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { Dashboard } from "@/components/Dashboard";
import { PsychologicalAssessment } from "@/components/PsychologicalAssessment";
import { Button } from "@/components/ui/button";
import { Heart, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setNeedsAssessment(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // If no profile exists, create one
      if (!profileData && !error) {
        const displayName = user?.user_metadata?.display_name || 'User';
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            user_id: userId,
            display_name: displayName
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return;
        }
        
        profileData = newProfile;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // Reconcile display name if placeholder persists
      const preferredDisplayName = user?.user_metadata?.display_name;
      if (preferredDisplayName && profileData?.display_name && profileData.display_name !== preferredDisplayName) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ display_name: preferredDisplayName })
          .eq('user_id', userId)
          .select('*')
          .single();
        if (!updateError && updatedProfile) {
          profileData = updatedProfile;
        }
      }

      // Get the latest assessment to determine recovery stage
      const { data: latestAssessment } = await supabase
        .from('psychological_assessments')
        .select('stage')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const profileWithStage = {
        ...profileData,
        recovery_stage: latestAssessment?.stage || 'mild'
      };

      setProfile(profileWithStage);

      // Check if user needs assessment
      const { data: assessments } = await supabase
        .from('psychological_assessments')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      setNeedsAssessment(!assessments || assessments.length === 0);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const handleAssessmentComplete = async (stage: 'mild' | 'moderate' | 'severe') => {
    setNeedsAssessment(false);
    
    // Refresh profile to get updated stage
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center animated-bg">
        <div className="text-center">
          <div className="w-20 h-20 gradient-primary rounded-2xl animate-pulse mx-auto mb-6 glow-primary"></div>
          <p className="text-xl text-muted-foreground font-medium">Loading ReSet - The First step of New Life...</p>
          <div className="mt-4 w-32 h-1 bg-gradient-to-r from-primary to-healing rounded-full mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen animated-bg flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-healing/10"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-healing/5 rounded-full blur-3xl"></div>
        
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        
        <div className="text-center space-y-8 relative z-10 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mx-auto mb-8 w-24 h-24 gradient-primary rounded-2xl flex items-center justify-center glow-primary">
            <Heart className="w-12 h-12 text-white" />
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-healing to-encouragement bg-clip-text text-transparent neon-text leading-tight">
            Welcome to ReSet
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground">
            The First Step of a New Life
          </h2>
          
          {/* Description */}
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your personalized companion for addiction recovery. Get AI-powered daily tasks, 
            track your progress, and build lasting healthy habits with cutting-edge technology.
          </p>
          
          {/* CTA Button */}
          <div className="pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="gradient-primary hover-glow text-white px-12 py-8 text-xl font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105"
            >
              <LogIn className="mr-3 h-6 w-6" />
              Get Started
            </Button>
          </div>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <div className="glass px-6 py-3 rounded-full">
              <span className="text-sm font-medium text-foreground">AI-Powered Tasks</span>
            </div>
            <div className="glass px-6 py-3 rounded-full">
              <span className="text-sm font-medium text-foreground">Progress Tracking</span>
            </div>
            <div className="glass px-6 py-3 rounded-full">
              <span className="text-sm font-medium text-foreground">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (needsAssessment) {
    return <PsychologicalAssessment onComplete={handleAssessmentComplete} />;
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center animated-bg">
        <div className="text-center">
          <div className="w-20 h-20 gradient-healing rounded-2xl animate-pulse mx-auto mb-6 glow-healing"></div>
          <p className="text-xl text-muted-foreground font-medium">Setting up your profile...</p>
          <div className="mt-4 w-32 h-1 bg-gradient-to-r from-healing to-encouragement rounded-full mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  return <Dashboard profile={profile} />;
};

export default Index;

import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { Dashboard } from "@/components/Dashboard";
import { PsychologicalAssessment } from "@/components/PsychologicalAssessment";
import { Button } from "@/components/ui/button";
import { Heart, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // Get the latest assessment to determine recovery stage
      const { data: latestAssessment } = await supabase
        .from('psychological_assessments')
        .select('stage')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-healing-light to-encouragement-light">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-healing to-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading RecoveryMate AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light via-healing-light to-encouragement-light flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-healing to-primary rounded-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-healing bg-clip-text text-transparent">
            Welcome to RecoveryMate AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Your personalized companion for addiction recovery. Get AI-powered daily tasks, track your progress, and build lasting healthy habits.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-primary to-healing hover:from-primary-dark hover:to-healing-dark text-white px-8 py-6 text-lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  if (needsAssessment) {
    return <PsychologicalAssessment onComplete={handleAssessmentComplete} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-healing-light to-encouragement-light">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-healing to-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return <Dashboard profile={profile} />;
};

export default Index;

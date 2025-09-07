import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle, 
  Flame, 
  Calendar, 
  Target,
  Smile,
  Meh,
  Frown,
  Zap,
  LogOut,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  recovery_stage: 'mild' | 'moderate' | 'severe';
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: 'mindfulness' | 'physical' | 'social' | 'reflection';
}

interface DashboardProps {
  profile: Profile;
}

const MOODS = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-success' },
  { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-muted-foreground' },
  { value: 'sad', label: 'Sad', icon: Frown, color: 'text-primary' },
  { value: 'stressed', label: 'Stressed', icon: Zap, color: 'text-encouragement' },
];

export function Dashboard({ profile }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMood, setCurrentMood] = useState<string>('');
  const [streak, setStreak] = useState(0);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    fetchTodaysTasks();
    fetchStreak();
  }, [profile]);

  const fetchTodaysTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: tasksData, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (tasksData && tasksData.length > 0) {
        setTasks(tasksData.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          completed: task.is_completed,
          category: task.category as 'mindfulness' | 'physical' | 'social' | 'reflection'
        })));
      } else {
        // No tasks for today, generate them
        await generateAITasks();
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load today's tasks",
        variant: "destructive"
      });
    }
  };

  const fetchStreak = async () => {
    try {
      const { data: streakData, error } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (error) throw error;
      
      // If no streak record exists, create one
      if (!streakData) {
        const { data: newStreak, error: insertError } = await supabase
          .from('user_streaks')
          .insert([{
            user_id: profile.user_id,
            current_streak: 0,
            longest_streak: 0
          }])
          .select('current_streak')
          .single();
        
        if (insertError) {
          console.error('Error creating streak record:', insertError);
          setStreak(0);
        } else {
          setStreak(newStreak?.current_streak || 0);
        }
      } else {
        setStreak(streakData?.current_streak || 0);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
      setStreak(0);
    }
  };

  const generateAITasks = async () => {
    if (!user) return;
    
    setIsGeneratingTasks(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-tasks', {
        body: {
          stage: profile.recovery_stage,
          userId: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Tasks Generated!",
        description: `${data.tasks?.length || 0} personalized tasks created for today.`
      });

      // Refresh tasks
      await fetchTodaysTasks();
    } catch (error) {
      console.error('Error generating AI tasks:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newCompletedState = !task.completed;
      
      const { error } = await supabase
        .from('daily_tasks')
        .update({
          is_completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: newCompletedState }
          : task
      ));

      if (newCompletedState) {
        toast({
          title: "Great job!",
          description: "Task completed successfully."
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const getMoodFeedback = (mood: string) => {
    const feedback = {
      happy: "That's wonderful! Keep channeling this positive energy into your recovery journey.",
      neutral: "Sometimes neutral is exactly where we need to be. You're doing great by staying present.",
      sad: "It's okay to feel sad. Remember, every feeling is temporary, and you're stronger than you know.",
      stressed: "Take a deep breath. You've overcome challenges before, and you can handle this too."
    };
    return feedback[mood as keyof typeof feedback] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-healing-light/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome back, {profile.display_name}! 
            </h1>
            <p className="text-lg text-muted-foreground">
              Let's make today another step forward
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="w-5 h-5 text-encouragement" />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-encouragement">{streak}</div>
              <p className="text-sm text-muted-foreground">days strong</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-success" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{completedTasks}/{tasks.length}</div>
              <Progress value={progressPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Recovery Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-sm font-medium">
                {profile.recovery_stage.charAt(0).toUpperCase() + profile.recovery_stage.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Today's Tasks</CardTitle>
                <CardDescription>
                  AI-generated activities personalized for your recovery journey
                </CardDescription>
              </div>
              <Button 
                onClick={generateAITasks} 
                disabled={isGeneratingTasks}
                variant="outline"
              >
                {isGeneratingTasks ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Tasks
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {isGeneratingTasks ? "Generating your personalized tasks..." : "No tasks for today. Click 'Regenerate Tasks' to get started."}
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    task.completed 
                      ? 'bg-success-light border-success' 
                      : 'bg-card hover:bg-accent border-border'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.completed ? (
                    <CheckCircle className="w-6 h-6 text-success mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-medium ${task.completed ? 'line-through text-success' : ''}`}>
                      {task.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {task.category}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Mood Check-in */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">How are you feeling?</CardTitle>
            <CardDescription>
              Your mood matters. Let us know how you're doing today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MOODS.map((mood) => (
                <Button
                  key={mood.value}
                  variant={currentMood === mood.value ? "default" : "outline"}
                  className={`h-20 flex-col gap-2 ${
                    currentMood === mood.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setCurrentMood(mood.value)}
                >
                  <mood.icon className={`w-6 h-6 ${currentMood === mood.value ? 'text-primary-foreground' : mood.color}`} />
                  <span className="text-sm">{mood.label}</span>
                </Button>
              ))}
            </div>
            
            {currentMood && (
              <div className="mt-4 p-4 bg-accent rounded-lg border-l-4 border-primary">
                <p className="text-sm font-medium text-foreground">
                  {getMoodFeedback(currentMood)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
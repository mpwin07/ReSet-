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
import { ThemeToggle } from "@/components/ThemeToggle";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";

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
  { 
    value: 'happy', 
    label: 'Happy', 
    icon: Smile, 
    color: 'text-success',
    description: 'Feeling great and positive!',
    emoji: '😊',
    tips: ['Keep doing what makes you happy!', 'Share your joy with others', 'Celebrate small wins']
  },
  { 
    value: 'neutral', 
    label: 'Neutral', 
    icon: Meh, 
    color: 'text-muted-foreground',
    description: 'Feeling balanced and steady',
    emoji: '😐',
    tips: ['Sometimes neutral is perfect', 'Take time to reflect', 'Stay present and mindful']
  },
  { 
    value: 'sad', 
    label: 'Sad', 
    icon: Frown, 
    color: 'text-primary',
    description: 'Feeling down or low',
    emoji: '😢',
    tips: ['It\'s okay to feel sad', 'Reach out to someone you trust', 'Remember this feeling is temporary']
  },
  { 
    value: 'stressed', 
    label: 'Stressed', 
    icon: Zap, 
    color: 'text-encouragement',
    description: 'Feeling overwhelmed or anxious',
    emoji: '😰',
    tips: ['Take deep breaths', 'Break tasks into smaller steps', 'Practice self-care']
  },
];

export function Dashboard({ profile }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMood, setCurrentMood] = useState<string>('');
  const [streak, setStreak] = useState(0);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

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
    
    // Frontend limit: only allow regeneration if we have less than 5 tasks
    if (tasks.length >= 5) {
      toast({
        title: "Task limit reached",
        description: "You already have 5 tasks for today. Complete some to make room for new ones.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingTasks(true);
    try {
      // Clear today's existing tasks to avoid duplicates
      const today = new Date().toISOString().split('T')[0];
      const { error: deleteError } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('user_id', profile.user_id)
        .eq('date', today);
      if (deleteError) throw deleteError;

      const { data, error } = await supabase.functions.invoke('generate-ai-tasks', {
        body: {
          stage: profile.recovery_stage,
          userId: user.id,
          count: 5 // Always generate exactly 5 tasks
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleTaskComplete = async (taskId: string, journalEntry?: string, photoUrl?: string) => {
    try {
      // For now, just update the basic completion status
      // TODO: Add journal_entry and photo_url columns to database schema
      const { error } = await supabase
        .from('daily_tasks')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Log the additional data for now (can be stored in localStorage or separate table later)
      if (journalEntry || photoUrl) {
        console.log('Task completion data:', {
          taskId,
          journalEntry,
          photoUrl,
          timestamp: new Date().toISOString()
        });
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: true }
          : task
      ));

      toast({
        title: "Great job!",
        description: "Task completed successfully."
      });

      // Update streak if all tasks are completed
      const newlyCompletedCount = tasks.filter(t => t.completed).length + 1;
      const totalTasks = tasks.length;
      if (newlyCompletedCount >= totalTasks && totalTasks > 0) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { data: streakRow, error: streakFetchError } = await supabase
            .from('user_streaks')
            .select('current_streak, longest_streak, last_activity_date')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          if (streakFetchError) throw streakFetchError;

          const lastDate = streakRow?.last_activity_date as string | undefined;
          if (lastDate === today) {
            return;
          }

          const last = lastDate ? new Date(lastDate + 'T00:00:00') : null;
          const now = new Date(today + 'T00:00:00');
          const msPerDay = 24 * 60 * 60 * 1000;
          const diffDays = last ? Math.round((now.getTime() - last.getTime()) / msPerDay) : undefined;

          let newCurrent = 1;
          if (typeof diffDays === 'number') {
            if (diffDays === 1) newCurrent = (streakRow?.current_streak || 0) + 1;
            else if (diffDays === 0) newCurrent = streakRow?.current_streak || 1;
            else newCurrent = 1;
          }

          const newLongest = Math.max(newCurrent, streakRow?.longest_streak || 0);

          const { error: updateErr } = await supabase
            .from('user_streaks')
            .update({
              current_streak: newCurrent,
              longest_streak: newLongest,
              last_activity_date: today
            })
            .eq('user_id', profile.user_id);

          if (updateErr) throw updateErr;

          setStreak(newCurrent);
        } catch (streakError) {
          console.error('Error updating streak:', streakError);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: `Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    const moodData = MOODS.find(m => m.value === mood);
    if (!moodData) return '';
    
    const feedback = {
      happy: `That's wonderful! ${moodData.description} Keep channeling this positive energy into your recovery journey. You're making great progress!`,
      neutral: `Sometimes neutral is exactly where we need to be. ${moodData.description} You're doing great by staying present and balanced.`,
      sad: `It's okay to feel sad. ${moodData.description} Remember, every feeling is temporary, and you're stronger than you know. You've got this!`,
      stressed: `Take a deep breath. ${moodData.description} You've overcome challenges before, and you can handle this too. One step at a time.`
    };
    return feedback[mood as keyof typeof feedback] || '';
  };

  const getMoodTips = (mood: string) => {
    const moodData = MOODS.find(m => m.value === mood);
    return moodData?.tips || [];
  };

  return (
    <div className="min-h-screen animated-bg p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-healing/5"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-healing/3 rounded-full blur-3xl"></div>
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center py-8">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-healing to-encouragement bg-clip-text text-transparent mb-3 neon-text">
              Welcome back, {profile.display_name}! 
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              Let's make today another step forward in your journey
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="glass hover-glow border-border/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass border-border/30 hover-glow transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 gradient-encouragement rounded-lg flex items-center justify-center glow">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-encouragement mb-2">{streak}</div>
              <p className="text-muted-foreground font-medium">days strong</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/30 hover-glow transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 gradient-progress rounded-lg flex items-center justify-center glow">
                  <Target className="w-5 h-5 text-white" />
                </div>
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success mb-2">{completedTasks}/{tasks.length}</div>
              <Progress value={progressPercentage} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="glass border-border/30 hover-glow transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center glow">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                Recovery Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                variant="secondary" 
                className="text-sm font-medium px-4 py-2 gradient-primary text-white"
              >
                {profile.recovery_stage.charAt(0).toUpperCase() + profile.recovery_stage.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        <Card className="glass border-border/30 hover-glow transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-healing bg-clip-text text-transparent">
                  Today's Tasks
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  AI-generated activities personalized for your recovery journey
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={generateAITasks}
                disabled={isGeneratingTasks}
                className="glass hover-glow"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingTasks ? 'animate-spin' : ''}`} />
                {isGeneratingTasks ? 'Generating...' : 'Generate Tasks'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg text-muted-foreground font-medium">
                  {isGeneratingTasks ? "Generating your personalized tasks..." : "No tasks for today. Tasks will be generated automatically."}
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-4 p-6 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                    task.completed 
                      ? 'glass border-success/50 bg-success/5 hover-glow' 
                      : 'glass border-border/30 hover:border-primary/50 hover-glow'
                  }`}
                  onClick={() => handleTaskClick(task)}
                >
                  {task.completed ? (
                    <div className="w-8 h-8 gradient-encouragement rounded-full flex items-center justify-center glow mt-1">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 border-2 border-muted-foreground rounded-full flex items-center justify-center group-hover:border-primary transition-colors mt-1">
                      <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-success' : 'text-foreground'}`}>
                      {task.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      {task.description}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`mt-3 text-xs px-3 py-1 ${
                        task.completed 
                          ? 'border-success/50 text-success' 
                          : 'border-primary/50 text-primary'
                      }`}
                    >
                      {task.category}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Mood Check-in */}
        <Card className="glass border-border/30 hover-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-healing to-encouragement bg-clip-text text-transparent">
              How are you feeling today? 💭
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Your emotional well-being is important. Take a moment to check in with yourself.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Mood Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {MOODS.map((mood) => (
                <Button
                  key={mood.value}
                  variant={currentMood === mood.value ? "default" : "outline"}
                  className={`h-28 flex-col gap-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                    currentMood === mood.value 
                      ? 'gradient-primary text-white hover-glow shadow-lg' 
                      : 'glass hover:border-primary/50 hover-glow'
                  }`}
                  onClick={() => setCurrentMood(mood.value)}
                >
                  <div className="text-2xl">{mood.emoji}</div>
                  <mood.icon className={`w-6 h-6 ${currentMood === mood.value ? 'text-white' : mood.color}`} />
                  <div className="text-center">
                    <div className="text-sm font-semibold">{mood.label}</div>
                    <div className="text-xs opacity-80">{mood.description}</div>
                  </div>
                </Button>
              ))}
            </div>
            
            {/* Mood Feedback Section */}
            {currentMood && (
              <div className="space-y-6">
                {/* Main Feedback */}
                <div className="p-6 glass rounded-2xl border-l-4 border-primary glow">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">
                      {MOODS.find(m => m.value === currentMood)?.emoji}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {MOODS.find(m => m.value === currentMood)?.label} - {MOODS.find(m => m.value === currentMood)?.description}
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {getMoodFeedback(currentMood)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tips Section */}
                <div className="p-6 glass rounded-2xl border-l-4 border-healing glow">
                  <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="text-healing">💡</span>
                    Helpful Tips for You
                  </h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    {getMoodTips(currentMood).map((tip, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-gradient-to-r from-healing/10 to-encouragement/10 rounded-xl border border-healing/20"
                      >
                        <p className="text-sm text-foreground font-medium">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    className="glass hover-glow border-healing/50 text-healing hover:text-white hover:bg-healing"
                  >
                    📝 Journal Entry
                  </Button>
                  <Button 
                    variant="outline" 
                    className="glass hover-glow border-encouragement/50 text-encouragement hover:text-white hover:bg-encouragement"
                  >
                    🧘 Quick Meditation
                  </Button>
                  <Button 
                    variant="outline" 
                    className="glass hover-glow border-primary/50 text-primary hover:text-white hover:bg-primary"
                  >
                    🎵 Relaxing Music
                  </Button>
                </div>

                {/* Progress Indicator */}
                <div className="p-4 glass rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Daily Mood Check-in</span>
                    <span className="text-sm text-muted-foreground">✓ Completed</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-healing to-encouragement h-2 rounded-full w-full transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Encouragement Section */}
            {!currentMood && (
              <div className="text-center p-8 glass rounded-2xl border border-primary/20">
                <div className="text-4xl mb-4">🌟</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Your Feelings Matter
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Taking time to acknowledge your emotions is an important part of your recovery journey. 
                  Select how you're feeling above to get personalized support and tips.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Detail Dialog */}
        <TaskDetailDialog
          task={selectedTask}
          isOpen={isTaskDialogOpen}
          onClose={() => {
            setIsTaskDialogOpen(false);
            setSelectedTask(null);
          }}
          onComplete={handleTaskComplete}
        />
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
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
  Zap
} from "lucide-react";

interface UserData {
  name: string;
  stage: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: 'mindfulness' | 'physical' | 'social' | 'reflection';
}

interface DashboardProps {
  userData: UserData;
}

const TASKS_BY_STAGE = {
  mild: [
    { id: '1', title: 'Morning Gratitude', description: 'Write down 3 things you\'re grateful for today', category: 'reflection' as const },
    { id: '2', title: '10-Minute Walk', description: 'Take a refreshing walk in nature or around your neighborhood', category: 'physical' as const },
    { id: '3', title: 'Deep Breathing', description: 'Practice 5 minutes of deep breathing exercises', category: 'mindfulness' as const },
  ],
  moderate: [
    { id: '1', title: 'Journal Reflection', description: 'Write about your feelings and progress for 15 minutes', category: 'reflection' as const },
    { id: '2', title: 'Physical Exercise', description: 'Complete 20 minutes of physical activity', category: 'physical' as const },
    { id: '3', title: 'Mindful Meditation', description: 'Practice 10 minutes of guided meditation', category: 'mindfulness' as const },
    { id: '4', title: 'Connect with Support', description: 'Reach out to a friend, family member, or support group', category: 'social' as const },
  ],
  severe: [
    { id: '1', title: 'Structured Journaling', description: 'Complete a detailed journal entry focusing on triggers and coping strategies', category: 'reflection' as const },
    { id: '2', title: 'Mindfulness Practice', description: 'Engage in 15 minutes of mindfulness or meditation', category: 'mindfulness' as const },
    { id: '3', title: 'Physical Movement', description: 'Complete 30 minutes of physical activity or exercise', category: 'physical' as const },
    { id: '4', title: 'Support Network', description: 'Have a meaningful conversation with someone in your support network', category: 'social' as const },
    { id: '5', title: 'Coping Strategy Practice', description: 'Practice a healthy coping mechanism when feeling triggered', category: 'mindfulness' as const },
  ]
};

const MOODS = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-success' },
  { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-muted-foreground' },
  { value: 'sad', label: 'Sad', icon: Frown, color: 'text-primary' },
  { value: 'stressed', label: 'Stressed', icon: Zap, color: 'text-encouragement' },
];

export function Dashboard({ userData }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMood, setCurrentMood] = useState<string>('');
  const [streak, setStreak] = useState(3);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    const stageTasks = TASKS_BY_STAGE[userData.stage as keyof typeof TASKS_BY_STAGE] || TASKS_BY_STAGE.mild;
    setTasks(stageTasks.map(task => ({ ...task, completed: false })));
  }, [userData.stage]);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
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
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {userData.name}! 
          </h1>
          <p className="text-lg text-muted-foreground">
            Let's make today another step forward
          </p>
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
                {userData.stage.charAt(0).toUpperCase() + userData.stage.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Today's Tasks</CardTitle>
            <CardDescription>
              Personalized activities to support your recovery journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((task) => (
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
            ))}
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
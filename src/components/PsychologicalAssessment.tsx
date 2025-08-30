import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AssessmentProps {
  onComplete: (stage: 'mild' | 'moderate' | 'severe') => void;
}

const QUESTIONS = [
  {
    id: 1,
    question: "How often do you think about using substances?",
    options: [
      { value: 1, text: "Rarely or never" },
      { value: 2, text: "Occasionally" },
      { value: 3, text: "Often" },
      { value: 4, text: "Almost constantly" }
    ]
  },
  {
    id: 2,
    question: "How much control do you feel you have over your substance use?",
    options: [
      { value: 1, text: "Complete control" },
      { value: 2, text: "Mostly in control" },
      { value: 3, text: "Some control" },
      { value: 4, text: "Little to no control" }
    ]
  },
  {
    id: 3,
    question: "How has substance use affected your relationships?",
    options: [
      { value: 1, text: "Not at all" },
      { value: 2, text: "Slightly" },
      { value: 3, text: "Moderately" },
      { value: 4, text: "Severely damaged relationships" }
    ]
  },
  {
    id: 4,
    question: "How often do you experience withdrawal symptoms?",
    options: [
      { value: 1, text: "Never" },
      { value: 2, text: "Rarely" },
      { value: 3, text: "Sometimes" },
      { value: 4, text: "Frequently" }
    ]
  },
  {
    id: 5,
    question: "How much has substance use interfered with your daily responsibilities?",
    options: [
      { value: 1, text: "Not at all" },
      { value: 2, text: "Slightly" },
      { value: 3, text: "Moderately" },
      { value: 4, text: "Significantly" }
    ]
  },
  {
    id: 6,
    question: "How motivated do you feel about recovery right now?",
    options: [
      { value: 4, text: "Extremely motivated" },
      { value: 3, text: "Quite motivated" },
      { value: 2, text: "Somewhat motivated" },
      { value: 1, text: "Not very motivated" }
    ]
  }
];

export function PsychologicalAssessment({ onComplete }: AssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  const handleAnswer = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [QUESTIONS[currentQuestion].id]: parseInt(value)
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitAssessment();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitAssessment = async () => {
    setLoading(true);
    
    try {
      const totalScore = Object.values(responses).reduce((sum, score) => sum + score, 0);
      const maxScore = QUESTIONS.length * 4;
      const normalizedScore = (totalScore / maxScore) * 100;

      let stage: 'mild' | 'moderate' | 'severe';
      if (normalizedScore <= 40) {
        stage = 'mild';
      } else if (normalizedScore <= 70) {
        stage = 'moderate';
      } else {
        stage = 'severe';
      }

      // Save assessment to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: assessmentError } = await supabase
        .from('psychological_assessments')
        .insert({
          user_id: user.id,
          responses,
          score: totalScore,
          stage
        });

      if (assessmentError) throw assessmentError;

      toast({
        title: "Assessment Complete",
        description: `Your recovery stage has been determined as ${stage}. We'll customize your experience accordingly.`
      });

      onComplete(stage);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const currentAnswer = responses[QUESTIONS[currentQuestion].id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-healing-light to-encouragement-light flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Recovery Assessment
          </CardTitle>
          <CardDescription className="text-lg">
            Help us understand your current situation to personalize your experience
          </CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Question {currentQuestion + 1} of {QUESTIONS.length}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-6">
              {QUESTIONS[currentQuestion].question}
            </h3>
          </div>

          <RadioGroup 
            value={currentAnswer?.toString()} 
            onValueChange={handleAnswer}
            className="space-y-4"
          >
            {QUESTIONS[currentQuestion].options.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                <Label 
                  htmlFor={`option-${option.value}`} 
                  className="flex-1 cursor-pointer text-base"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={nextQuestion}
              disabled={!currentAnswer || loading}
            >
              {currentQuestion === QUESTIONS.length - 1 ? (
                loading ? "Submitting..." : "Complete Assessment"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
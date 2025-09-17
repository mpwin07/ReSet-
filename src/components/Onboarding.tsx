import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ArrowRight } from "lucide-react";

interface OnboardingProps {
  onComplete: (userData: { name: string; stage: string }) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState("");
  const [stage, setStage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && stage) {
      onComplete({ name, stage });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-healing-light to-encouragement-light flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-healing to-primary rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-healing bg-clip-text text-transparent">
            Welcome to ReSet - The First step of New Life
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Your personal companion for recovery and growth
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                What should we call you?
              </label>
              <Input
                id="name"
                placeholder="Enter your preferred name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="stage" className="text-sm font-medium text-foreground">
                How would you describe your current stage?
              </label>
              <Select value={stage} onValueChange={setStage} required>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="Select your recovery stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild - Early awareness and motivation</SelectItem>
                  <SelectItem value="moderate">Moderate - Actively working on change</SelectItem>
                  <SelectItem value="severe">Severe - Need intensive support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-healing hover:from-primary-dark hover:to-healing-dark transition-all duration-300 shadow-lg"
              disabled={!name || !stage}
            >
              Start My Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
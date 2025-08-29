import { useState, useEffect } from "react";
import { Onboarding } from "@/components/Onboarding";
import { Dashboard } from "@/components/Dashboard";

interface UserData {
  name: string;
  stage: string;
}

const Index = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user data exists in localStorage
    const savedUserData = localStorage.getItem('recoverymate-user');
    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data);
    localStorage.setItem('recoverymate-user', JSON.stringify(data));
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

  if (!userData) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <Dashboard userData={userData} />;
};

export default Index;

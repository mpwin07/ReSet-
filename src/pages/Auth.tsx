import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the confirmation link!");
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-healing/10"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-healing/5 rounded-full blur-3xl"></div>
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md glass border-border/30 hover-glow relative z-10">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center glow-primary">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-healing to-encouragement bg-clip-text text-transparent neon-text">
            ReSet
          </CardTitle>
          <CardDescription className="text-xl text-muted-foreground mt-3 font-medium">
            The First Step of a New Life
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-2">
            Your journey to recovery starts here
          </p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 glass border-border/30">
              <TabsTrigger value="signin" className="data-[state=active]:gradient-primary data-[state=active]:text-white">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:gradient-primary data-[state=active]:text-white">Sign Up</TabsTrigger>
            </TabsList>

            {error && (
              <Alert className="glass border-destructive/50 text-destructive glow">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="glass border-success/50 text-success glow">
                <AlertDescription className="font-medium">{message}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="signin" className="space-y-6">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="signin-email" className="text-base font-medium">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass border-border/30 focus:border-primary/50 focus:glow transition-all duration-300"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="signin-password" className="text-base font-medium">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="glass border-border/30 focus:border-primary/50 focus:glow transition-all duration-300"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-primary hover-glow text-white py-6 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="signup-name" className="text-base font-medium">Display Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="What should we call you?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="glass border-border/30 focus:border-primary/50 focus:glow transition-all duration-300"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="signup-email" className="text-base font-medium">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass border-border/30 focus:border-primary/50 focus:glow transition-all duration-300"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="signup-password" className="text-base font-medium">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                    className="glass border-border/30 focus:border-primary/50 focus:glow transition-all duration-300"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-healing hover-glow text-white py-6 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
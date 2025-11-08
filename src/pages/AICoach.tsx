import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Bot, Utensils, Dumbbell, Loader2, Sparkles } from "lucide-react";

const AICoach = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loadingMeal, setLoadingMeal] = useState(false);
  const [loadingWorkout, setLoadingWorkout] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const { data: recommendations, refetch } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: workouts } = useQuery({
    queryKey: ['workout-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: healthMetrics } = useQuery({
    queryKey: ['health-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const generateRecommendation = async (type: 'meal' | 'workout') => {
    if (type === 'meal') {
      setLoadingMeal(true);
    } else {
      setLoadingWorkout(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          type,
          healthData: healthMetrics || [],
          workoutHistory: workouts || [],
        }
      });

      if (error) throw error;

      toast({
        title: `${type === 'meal' ? 'Meal' : 'Workout'} Plan Ready! ✨`,
        description: "Your personalized recommendation has been generated.",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error generating recommendation",
        description: error.message,
      });
    } finally {
      setLoadingMeal(false);
      setLoadingWorkout(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">AI Coach</h2>
          <p className="text-muted-foreground">Get personalized recommendations</p>
        </div>

        <Card className="bg-gradient-primary border-0 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Your AI Fitness Coach</h3>
                <p className="text-sm opacity-90">Powered by advanced AI</p>
              </div>
            </div>
            <p className="opacity-90">
              Get personalized meal and workout plans based on your health data and training history.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <CardTitle>Meal Plan</CardTitle>
                  <CardDescription>AI-powered nutrition guidance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateRecommendation('meal')}
                disabled={loadingMeal}
                className="w-full bg-gradient-secondary hover:opacity-90"
              >
                {loadingMeal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Meal Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Workout Plan</CardTitle>
                  <CardDescription>Personalized training program</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateRecommendation('workout')}
                disabled={loadingWorkout}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {loadingWorkout ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Workout Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {recommendations && recommendations.length > 0 && (
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Your Recommendations</CardTitle>
              <CardDescription>AI-generated plans for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-lg bg-background/50 border border-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold">{rec.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rec.recommendation_type === 'meal' 
                        ? 'bg-secondary/20 text-secondary' 
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {rec.recommendation_type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {rec.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(rec.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AICoach;
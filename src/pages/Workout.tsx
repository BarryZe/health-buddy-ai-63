import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

const Workout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(30);
  const [calories, setCalories] = useState(200);
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", sets: 3, reps: 10, weight: 0 }
  ]);

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: 10, weight: 0 }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          title: title || 'Workout Session',
          notes,
          duration_minutes: duration,
          calories_burned: calories,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Add exercises
      const exercisesData = exercises
        .filter(ex => ex.name.trim())
        .map(ex => ({
          workout_id: workout.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
        }));

      if (exercisesData.length > 0) {
        const { error: exercisesError } = await supabase
          .from('exercises')
          .insert(exercisesData);

        if (exercisesError) throw exercisesError;
      }

      toast({
        title: "Workout logged! 🎉",
        description: "Great job! Your progress has been saved.",
      });

      navigate('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error logging workout",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Log Workout</h2>
          <p className="text-muted-foreground">Track your training session</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Workout Details</CardTitle>
              <CardDescription>Basic information about your session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Workout Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Upper Body Strength"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did you feel? Any observations?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exercises</CardTitle>
                  <CardDescription>Track individual exercises</CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addExercise}
                  className="bg-primary/20 hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={index} className="p-4 rounded-lg bg-background/50 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Exercise {index + 1}</Label>
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                    placeholder="Exercise name"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Sets</Label>
                      <Input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reps</Label>
                      <Input
                        type="number"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(index, 'reps', Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Weight (lbs)</Label>
                      <Input
                        type="number"
                        value={exercise.weight}
                        onChange={(e) => updateExercise(index, 'weight', Number(e.target.value))}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={loading}
            size="lg"
          >
            {loading ? "Saving..." : "Complete Workout"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Workout;
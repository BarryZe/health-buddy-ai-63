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

interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

const Nutrition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [meals, setMeals] = useState<Meal[]>([
    { name: "", calories: 0, protein: 0, carbs: 0, fat: 0, time: "08:00" }
  ]);

  const addMeal = () => {
    setMeals([...meals, { name: "", calories: 0, protein: 0, carbs: 0, fat: 0, time: "12:00" }]);
  };

  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const updateMeal = (index: number, field: keyof Meal, value: string | number) => {
    const updated = [...meals];
    updated[index] = { ...updated[index], [field]: value };
    setMeals(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate totals
      const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
      const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
      const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
      const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

      // Create nutrition entry
      const { data: nutrition, error: nutritionError } = await supabase
        .from('nutrition')
        .insert({
          user_id: user.id,
          date,
          total_calories: totalCalories,
          total_protein: totalProtein,
          total_carbs: totalCarbs,
          total_fat: totalFat,
          notes,
        })
        .select()
        .single();

      if (nutritionError) throw nutritionError;

      // Add meals
      const mealsData = meals
        .filter(meal => meal.name.trim())
        .map(meal => ({
          nutrition_id: nutrition.id,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          time: meal.time,
        }));

      if (mealsData.length > 0) {
        const { error: mealsError } = await supabase
          .from('meals')
          .insert(mealsData);

        if (mealsError) throw mealsError;
      }

      toast({
        title: "Nutrition logged! 🥗",
        description: "Your meals have been saved.",
      });

      navigate('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error logging nutrition",
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
          <h2 className="text-3xl font-bold mb-2">Log Nutrition</h2>
          <p className="text-muted-foreground">Track your meals and nutrients</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Nutrition Details</CardTitle>
              <CardDescription>Log your daily meals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did you feel? Water intake?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Meals</CardTitle>
                  <CardDescription>Track individual meals</CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addMeal}
                  className="bg-primary/20 hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {meals.map((meal, index) => (
                <div key={index} className="p-4 rounded-lg bg-background/50 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Meal {index + 1}</Label>
                    {meals.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMeal(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Meal Name</Label>
                      <Input
                        value={meal.name}
                        onChange={(e) => updateMeal(index, 'name', e.target.value)}
                        placeholder="e.g., Breakfast"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Time</Label>
                      <Input
                        type="time"
                        value={meal.time}
                        onChange={(e) => updateMeal(index, 'time', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Calories</Label>
                      <Input
                        type="number"
                        value={meal.calories}
                        onChange={(e) => updateMeal(index, 'calories', Number(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Protein (g)</Label>
                      <Input
                        type="number"
                        value={meal.protein}
                        onChange={(e) => updateMeal(index, 'protein', Number(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Carbs (g)</Label>
                      <Input
                        type="number"
                        value={meal.carbs}
                        onChange={(e) => updateMeal(index, 'carbs', Number(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fat (g)</Label>
                      <Input
                        type="number"
                        value={meal.fat}
                        onChange={(e) => updateMeal(index, 'fat', Number(e.target.value))}
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
            {loading ? "Saving..." : "Save Nutrition Log"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Nutrition;
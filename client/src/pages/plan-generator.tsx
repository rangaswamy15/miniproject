import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Target,
  Calendar,
  Clock,
  Dumbbell,
  AlertTriangle,
} from "lucide-react";
import { generatePlanSchema, type GeneratePlanData } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

const EQUIPMENT_OPTIONS = [
  { id: "BODYWEIGHT", label: "Bodyweight Only" },
  { id: "DUMBBELL", label: "Dumbbells" },
  { id: "BARBELL", label: "Barbell & Plates" },
  { id: "KETTLEBELL", label: "Kettlebells" },
  { id: "BAND", label: "Resistance Bands" },
  { id: "MACHINE", label: "Gym Machines" },
  { id: "CABLE", label: "Cable Machine" },
];

const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Lose Weight" },
  { value: "muscle_gain", label: "Build Muscle" },
  { value: "strength", label: "Get Stronger" },
  { value: "endurance", label: "Improve Endurance" },
  { value: "flexibility", label: "Increase Flexibility" },
  { value: "general_fitness", label: "General Fitness" },
];

export default function PlanGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(["BODYWEIGHT"]);

  const form = useForm<GeneratePlanData>({
    resolver: zodResolver(generatePlanSchema),
    defaultValues: {
      goal: "",
      level: "BEGINNER",
      frequencyPerWeek: 3,
      durationWeeks: 4,
      equipment: ["BODYWEIGHT"],
      timePerDay: 45,
      injuries: "",
    },
  });

  const toggleEquipment = (id: string) => {
    const updated = selectedEquipment.includes(id)
      ? selectedEquipment.filter((e) => e !== id)
      : [...selectedEquipment, id];
    setSelectedEquipment(updated);
    form.setValue("equipment", updated);
  };

  const generateMutation = useMutation({
    mutationFn: async (data: GeneratePlanData) => {
      setIsGenerating(true);
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      try {
        const response = await apiRequest("POST", "/api/plans/generate", data);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to generate plan");
        }

        clearInterval(progressInterval);
        setProgress(100);
        
        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({
        title: "Workout Plan Generated!",
        description: "Your personalized AI workout plan is ready.",
      });
      setTimeout(() => {
        setLocation("/plans");
      }, 1000);
    },
    onError: (error: Error) => {
      setIsGenerating(false);
      setProgress(0);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to generate workout plan. Please try again.",
      });
    },
  });

  const onSubmit = (data: GeneratePlanData) => {
    generateMutation.mutate({ ...data, equipment: selectedEquipment });
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              {progress === 100 ? (
                <CheckCircle2 className="w-10 h-10 text-chart-2" />
              ) : (
                <Brain className="w-10 h-10 text-primary animate-pulse" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {progress === 100 ? "Plan Ready!" : "Generating Your Plan..."}
            </h2>
            <p className="text-muted-foreground mb-6">
              {progress === 100
                ? "Redirecting you to your new workout plan"
                : "Our AI is crafting a personalized workout plan just for you"}
            </p>
            <Progress value={progress} className="h-2 mb-4" />
            <p className="text-sm text-muted-foreground">{progress}% complete</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/plans">
        <Button variant="ghost" data-testid="button-back-plans">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Plans
        </Button>
      </Link>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-chart-2 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Generate AI Workout Plan</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Tell us about your goals and we'll create a personalized workout plan tailored just for you.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Goal */}
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Primary Goal
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-goal">
                          <SelectValue placeholder="What do you want to achieve?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GOAL_OPTIONS.map((goal) => (
                          <SelectItem key={goal.value} value={goal.value}>
                            {goal.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Level */}
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fitness Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-level">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Frequency */}
              <FormField
                control={form.control}
                name="frequencyPerWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Workouts per Week: {field.value}
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={7}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                        data-testid="slider-frequency"
                      />
                    </FormControl>
                    <FormDescription>
                      Recommended: 3-5 workouts per week for optimal results
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="durationWeeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Duration: {field.value} weeks</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={12}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                        data-testid="slider-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time per Day */}
              <FormField
                control={form.control}
                name="timePerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time per Workout: {field.value} minutes
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={15}
                        max={120}
                        step={5}
                        value={[field.value || 45]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                        data-testid="slider-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Equipment */}
              <div className="space-y-3">
                <FormLabel className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Available Equipment
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((item) => (
                    <Badge
                      key={item.id}
                      variant={selectedEquipment.includes(item.id) ? "default" : "outline"}
                      className="cursor-pointer py-2 px-4"
                      onClick={() => toggleEquipment(item.id)}
                      data-testid={`badge-equipment-${item.id}`}
                    >
                      {selectedEquipment.includes(item.id) && (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      {item.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Injuries */}
              <FormField
                control={form.control}
                name="injuries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Injuries or Limitations (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Lower back pain, previous knee surgery..."
                        className="min-h-[80px]"
                        data-testid="textarea-injuries"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      We'll avoid exercises that might aggravate any issues
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Disclaimer */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>
                  <strong>Disclaimer:</strong> This plan is algorithmically generated and not medical advice. Please consult a healthcare professional before starting any new exercise program.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={generateMutation.isPending}
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate My Workout Plan
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

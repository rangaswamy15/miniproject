import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Dumbbell, 
  Target, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Flame,
  Scale,
  Ruler,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

type Step = "goals" | "level" | "equipment" | "body" | "injuries";

const GOALS = [
  { id: "weight_loss", label: "Lose Weight", icon: Flame },
  { id: "muscle_gain", label: "Build Muscle", icon: Dumbbell },
  { id: "strength", label: "Get Stronger", icon: Target },
  { id: "endurance", label: "Improve Endurance", icon: ArrowRight },
  { id: "flexibility", label: "Increase Flexibility", icon: Scale },
  { id: "general_fitness", label: "General Fitness", icon: CheckCircle2 },
];

const LEVELS = [
  { id: "BEGINNER", label: "Beginner", description: "New to fitness or returning after a long break" },
  { id: "INTERMEDIATE", label: "Intermediate", description: "Working out regularly for 6+ months" },
  { id: "ADVANCED", label: "Advanced", description: "Training consistently for 2+ years" },
];

const EQUIPMENT = [
  { id: "BODYWEIGHT", label: "Bodyweight Only" },
  { id: "DUMBBELL", label: "Dumbbells" },
  { id: "BARBELL", label: "Barbell & Plates" },
  { id: "KETTLEBELL", label: "Kettlebells" },
  { id: "BAND", label: "Resistance Bands" },
  { id: "MACHINE", label: "Gym Machines" },
  { id: "CABLE", label: "Cable Machine" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { updateUser } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>("goals");
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    goal: "",
    fitnessLevel: "",
    availableEquipment: [] as string[],
    heightCm: "",
    weightKg: "",
    injuries: "",
  });

  const steps: Step[] = ["goals", "level", "equipment", "body", "injuries"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (step) {
      case "goals":
        return !!formData.goal;
      case "level":
        return !!formData.fitnessLevel;
      case "equipment":
        return formData.availableEquipment.length > 0;
      case "body":
        return true;
      case "injuries":
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step === "injuries") {
      await handleComplete();
    } else {
      const nextStep = steps[currentStepIndex + 1];
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    const prevStep = steps[currentStepIndex - 1];
    setStep(prevStep);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", "/api/users/me", {
        goal: formData.goal,
        fitnessLevel: formData.fitnessLevel,
        availableEquipment: formData.availableEquipment,
        heightCm: formData.heightCm ? parseInt(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        injuries: formData.injuries || undefined,
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);

      toast({
        title: "Profile complete!",
        description: "Let's generate your first workout plan.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save your profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEquipment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      availableEquipment: prev.availableEquipment.includes(id)
        ? prev.availableEquipment.filter((e) => e !== id)
        : [...prev.availableEquipment, id],
    }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
      
      <div className="relative w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">FitStack</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center mt-2">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>

        <Card>
          {step === "goals" && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">What's Your Primary Goal?</CardTitle>
                <CardDescription>
                  Select the main fitness goal you want to achieve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setFormData((prev) => ({ ...prev, goal: goal.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover-elevate ${
                        formData.goal === goal.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      data-testid={`button-goal-${goal.id}`}
                    >
                      <goal.icon className={`w-8 h-8 mb-2 ${
                        formData.goal === goal.id ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <span className="font-medium">{goal.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </>
          )}

          {step === "level" && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">What's Your Fitness Level?</CardTitle>
                <CardDescription>
                  This helps us create the right plan for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setFormData((prev) => ({ ...prev, fitnessLevel: level.id }))}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all hover-elevate ${
                        formData.fitnessLevel === level.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      data-testid={`button-level-${level.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-lg">{level.label}</span>
                          <p className="text-muted-foreground text-sm">{level.description}</p>
                        </div>
                        {formData.fitnessLevel === level.id && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </>
          )}

          {step === "equipment" && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">What Equipment Do You Have?</CardTitle>
                <CardDescription>
                  Select all that apply - we'll tailor your workouts accordingly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 justify-center">
                  {EQUIPMENT.map((item) => (
                    <Badge
                      key={item.id}
                      variant={formData.availableEquipment.includes(item.id) ? "default" : "outline"}
                      className="px-4 py-2 text-sm cursor-pointer"
                      onClick={() => toggleEquipment(item.id)}
                      data-testid={`badge-equipment-${item.id}`}
                    >
                      {formData.availableEquipment.includes(item.id) && (
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                      )}
                      {item.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </>
          )}

          {step === "body" && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Body Measurements (Optional)</CardTitle>
                <CardDescription>
                  Help us track your progress over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="height" className="flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      value={formData.heightCm}
                      onChange={(e) => setFormData((prev) => ({ ...prev, heightCm: e.target.value }))}
                      data-testid="input-height"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="70"
                      value={formData.weightKg}
                      onChange={(e) => setFormData((prev) => ({ ...prev, weightKg: e.target.value }))}
                      data-testid="input-weight"
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === "injuries" && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Any Injuries or Limitations?</CardTitle>
                <CardDescription>
                  We'll make sure to avoid exercises that might aggravate any issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      This information helps us create safer workout plans. Please consult with a healthcare professional before starting any exercise program.
                    </p>
                  </div>
                  <Textarea
                    placeholder="e.g., Lower back pain, previous knee surgery, shoulder mobility issues..."
                    value={formData.injuries}
                    onChange={(e) => setFormData((prev) => ({ ...prev, injuries: e.target.value }))}
                    className="min-h-[120px]"
                    data-testid="textarea-injuries"
                  />
                </div>
              </CardContent>
            </>
          )}

          <div className="p-6 pt-0 flex justify-between gap-4">
            {currentStepIndex > 0 ? (
              <Button variant="outline" onClick={handleBack} data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button 
              onClick={handleNext} 
              disabled={!canProceed() || isLoading}
              data-testid="button-next"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : step === "injuries" ? (
                <>
                  Complete Setup
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

import OpenAI from "openai";
import type { PlanData, PlanWeek, PlanDay, PlanExercise, GeneratePlanData } from "@shared/schema";

// Only initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateWorkoutPlan(
  params: GeneratePlanData,
  userProfile?: { fitnessLevel?: string; injuries?: string }
): Promise<{ title: string; description: string; data: PlanData }> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `You are a professional fitness coach. Create a detailed ${params.durationWeeks}-week workout plan with the following requirements:

Goal: ${params.goal}
Fitness Level: ${params.level}
Workouts per Week: ${params.frequencyPerWeek}
Time per Workout: ${params.timePerDay || 45} minutes
Available Equipment: ${params.equipment?.join(", ") || "Bodyweight only"}
${params.injuries ? `Injuries/Limitations to avoid: ${params.injuries}` : ""}
${userProfile?.injuries ? `Additional limitations: ${userProfile.injuries}` : ""}

Create a structured workout plan with the following JSON format:
{
  "title": "Plan title",
  "description": "Brief description of the plan",
  "weeks": [
    {
      "weekNumber": 1,
      "days": [
        {
          "dayNumber": 1,
          "name": "Upper Body Strength",
          "restDay": false,
          "exercises": [
            {
              "name": "Push-ups",
              "sets": 3,
              "reps": "10-12",
              "rest": 60,
              "notes": "Keep core tight"
            }
          ]
        }
      ]
    }
  ]
}

Include rest days appropriately. Ensure progressive overload across weeks. Return ONLY valid JSON, no other text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional fitness coach. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const parsed = JSON.parse(content);

    return {
      title: parsed.title || `${params.goal} Plan`,
      description: parsed.description || `A ${params.durationWeeks}-week ${params.level.toLowerCase()} ${params.goal} program`,
      data: {
        weeks: parsed.weeks || [],
      },
    };
  } catch (error) {
    console.error("OpenAI error:", error);
    throw new Error("Failed to generate workout plan");
  }
}

// Fallback function for when OpenAI is not available
export function generateFallbackPlan(params: GeneratePlanData): { 
  title: string; 
  description: string; 
  data: PlanData 
} {
  const exercises: PlanExercise[] = [
    { name: "Push-ups", sets: 3, reps: "10-12", rest: 60, notes: "Keep core engaged" },
    { name: "Squats", sets: 3, reps: "12-15", rest: 60, notes: "Keep back straight" },
    { name: "Plank", sets: 3, reps: "30-60 sec", rest: 45, notes: "Hold position" },
    { name: "Lunges", sets: 3, reps: "10 each leg", rest: 60, notes: "Step forward" },
    { name: "Mountain Climbers", sets: 3, reps: "20", rest: 45, notes: "Fast pace" },
    { name: "Burpees", sets: 3, reps: "8-10", rest: 90, notes: "Full extension" },
  ];

  const weeks: PlanWeek[] = [];
  
  for (let w = 1; w <= params.durationWeeks; w++) {
    const days: PlanDay[] = [];
    for (let d = 1; d <= 7; d++) {
      if (d <= params.frequencyPerWeek) {
        days.push({
          dayNumber: d,
          name: d % 2 === 1 ? "Full Body Workout A" : "Full Body Workout B",
          exercises: exercises.slice(0, 4 + (w % 2)),
          restDay: false,
        });
      } else {
        days.push({
          dayNumber: d,
          name: "Rest Day",
          exercises: [],
          restDay: true,
        });
      }
    }
    weeks.push({ weekNumber: w, days });
  }

  const goalNames: Record<string, string> = {
    weight_loss: "Fat Burn",
    muscle_gain: "Muscle Builder",
    strength: "Strength Training",
    endurance: "Endurance",
    flexibility: "Flexibility",
    general_fitness: "General Fitness",
  };

  return {
    title: `${goalNames[params.goal] || "Fitness"} ${params.durationWeeks}-Week Plan`,
    description: `A ${params.level.toLowerCase()} ${params.durationWeeks}-week program focusing on ${params.goal.replace("_", " ")}. Train ${params.frequencyPerWeek} days per week.`,
    data: { weeks },
  };
}

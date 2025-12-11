import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, generateToken, requireAuth, requireAdmin, type AuthRequest } from "./auth";
import { generateWorkoutPlan, generateFallbackPlan } from "./openai";
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  insertExerciseSchema,
  insertWorkoutSessionSchema,
  insertProgressSchema,
  generatePlanSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(server: Server, app: Express): Promise<void> {
  // ============ AUTH ROUTES ============

  // Signup
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const data = signupSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: "USER",
      });

      const token = generateToken(user);

      const { password: _, ...safeUser } = user;
      res.status(201).json({ user: safeUser, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await comparePassword(data.password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      await storage.updateUser(user.id, { lastLogin: new Date() } as any);

      const token = generateToken(user);

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // ============ USER ROUTES ============

  // Get current user
  app.get("/api/users/me", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Update current user
  app.put("/api/users/me", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await storage.updateUser(req.user!.id, data as any);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Get user stats
  app.get("/api/users/stats", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // ============ EXERCISE ROUTES ============

  // Get all exercises
  app.get("/api/exercises", async (req: Request, res: Response) => {
    try {
      const exercises = await storage.getExercises();
      res.json(exercises);
    } catch (error) {
      console.error("Get exercises error:", error);
      res.status(500).json({ message: "Failed to get exercises" });
    }
  });

  // Get single exercise
  app.get("/api/exercises/:id", async (req: Request, res: Response) => {
    try {
      const exercise = await storage.getExerciseById(req.params.id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      console.error("Get exercise error:", error);
      res.status(500).json({ message: "Failed to get exercise" });
    }
  });

  // Create exercise (admin only)
  app.post("/api/exercises", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const data = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(data);
      res.status(201).json(exercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Create exercise error:", error);
      res.status(500).json({ message: "Failed to create exercise" });
    }
  });

  // Delete exercise (admin only)
  app.delete("/api/exercises/:id", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      await storage.deleteExercise(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete exercise error:", error);
      res.status(500).json({ message: "Failed to delete exercise" });
    }
  });

  // ============ PLAN ROUTES ============

  // Get user's plans
  app.get("/api/plans", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const plans = await storage.getPlansByUserId(req.user!.id);
      res.json(plans);
    } catch (error) {
      console.error("Get plans error:", error);
      res.status(500).json({ message: "Failed to get plans" });
    }
  });

  // Get active plan
  app.get("/api/plans/active", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const plan = await storage.getActivePlanByUserId(req.user!.id);
      if (!plan) {
        return res.status(404).json({ message: "No active plan" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Get active plan error:", error);
      res.status(500).json({ message: "Failed to get active plan" });
    }
  });

  // Get single plan
  app.get("/api/plans/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const plan = await storage.getPlanById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      if (plan.userId !== req.user!.id && req.user!.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Get plan error:", error);
      res.status(500).json({ message: "Failed to get plan" });
    }
  });

  // Generate AI plan
  app.post("/api/plans/generate", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const params = generatePlanSchema.parse(req.body);
      const user = await storage.getUserById(req.user!.id);

      let planData;
      
      // Try OpenAI first, fall back to template if no API key
      if (process.env.OPENAI_API_KEY) {
        try {
          planData = await generateWorkoutPlan(params, {
            fitnessLevel: user?.fitnessLevel || undefined,
            injuries: user?.injuries || undefined,
          });
        } catch (aiError) {
          console.error("OpenAI generation failed, using fallback:", aiError);
          planData = generateFallbackPlan(params);
        }
      } else {
        planData = generateFallbackPlan(params);
      }

      const plan = await storage.createPlan({
        userId: req.user!.id,
        title: planData.title,
        description: planData.description,
        goal: params.goal,
        level: params.level,
        frequencyPerWeek: params.frequencyPerWeek,
        durationWeeks: params.durationWeeks,
        data: planData.data,
        generatedByAI: !!process.env.OPENAI_API_KEY,
        status: "ACTIVE",
        disclaimer: "This plan is algorithmically generated and not medical advice. Consult a healthcare professional before starting any new exercise program.",
      });

      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      console.error("Generate plan error:", error);
      res.status(500).json({ message: "Failed to generate plan" });
    }
  });

  // Update plan
  app.put("/api/plans/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const plan = await storage.getPlanById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      if (plan.userId !== req.user!.id && req.user!.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updatePlan(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update plan error:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  // Delete plan
  app.delete("/api/plans/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const plan = await storage.getPlanById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      if (plan.userId !== req.user!.id && req.user!.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deletePlan(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete plan error:", error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  // ============ WORKOUT ROUTES ============

  // Get recent workouts
  app.get("/api/workouts/recent", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const workouts = await storage.getRecentWorkouts(req.user!.id, 10);
      res.json(workouts);
    } catch (error) {
      console.error("Get workouts error:", error);
      res.status(500).json({ message: "Failed to get workouts" });
    }
  });

  // Get all workouts
  app.get("/api/workouts", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const workouts = await storage.getWorkoutsByUserId(req.user!.id);
      res.json(workouts);
    } catch (error) {
      console.error("Get workouts error:", error);
      res.status(500).json({ message: "Failed to get workouts" });
    }
  });

  // Create workout
  app.post("/api/workouts", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const workout = await storage.createWorkout({
        userId: req.user!.id,
        planId: req.body.planId || null,
        date: new Date(),
        duration: req.body.duration,
        exercises: req.body.exercises,
        caloriesBurned: req.body.caloriesBurned,
        notes: req.body.notes,
        completed: req.body.completed ?? true,
      });
      res.status(201).json(workout);
    } catch (error) {
      console.error("Create workout error:", error);
      res.status(500).json({ message: "Failed to create workout" });
    }
  });

  // ============ PROGRESS ROUTES ============

  // Get user progress
  app.get("/api/progress", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const progressData = await storage.getProgressByUserId(req.user!.id);
      res.json(progressData);
    } catch (error) {
      console.error("Get progress error:", error);
      res.status(500).json({ message: "Failed to get progress" });
    }
  });

  // Get progress chart data
  app.get("/api/progress/chart", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await storage.getProgressChart(req.user!.id, days);
      res.json(data);
    } catch (error) {
      console.error("Get progress chart error:", error);
      res.status(500).json({ message: "Failed to get chart data" });
    }
  });

  // Create progress entry
  app.post("/api/progress", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const progressEntry = await storage.createProgress({
        userId: req.user!.id,
        date: new Date(),
        weightKg: req.body.weightKg,
        bodyFatPct: req.body.bodyFatPct,
        measurements: req.body.measurements,
        notes: req.body.notes,
        photoUrl: req.body.photoUrl,
      });
      res.status(201).json(progressEntry);
    } catch (error) {
      console.error("Create progress error:", error);
      res.status(500).json({ message: "Failed to create progress entry" });
    }
  });

  // ============ ADMIN ROUTES ============

  // Get admin stats
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // ============ SEED DATA ============
  
  // Seed exercises (run once)
  app.post("/api/seed/exercises", async (req: Request, res: Response) => {
    try {
      const existingExercises = await storage.getExercises();
      if (existingExercises.length > 0) {
        return res.json({ message: "Exercises already seeded", count: existingExercises.length });
      }

      const exercises = [
        { name: "Push-ups", description: "Classic upper body exercise targeting chest, shoulders, and triceps", instructions: "Start in plank position with hands shoulder-width apart. Lower your body until chest nearly touches the floor. Push back up to starting position.", primaryMuscle: "Chest", secondaryMuscles: ["Shoulders", "Triceps"], equipment: "BODYWEIGHT" as const, difficulty: "BEGINNER" as const },
        { name: "Squats", description: "Fundamental lower body exercise for legs and glutes", instructions: "Stand with feet shoulder-width apart. Bend knees and lower hips as if sitting in a chair. Keep chest up and knees over toes. Return to standing.", primaryMuscle: "Legs", secondaryMuscles: ["Glutes", "Core"], equipment: "BODYWEIGHT" as const, difficulty: "BEGINNER" as const },
        { name: "Plank", description: "Core stabilization exercise for abs and back", instructions: "Start in push-up position on forearms. Keep body in straight line from head to heels. Hold position maintaining tight core.", primaryMuscle: "Core", secondaryMuscles: ["Shoulders", "Back"], equipment: "BODYWEIGHT" as const, difficulty: "BEGINNER" as const },
        { name: "Lunges", description: "Single-leg exercise for legs and balance", instructions: "Step forward with one leg. Lower hips until both knees are bent at 90 degrees. Push back to starting position. Alternate legs.", primaryMuscle: "Legs", secondaryMuscles: ["Glutes", "Core"], equipment: "BODYWEIGHT" as const, difficulty: "BEGINNER" as const },
        { name: "Burpees", description: "Full-body explosive exercise for cardio and strength", instructions: "Start standing. Drop to push-up position. Perform push-up. Jump feet to hands. Jump up with arms overhead.", primaryMuscle: "Legs", secondaryMuscles: ["Chest", "Core"], equipment: "BODYWEIGHT" as const, difficulty: "INTERMEDIATE" as const },
        { name: "Mountain Climbers", description: "Dynamic core and cardio exercise", instructions: "Start in plank position. Drive one knee toward chest. Quickly switch legs in running motion. Keep hips level.", primaryMuscle: "Core", secondaryMuscles: ["Shoulders", "Legs"], equipment: "BODYWEIGHT" as const, difficulty: "BEGINNER" as const },
        { name: "Dumbbell Bench Press", description: "Chest building exercise with dumbbells", instructions: "Lie on bench holding dumbbells at chest level. Press weights up until arms are extended. Lower with control.", primaryMuscle: "Chest", secondaryMuscles: ["Shoulders", "Triceps"], equipment: "DUMBBELL" as const, difficulty: "INTERMEDIATE" as const },
        { name: "Dumbbell Rows", description: "Back exercise for lats and upper back", instructions: "Hinge at hips with dumbbell in one hand. Pull dumbbell to hip, squeezing back. Lower with control.", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Core"], equipment: "DUMBBELL" as const, difficulty: "BEGINNER" as const },
        { name: "Dumbbell Shoulder Press", description: "Overhead pressing for shoulder development", instructions: "Hold dumbbells at shoulder height. Press overhead until arms are extended. Lower with control.", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Core"], equipment: "DUMBBELL" as const, difficulty: "BEGINNER" as const },
        { name: "Goblet Squat", description: "Squat variation with dumbbell for added resistance", instructions: "Hold dumbbell at chest level. Squat down keeping chest up. Drive through heels to stand.", primaryMuscle: "Legs", secondaryMuscles: ["Glutes", "Core"], equipment: "DUMBBELL" as const, difficulty: "BEGINNER" as const },
        { name: "Barbell Squat", description: "Compound leg exercise with barbell", instructions: "Position barbell on upper back. Squat down until thighs are parallel. Drive through heels to stand.", primaryMuscle: "Legs", secondaryMuscles: ["Glutes", "Back", "Core"], equipment: "BARBELL" as const, difficulty: "INTERMEDIATE" as const },
        { name: "Barbell Deadlift", description: "Full posterior chain exercise", instructions: "Stand with barbell over mid-foot. Hinge at hips to grip bar. Drive through floor to stand up straight.", primaryMuscle: "Back", secondaryMuscles: ["Legs", "Glutes", "Core"], equipment: "BARBELL" as const, difficulty: "INTERMEDIATE" as const },
        { name: "Pull-ups", description: "Upper body pulling exercise for back and biceps", instructions: "Hang from bar with overhand grip. Pull body up until chin clears bar. Lower with control.", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Shoulders"], equipment: "BODYWEIGHT" as const, difficulty: "INTERMEDIATE" as const },
        { name: "Dips", description: "Triceps and chest exercise on parallel bars", instructions: "Support yourself on parallel bars. Lower body by bending elbows. Press back up to starting position.", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Shoulders"], equipment: "BODYWEIGHT" as const, difficulty: "INTERMEDIATE" as const },
        { name: "Bicycle Crunches", description: "Rotational core exercise for abs and obliques", instructions: "Lie on back with hands behind head. Bring opposite elbow to knee while extending other leg. Alternate sides.", primaryMuscle: "Core", secondaryMuscles: ["Legs"], equipment: "BODYWEIGHT" as const, difficulty: "BEGINNER" as const },
      ];

      for (const exercise of exercises) {
        await storage.createExercise(exercise);
      }

      res.status(201).json({ message: "Exercises seeded successfully", count: exercises.length });
    } catch (error) {
      console.error("Seed exercises error:", error);
      res.status(500).json({ message: "Failed to seed exercises" });
    }
  });
}

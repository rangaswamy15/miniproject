import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["USER", "COACH", "ADMIN"]);
export const equipmentEnum = pgEnum("equipment", ["BODYWEIGHT", "DUMBBELL", "BARBELL", "MACHINE", "KETTLEBELL", "BAND", "CABLE", "NONE"]);
export const levelEnum = pgEnum("level", ["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const planStatusEnum = pgEnum("plan_status", ["CREATING", "ACTIVE", "PAUSED", "COMPLETED"]);
export const uploadTypeEnum = pgEnum("upload_type", ["IMAGE", "VIDEO", "OTHER"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("USER"),
  heightCm: integer("height_cm"),
  weightKg: real("weight_kg"),
  bio: text("bio"),
  goal: text("goal"),
  fitnessLevel: levelEnum("fitness_level"),
  availableEquipment: text("available_equipment").array(),
  injuries: text("injuries"),
  isVerified: boolean("is_verified").notNull().default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Exercises table (library)
export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"),
  primaryMuscle: text("primary_muscle").notNull(),
  secondaryMuscles: text("secondary_muscles").array(),
  equipment: equipmentEnum("equipment").notNull().default("BODYWEIGHT"),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  difficulty: levelEnum("difficulty"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Plans table
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  goal: text("goal").notNull(),
  level: levelEnum("level").notNull(),
  frequencyPerWeek: integer("frequency_per_week").notNull(),
  durationWeeks: integer("duration_weeks").notNull(),
  data: json("data"),
  generatedByAI: boolean("generated_by_ai").notNull().default(false),
  status: planStatusEnum("status").notNull().default("ACTIVE"),
  disclaimer: text("disclaimer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Workout Sessions table
export const workoutSessions = pgTable("workout_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").references(() => plans.id, { onDelete: "set null" }),
  date: timestamp("date").notNull().defaultNow(),
  duration: integer("duration"),
  exercises: json("exercises"),
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Progress table
export const progress = pgTable("progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull().defaultNow(),
  weightKg: real("weight_kg"),
  bodyFatPct: real("body_fat_pct"),
  measurements: json("measurements"),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Uploads table
export const uploads = pgTable("uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  url: text("url").notNull(),
  type: uploadTypeEnum("type").notNull().default("IMAGE"),
  size: integer("size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// AI Jobs table for tracking plan generation
export const aiJobs = pgTable("ai_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").references(() => plans.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  plans: many(plans),
  workoutSessions: many(workoutSessions),
  progress: many(progress),
  uploads: many(uploads),
  aiJobs: many(aiJobs),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  user: one(users, { fields: [plans.userId], references: [users.id] }),
  workoutSessions: many(workoutSessions),
  aiJobs: many(aiJobs),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one }) => ({
  user: one(users, { fields: [workoutSessions.userId], references: [users.id] }),
  plan: one(plans, { fields: [workoutSessions.planId], references: [plans.id] }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, { fields: [progress.userId], references: [users.id] }),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
  user: one(uploads.userId, { fields: [uploads.userId], references: [users.id] }),
}));

export const aiJobsRelations = relations(aiJobs, ({ one }) => ({
  user: one(users, { fields: [aiJobs.userId], references: [users.id] }),
  plan: one(plans, { fields: [aiJobs.planId], references: [plans.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  isVerified: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  createdAt: true,
});

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
  createdAt: true,
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  createdAt: true,
});

export const insertAiJobSchema = createInsertSchema(aiJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type Progress = typeof progress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type AiJob = typeof aiJobs.$inferSelect;
export type InsertAiJob = z.infer<typeof insertAiJobSchema>;

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  bio: z.string().optional(),
  goal: z.string().optional(),
  fitnessLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  availableEquipment: z.array(z.string()).optional(),
  injuries: z.string().optional(),
});

export const generatePlanSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  frequencyPerWeek: z.number().min(1).max(7),
  durationWeeks: z.number().min(1).max(52),
  equipment: z.array(z.string()).optional(),
  timePerDay: z.number().min(15).max(180).optional(),
  injuries: z.string().optional(),
});

// Plan data structure for AI-generated plans
export type PlanExercise = {
  exerciseId?: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
};

export type PlanDay = {
  dayNumber: number;
  name: string;
  exercises: PlanExercise[];
  restDay?: boolean;
};

export type PlanWeek = {
  weekNumber: number;
  days: PlanDay[];
};

export type PlanData = {
  weeks: PlanWeek[];
};

// Workout session exercise data
export type WorkoutExerciseLog = {
  exerciseId?: string;
  name: string;
  sets: {
    setNumber: number;
    targetReps: number;
    actualReps?: number;
    weight?: number;
    completed: boolean;
  }[];
  notes?: string;
};

// Progress measurements
export type ProgressMeasurements = {
  chest?: number;
  waist?: number;
  hips?: number;
  thighs?: number;
  arms?: number;
  shoulders?: number;
};

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type GeneratePlanData = z.infer<typeof generatePlanSchema>;

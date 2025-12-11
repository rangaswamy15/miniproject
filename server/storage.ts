import { db } from "./db";
import { eq, desc, and, sql, gte, lte, count } from "drizzle-orm";
import {
  users,
  exercises,
  plans,
  workoutSessions,
  progress,
  uploads,
  aiJobs,
  type User,
  type InsertUser,
  type Exercise,
  type InsertExercise,
  type Plan,
  type InsertPlan,
  type WorkoutSession,
  type InsertWorkoutSession,
  type Progress,
  type InsertProgress,
  type Upload,
  type InsertUpload,
  type AiJob,
  type InsertAiJob,
} from "@shared/schema";
import { subDays, startOfWeek, endOfWeek } from "date-fns";

export interface IStorage {
  // Users
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Exercises
  getExercises(): Promise<Exercise[]>;
  getExerciseById(id: string): Promise<Exercise | undefined>;
  createExercise(data: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, data: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: string): Promise<void>;

  // Plans
  getPlansByUserId(userId: string): Promise<Plan[]>;
  getPlanById(id: string): Promise<Plan | undefined>;
  getActivePlanByUserId(userId: string): Promise<Plan | undefined>;
  createPlan(data: InsertPlan): Promise<Plan>;
  updatePlan(id: string, data: Partial<InsertPlan>): Promise<Plan | undefined>;
  deletePlan(id: string): Promise<void>;

  // Workouts
  getWorkoutsByUserId(userId: string): Promise<WorkoutSession[]>;
  getRecentWorkouts(userId: string, limit: number): Promise<WorkoutSession[]>;
  createWorkout(data: InsertWorkoutSession): Promise<WorkoutSession>;
  getWorkoutsThisWeek(userId: string): Promise<number>;

  // Progress
  getProgressByUserId(userId: string): Promise<Progress[]>;
  createProgress(data: InsertProgress): Promise<Progress>;
  getProgressChart(userId: string, days: number): Promise<{ date: string; weight: number }[]>;

  // Uploads
  createUpload(data: InsertUpload): Promise<Upload>;
  getUploadsByUserId(userId: string): Promise<Upload[]>;

  // AI Jobs
  createAiJob(data: InsertAiJob): Promise<AiJob>;
  updateAiJob(id: string, data: Partial<AiJob>): Promise<AiJob | undefined>;
  getAiJobById(id: string): Promise<AiJob | undefined>;

  // Stats
  getUserStats(userId: string): Promise<{
    totalWorkouts: number;
    thisWeek: number;
    streak: number;
    caloriesBurned: number;
  }>;
  getAdminStats(): Promise<{
    totalUsers: number;
    totalPlans: number;
    totalWorkouts: number;
    averageWorkoutsPerWeek: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Exercises
  async getExercises(): Promise<Exercise[]> {
    return db.select().from(exercises).orderBy(exercises.name);
  }

  async getExerciseById(id: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async createExercise(data: InsertExercise): Promise<Exercise> {
    const [exercise] = await db.insert(exercises).values(data).returning();
    return exercise;
  }

  async updateExercise(id: string, data: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const [exercise] = await db
      .update(exercises)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(exercises.id, id))
      .returning();
    return exercise;
  }

  async deleteExercise(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  // Plans
  async getPlansByUserId(userId: string): Promise<Plan[]> {
    return db
      .select()
      .from(plans)
      .where(eq(plans.userId, userId))
      .orderBy(desc(plans.createdAt));
  }

  async getPlanById(id: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async getActivePlanByUserId(userId: string): Promise<Plan | undefined> {
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.userId, userId), eq(plans.status, "ACTIVE")))
      .orderBy(desc(plans.createdAt))
      .limit(1);
    return plan;
  }

  async createPlan(data: InsertPlan): Promise<Plan> {
    const [plan] = await db.insert(plans).values(data).returning();
    return plan;
  }

  async updatePlan(id: string, data: Partial<InsertPlan>): Promise<Plan | undefined> {
    const [plan] = await db
      .update(plans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return plan;
  }

  async deletePlan(id: string): Promise<void> {
    await db.delete(plans).where(eq(plans.id, id));
  }

  // Workouts
  async getWorkoutsByUserId(userId: string): Promise<WorkoutSession[]> {
    return db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.date));
  }

  async getRecentWorkouts(userId: string, limit: number): Promise<WorkoutSession[]> {
    return db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.date))
      .limit(limit);
  }

  async createWorkout(data: InsertWorkoutSession): Promise<WorkoutSession> {
    const [workout] = await db.insert(workoutSessions).values(data).returning();
    return workout;
  }

  async getWorkoutsThisWeek(userId: string): Promise<number> {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const result = await db
      .select({ count: count() })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.date, weekStart),
          lte(workoutSessions.date, weekEnd)
        )
      );

    return result[0]?.count || 0;
  }

  // Progress
  async getProgressByUserId(userId: string): Promise<Progress[]> {
    return db
      .select()
      .from(progress)
      .where(eq(progress.userId, userId))
      .orderBy(desc(progress.date));
  }

  async createProgress(data: InsertProgress): Promise<Progress> {
    const [entry] = await db.insert(progress).values(data).returning();
    return entry;
  }

  async getProgressChart(userId: string, days: number): Promise<{ date: string; weight: number }[]> {
    const startDate = subDays(new Date(), days);

    const entries = await db
      .select({ date: progress.date, weight: progress.weightKg })
      .from(progress)
      .where(and(eq(progress.userId, userId), gte(progress.date, startDate)))
      .orderBy(progress.date);

    return entries
      .filter((e) => e.weight !== null)
      .map((e) => ({
        date: e.date.toISOString(),
        weight: e.weight as number,
      }));
  }

  // Uploads
  async createUpload(data: InsertUpload): Promise<Upload> {
    const [upload] = await db.insert(uploads).values(data).returning();
    return upload;
  }

  async getUploadsByUserId(userId: string): Promise<Upload[]> {
    return db
      .select()
      .from(uploads)
      .where(eq(uploads.userId, userId))
      .orderBy(desc(uploads.createdAt));
  }

  // AI Jobs
  async createAiJob(data: InsertAiJob): Promise<AiJob> {
    const [job] = await db.insert(aiJobs).values(data).returning();
    return job;
  }

  async updateAiJob(id: string, data: Partial<AiJob>): Promise<AiJob | undefined> {
    const [job] = await db
      .update(aiJobs)
      .set(data)
      .where(eq(aiJobs.id, id))
      .returning();
    return job;
  }

  async getAiJobById(id: string): Promise<AiJob | undefined> {
    const [job] = await db.select().from(aiJobs).where(eq(aiJobs.id, id));
    return job;
  }

  // Stats
  async getUserStats(userId: string): Promise<{
    totalWorkouts: number;
    thisWeek: number;
    streak: number;
    caloriesBurned: number;
  }> {
    const totalResult = await db
      .select({ count: count() })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId));

    const thisWeek = await this.getWorkoutsThisWeek(userId);

    const caloriesResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${workoutSessions.caloriesBurned}), 0)` })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId));

    return {
      totalWorkouts: totalResult[0]?.count || 0,
      thisWeek,
      streak: 0,
      caloriesBurned: caloriesResult[0]?.total || 0,
    };
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalPlans: number;
    totalWorkouts: number;
    averageWorkoutsPerWeek: number;
  }> {
    const usersResult = await db.select({ count: count() }).from(users);
    const plansResult = await db.select({ count: count() }).from(plans);
    const workoutsResult = await db.select({ count: count() }).from(workoutSessions);

    return {
      totalUsers: usersResult[0]?.count || 0,
      totalPlans: plansResult[0]?.count || 0,
      totalWorkouts: workoutsResult[0]?.count || 0,
      averageWorkoutsPerWeek: 0,
    };
  }
}

export const storage = new DatabaseStorage();

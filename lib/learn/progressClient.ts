"use client";

/**
 * Client-side read/write for a signed-in employee's own learning progress.
 * RLS lets a user touch only their own rows (auth.uid() = user_id), so these
 * run safely from the browser with the public anon key.
 */
import { supabase } from "@/lib/supabase";
import type { ModuleProgress } from "./quiz";

export type ProgressByModule = Record<string, ModuleProgress>;

type Row = {
  module_slug: string;
  lessons_completed: string[] | null;
  quiz_best_score: number | null;
  quiz_attempts: number | null;
  quiz_passed: boolean | null;
};

/** All of this user's progress rows, keyed by module_slug. */
export async function fetchMyProgress(userId: string): Promise<ProgressByModule> {
  const { data, error } = await supabase
    .from("mtm_employee_progress")
    .select("module_slug, lessons_completed, quiz_best_score, quiz_attempts, quiz_passed")
    .eq("user_id", userId);
  if (error || !data) return {};
  const out: ProgressByModule = {};
  for (const r of data as Row[]) {
    out[r.module_slug] = {
      lessons_completed: r.lessons_completed ?? [],
      quiz_best_score: r.quiz_best_score,
      quiz_attempts: r.quiz_attempts ?? 0,
      quiz_passed: !!r.quiz_passed,
    };
  }
  return out;
}

/** This user's row for a single module, or null if not started. */
export async function fetchModuleProgress(userId: string, moduleSlug: string): Promise<ModuleProgress | null> {
  const { data, error } = await supabase
    .from("mtm_employee_progress")
    .select("module_slug, lessons_completed, quiz_best_score, quiz_attempts, quiz_passed")
    .eq("user_id", userId)
    .eq("module_slug", moduleSlug)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Row;
  return {
    lessons_completed: r.lessons_completed ?? [],
    quiz_best_score: r.quiz_best_score,
    quiz_attempts: r.quiz_attempts ?? 0,
    quiz_passed: !!r.quiz_passed,
  };
}

/**
 * Upsert this user's progress for one module. Pass the full intended state for
 * the changed fields; caller is responsible for having already merged in the
 * best score and the union of completed lessons.
 */
export async function saveProgress(params: {
  userId: string;
  email: string;
  moduleSlug: string;
  lessonsCompleted: string[];
  quizBestScore: number | null;
  quizAttempts: number;
  quizPassed: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("mtm_employee_progress").upsert(
    {
      user_id: params.userId,
      email: params.email,
      module_slug: params.moduleSlug,
      lessons_completed: params.lessonsCompleted,
      quiz_best_score: params.quizBestScore,
      quiz_attempts: params.quizAttempts,
      quiz_passed: params.quizPassed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,module_slug" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

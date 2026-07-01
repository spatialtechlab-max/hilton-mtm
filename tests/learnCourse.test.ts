import { describe, expect, test } from "vitest";
import { course, modules, moduleBySlug, totalLessons, type Module } from "@/lib/learn/course";

/**
 * Course content integrity. The course is authored by hand, so these guard
 * against the easy human slips: a duplicate slug, an out-of-range answer
 * index, an empty slide, or a stray em-dash (an AI tell the client rejects).
 */

describe("course shape", () => {
  test("has a slug, title, and intro", () => {
    expect(course.slug).toBeTruthy();
    expect(course.title).toBe("The Hilton Way");
    expect(course.intro.length).toBeGreaterThan(20);
  });
  test("has seven modules", () => {
    expect(course.modules).toHaveLength(7);
  });
  test("module orders are 1..7 with no gaps", () => {
    expect(modules.map((m) => m.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  test("modules export is sorted by order", () => {
    const orders = modules.map((m) => m.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

describe("slugs", () => {
  test("every module has a non-empty slug", () => {
    for (const m of course.modules) expect(m.slug.trim().length).toBeGreaterThan(0);
  });
  test("module slugs are unique", () => {
    const slugs = course.modules.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  test("lesson slugs are unique within each module", () => {
    for (const m of course.modules) {
      const slugs = m.lessons.map((l) => l.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
  test("expected module slugs are present", () => {
    const slugs = course.modules.map((m) => m.slug);
    expect(slugs).toEqual([
      "the-hilton-standard",
      "understanding-the-craft",
      "the-client-experience",
      "the-cloth",
      "style-options",
      "reading-the-body",
      "the-fitting-process",
    ]);
  });
  test("moduleBySlug resolves and rejects", () => {
    expect(moduleBySlug("the-cloth")?.order).toBe(4);
    expect(moduleBySlug("nope")).toBeUndefined();
  });
});

describe("lessons and slides", () => {
  test.each(course.modules)("$slug: every lesson has slides with real text", (m: Module) => {
    expect(m.lessons.length).toBeGreaterThan(0);
    for (const l of m.lessons) {
      expect(l.title.trim().length).toBeGreaterThan(0);
      expect(l.slides.length).toBeGreaterThan(0);
      for (const s of l.slides) {
        expect(s.heading.trim().length).toBeGreaterThan(0);
        expect(s.body.trim().length).toBeGreaterThan(20);
      }
    }
  });
  test("module 1 is the showcase: 6 to 8 slides total", () => {
    const m1 = moduleBySlug("the-hilton-standard")!;
    const slides = m1.lessons.reduce((n, l) => n + l.slides.length, 0);
    expect(slides).toBeGreaterThanOrEqual(6);
    expect(slides).toBeLessThanOrEqual(8);
  });
  test("modules 2 to 7 each have 3 to 5 lessons", () => {
    for (const m of course.modules.filter((x) => x.order >= 2)) {
      expect(m.lessons.length).toBeGreaterThanOrEqual(3);
      expect(m.lessons.length).toBeLessThanOrEqual(5);
    }
  });
  test("totalLessons matches the sum across modules", () => {
    const sum = course.modules.reduce((n, m) => n + m.lessons.length, 0);
    expect(totalLessons()).toBe(sum);
  });
});

describe("quizzes", () => {
  test("every quiz passes at 80%", () => {
    for (const m of course.modules) expect(m.quiz.passPct).toBe(80);
  });
  test("module 1 has 5 questions; modules 2 to 7 have 3 each", () => {
    expect(moduleBySlug("the-hilton-standard")!.quiz.questions.length).toBe(5);
    for (const m of course.modules.filter((x) => x.order >= 2)) {
      expect(m.quiz.questions.length).toBe(3);
    }
  });
  test("every question has >= 2 options, a valid answer index, and feedback", () => {
    for (const m of course.modules) {
      for (const q of m.quiz.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(q.q.trim().length).toBeGreaterThan(0);
        expect(q.feedback.trim().length).toBeGreaterThan(0);
        // No duplicate option text within a question.
        expect(new Set(q.options).size).toBe(q.options.length);
      }
    }
  });
});

describe("house style: no em-dashes anywhere", () => {
  test("no em-dash or en-dash in any authored text", () => {
    const offenders: string[] = [];
    const check = (label: string, text: string) => {
      if (/[—–]/.test(text)) offenders.push(label);
    };
    check("intro", course.intro);
    for (const m of course.modules) {
      check(`module:${m.slug}:title`, m.title);
      check(`module:${m.slug}:summary`, m.summary);
      for (const l of m.lessons) {
        check(`lesson:${l.slug}:title`, l.title);
        for (const s of l.slides) {
          check(`slide:${s.heading}`, s.heading);
          check(`slide-body:${s.heading}`, s.body);
        }
      }
      for (const q of m.quiz.questions) {
        check(`q:${m.slug}`, q.q);
        check(`feedback:${m.slug}`, q.feedback);
        for (const o of q.options) check(`opt:${m.slug}`, o);
      }
    }
    expect(offenders).toEqual([]);
  });
});

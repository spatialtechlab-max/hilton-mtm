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
  test("has nine modules", () => {
    expect(course.modules).toHaveLength(9);
  });
  test("module orders are 1..9 with no gaps", () => {
    expect(modules.map((m) => m.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
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
  test("expected module slugs are present, in order", () => {
    const slugs = modules.map((m) => m.slug);
    expect(slugs).toEqual([
      "the-hilton-standard",
      "understanding-the-craft",
      "the-client-experience",
      "the-cloth",
      "fabric-mastery-climate",
      "silhouette-structure-fit",
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
  test("every non-showcase module (order >= 2) has 3 to 6 lessons", () => {
    for (const m of course.modules.filter((x) => x.order >= 2)) {
      expect(m.lessons.length).toBeGreaterThanOrEqual(3);
      expect(m.lessons.length).toBeLessThanOrEqual(6);
    }
  });
  test("totalLessons matches the sum across modules", () => {
    const sum = course.modules.reduce((n, m) => n + m.lessons.length, 0);
    expect(totalLessons()).toBe(sum);
  });
});

// Quizzes now live in lib/learn/examBank.ts and are validated in tests/exam.test.ts.
// course.ts holds teaching content only.

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
    }
    expect(offenders).toEqual([]);
  });
});

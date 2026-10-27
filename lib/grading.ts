/** NUC 5-point grading scale used by Nigerian federal universities. */
export function gradeFor(score: number): { grade: string; point: number } {
  if (score >= 70) return { grade: "A", point: 5 };
  if (score >= 60) return { grade: "B", point: 4 };
  if (score >= 50) return { grade: "C", point: 3 };
  if (score >= 45) return { grade: "D", point: 2 };
  if (score >= 40) return { grade: "E", point: 1 };
  return { grade: "F", point: 0 };
}

export function gpa(courses: { units: number; point: number }[]): number {
  const units = courses.reduce((s, c) => s + c.units, 0);
  if (!units) return 0;
  const points = courses.reduce((s, c) => s + c.units * c.point, 0);
  return Math.round((points / units) * 100) / 100;
}

export function classOfDegree(cgpa: number): string {
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  if (cgpa >= 1.0) return "Pass";
  return "—";
}

export const GRADE_SCALE = [
  { grade: "A", range: "70–100", point: 5 },
  { grade: "B", range: "60–69", point: 4 },
  { grade: "C", range: "50–59", point: 3 },
  { grade: "D", range: "45–49", point: 2 },
  { grade: "E", range: "40–44", point: 1 },
  { grade: "F", range: "0–39", point: 0 },
];

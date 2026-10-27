"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getStudent } from "@/lib/api";
import type { Student } from "@/lib/types";

type Ctx = { student: Student | null; refresh: () => Promise<void>; setStudent: (s: Student) => void };

const StudentContext = createContext<Ctx>({ student: null, refresh: async () => {}, setStudent: () => {} });

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const refresh = useCallback(async () => {
    try {
      setStudent(await getStudent());
    } catch {
      /* the shell still renders; pages show their own errors */
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return <StudentContext.Provider value={{ student, refresh, setStudent }}>{children}</StudentContext.Provider>;
}

export const useStudent = () => useContext(StudentContext);

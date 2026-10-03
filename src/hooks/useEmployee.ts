import { useEffect, useState } from "react";
import { useAppSelector } from "./useRedux";
import { employeeService } from "@/services/employee.service";
import type { Employee } from "@/types";

export function useEmployee() {
  const { user } = useAppSelector((s) => s.auth);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsLoading(false);
      return;
    }
    employeeService
      .getByEmployeeId(user.employeeId)
      .then((emp) => {
        if (active) setEmployee(emp);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  return { employee, isLoading };
}
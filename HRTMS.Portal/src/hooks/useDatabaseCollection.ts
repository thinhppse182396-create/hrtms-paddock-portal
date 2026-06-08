import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function useDatabaseCollection<T>(
  _key: string,
  source: T[],
): [T[], Dispatch<SetStateAction<T[]>>, boolean] {
  const [rows, setRows] = useState<T[]>(() => [...source]);

  useEffect(() => {
    const reload = () => setRows([...source]);
    window.addEventListener("hrtms:database-data", reload);
    return () => window.removeEventListener("hrtms:database-data", reload);
  }, [source]);

  return [rows, setRows, false];
}

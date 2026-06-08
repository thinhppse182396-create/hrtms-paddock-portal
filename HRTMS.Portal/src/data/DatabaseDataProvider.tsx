import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/common/Button";
import { loadDatabaseData } from "./databaseData";

export function DatabaseDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await loadDatabaseData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Cannot load database data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener("hrtms:database-changed", load);
    return () => window.removeEventListener("hrtms:database-changed", load);
  }, [load]);

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-danger/30 bg-card p-6 text-center">
          <h1 className="font-semibold text-foreground">Cannot load database</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => void load()}>Retry</Button>
        </div>
      </div>
    );
  }

  return children;
}

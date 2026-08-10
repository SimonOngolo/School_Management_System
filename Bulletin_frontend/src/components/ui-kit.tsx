import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label, value, icon, trend, accent = "primary",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  } as const;

  return (
    <Card className="border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
          </div>
          <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PageHeader({
  title, description, actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

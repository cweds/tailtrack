import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ActionCardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ActionCard({ title, children, actions, className = "" }: ActionCardProps) {
  return (
    <Card className={className}>
      <CardHeader className={actions ? "pb-3" : undefined}>
        <div className="flex justify-between items-start">
          <CardTitle>{title}</CardTitle>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
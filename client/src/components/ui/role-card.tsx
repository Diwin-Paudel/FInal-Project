import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type RoleCardProps = {
  role: "customer" | "owner" | "admin" | "partner";
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
};

export default function RoleCard({ role, title, description, icon, onClick }: RoleCardProps) {
  const getBgColor = (role: string) => {
    switch (role) {
      case "customer": return "bg-[hsl(var(--customer))]";
      case "owner": return "bg-[hsl(var(--owner))]";
      case "admin": return "bg-[hsl(var(--admin))]";
      case "partner": return "bg-[hsl(var(--partner))]";
      default: return "bg-primary";
    }
  };

  const getBorderColor = (role: string) => {
    switch (role) {
      case "customer": return "hover:border-[hsl(var(--customer))]";
      case "owner": return "hover:border-[hsl(var(--owner))]";
      case "admin": return "hover:border-[hsl(var(--admin))]";
      case "partner": return "hover:border-[hsl(var(--partner))]";
      default: return "hover:border-primary";
    }
  };
  
  return (
    <Button
      variant="outline"
      className={cn(
        "w-full rounded-lg py-3 px-4 flex items-center text-left h-auto justify-start transition-all border-2 border-transparent",
        getBorderColor(role)
      )}
      onClick={onClick}
    >
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white mr-4", getBgColor(role))}>
        <span className="material-icons">{icon}</span>
      </div>
      <div>
        <h3 className="font-heading font-medium text-lg">{title}</h3>
        <p className="text-sm text-neutral-medium">{description}</p>
      </div>
    </Button>
  );
}

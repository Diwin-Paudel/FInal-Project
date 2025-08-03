import { Button } from "@/components/ui/button";

type CategoryCardProps = {
  icon: string;
  title: string;
  onClick?: () => void;
};

export default function CategoryCard({ icon, title, onClick }: CategoryCardProps) {
  return (
    <Button
      variant="outline"
      className="bg-white rounded-lg p-3 text-center shadow-sm h-auto flex flex-col items-center justify-center hover:bg-neutral-50"
      onClick={onClick}
    >
      <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-2">
        <span className="material-icons text-primary">{icon}</span>
      </div>
      <p className="text-sm font-medium">{title}</p>
    </Button>
  );
}

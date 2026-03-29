import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <Card className="border-white/10 bg-white/5 backdrop-blur-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-10 text-sm">
            Placeholder page for the {title.toLowerCase()} admin section.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

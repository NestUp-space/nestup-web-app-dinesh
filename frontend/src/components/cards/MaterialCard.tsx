import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MaterialCardProps {
  title: string;
  imageUrl: string;
  specs: Record<string, string>;
}

export const MaterialCard = ({ title, imageUrl, specs }: MaterialCardProps) => {
  return (
    <Card className="overflow-hidden rounded-dls-lg shadow-md">
      <img src={imageUrl} alt={title} className="w-full h-40 object-cover" />
      <CardHeader>
        <CardTitle className="text-primary-blue text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="font-mono text-sm text-technical-gray list-disc pl-5 space-y-1">
          {Object.entries(specs).map(([key, value]) => (
            <li key={key}>
              <span className="font-semibold">{key}:</span> {value}
            </li>
          ))}
        </ul>
        <div className="pt-4">
          <Button variant="secondary" className="w-full">
            Download Spec Sheet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

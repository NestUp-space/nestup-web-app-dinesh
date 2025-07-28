import { Card, CardContent } from "@/components/ui/card";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
}

export const TestimonialCard = ({ quote, author, role }: TestimonialCardProps) => {
  return (
    <Card className="bg-neutral-light border-l-4 border-primary-orange rounded-dls-md p-6">
      <CardContent className="p-0">
        <p className="font-body italic text-lg text-neutral-dark">"{quote}"</p>
        <div className="mt-4 text-right">
          <p className="font-sans font-bold text-primary-blue">{author}</p>
          <p className="font-body text-sm text-technical-gray">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
};

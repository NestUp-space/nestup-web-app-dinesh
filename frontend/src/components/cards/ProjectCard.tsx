import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface ProjectCardProps {
  title: string;
  imageUrl: string;
  description: string;
}

export const ProjectCard = ({ title, imageUrl, description }: ProjectCardProps) => {
  return (
    <Card className="overflow-hidden rounded-dls-lg shadow-md transition-transform hover:-translate-y-1">
      <div className="relative w-full h-48">
        <Image src={imageUrl} alt={title} layout="fill" objectFit="cover" />
      </div>
      <CardHeader>
        <CardTitle className="text-primary-blue">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-body text-technical-gray">{description}</p>
      </CardContent>
    </Card>
  );
};

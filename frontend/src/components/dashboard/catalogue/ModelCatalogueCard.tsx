"use client";

import React from 'react';
import Link from 'next/link';
import Image from "next/legacy/image";
import { Edit, Eye } from 'lucide-react';
// Button component might be needed if the Link's child button is to be styled with project's Button
// import { Button } from '@/components/dashboard/button'; 

export interface ListedModelData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

interface ModelCatalogueCardProps {
  model: ListedModelData;
}

const ModelCatalogueCard: React.FC<ModelCatalogueCardProps> = ({ model }) => {
  let correctedImageUrl = model.imageUrl;
  if (model.imageUrl && !model.imageUrl.startsWith('http') && !model.imageUrl.startsWith('/')) {
    correctedImageUrl = `/${model.imageUrl}`;
  }

  return (
    <div key={model.id} className="bg-white rounded-lg border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="relative w-full h-48 bg-gray-200">
        {correctedImageUrl ? (
          <Image src={correctedImageUrl} alt={model.name} layout="fill" objectFit="cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Eye className="w-12 h-12" /> {/* Placeholder Icon */}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-1 truncate" title={model.name}>{model.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 flex-grow line-clamp-3">
          {model.description || 'No description available.'}
        </p>
        <Link href={`/dashboard/catalogue/${model.id}/edit`} passHref>
          {/* Using a simple button here, can be replaced with project's Button component if needed */}
          <button className="mt-auto w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
            <Edit className="mr-2 h-4 w-4" />
            Edit Model
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ModelCatalogueCard;

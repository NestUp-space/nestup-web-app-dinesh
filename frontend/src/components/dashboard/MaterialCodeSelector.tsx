import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface Material {
  id: number;
  materialId: string;
  plyType: string;
  plyThickness: number;
  innerLaminateCode?: string;
  outerLaminateCode?: string;
  grainDirection?: string;
}

interface MaterialCodeSelectorProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  projectId?: string | number;
}

const MaterialCodeSelector: React.FC<MaterialCodeSelectorProps> = ({
  name,
  label,
  value,
  onChange,
  projectId,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch materials for the project
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        // Mock materials if no projectId is provided
        if (!projectId) {
          setMaterials([
            { id: 1, materialId: 'M001', plyType: 'HDHMR', plyThickness: 18, grainDirection: 'Y' },
            { id: 2, materialId: 'M002', plyType: 'MDF', plyThickness: 12, grainDirection: 'N' },
            { id: 3, materialId: 'M003', plyType: 'Plywood', plyThickness: 19, grainDirection: 'Y' }
          ]);
          setLoading(false);
          return;
        }
        
        const response = await apiClient.get(`/api/projects/${projectId}/materials`);
        setMaterials(response.data || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch materials'));
        
        // Fallback to mock materials on error
        setMaterials([
          { id: 1, materialId: 'M001', plyType: 'HDHMR', plyThickness: 18, grainDirection: 'Y' },
          { id: 2, materialId: 'M002', plyType: 'MDF', plyThickness: 12, grainDirection: 'N' },
          { id: 3, materialId: 'M003', plyType: 'Plywood', plyThickness: 19, grainDirection: 'Y' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, [projectId]);
  
  // If no value is selected and materials are available, select the first one
  useEffect(() => {
    if (!value && materials && materials.length > 0) {
      onChange(materials[0].materialId);
    }
  }, [materials, value, onChange]);
  
  if (loading) return <p>Loading materials...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <option value="">Select a material</option>
        {materials?.map((material) => (
          <option key={material.materialId} value={material.materialId}>
            {material.materialId} - {material.plyType} ({material.plyThickness}mm)
          </option>
        ))}
      </select>
    </div>
  );
};

export default MaterialCodeSelector;

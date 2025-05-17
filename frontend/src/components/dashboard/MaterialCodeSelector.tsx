import React, { useEffect } from 'react';
import { useProjectMaterials, Material } from '@/hooks/useMaterial'; // Import hook and Material type

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
  // Use the hook to fetch materials, ensuring projectId is null if undefined
  const { materials, loading, error, refetch } = useProjectMaterials(projectId ?? null);

  // If no value is selected and materials are available, select the first one
  // This also handles sorting if the hook provides sorted data or if we sort here.
  // The useProjectMaterials hook doesn't explicitly sort, so we should sort here.
  const sortedMaterials = React.useMemo(() => {
    if (!materials) return [];
    return [...materials].sort((a, b) => a.materialId.localeCompare(b.materialId));
  }, [materials]);
  
  useEffect(() => {
    if (!value && sortedMaterials && sortedMaterials.length > 0) {
      onChange(sortedMaterials[0].materialId);
    }
  }, [sortedMaterials, value, onChange]);
  
  if (loading) return <p>Loading materials...</p>;
  // Ensure error is an instance of Error before accessing message
  if (error) return <p>Error: {error instanceof Error ? error.message : 'Failed to load materials'}</p>;

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
        {sortedMaterials.length === 0 ? (
          <option value="">No materials added - Please add materials to the project first</option>
        ) : (
          <>
            <option value="">Select a material</option>
            {sortedMaterials.map((material) => (
              <option key={material.id} value={material.materialId}> {/* Use material.id for key if unique */}
                {material.materialId} - {material.plyType} ({material.plyThickness}mm)
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
};

export default MaterialCodeSelector;

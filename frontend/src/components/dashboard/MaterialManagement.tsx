"use client";

import React, { useState, useEffect } from 'react';
import { useProjectMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, Material, CreateMaterialData } from '@/hooks';
import { Button } from '@/components/dashboard/button';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { PLY_THICKNESS_VALUES } from '@/constants/materialConstants';

interface MaterialManagementProps {
  projectId: number;
}

const defaultThickness = PLY_THICKNESS_VALUES[0];

const MaterialManagement: React.FC<MaterialManagementProps> = ({ projectId }) => {
  const { materials, loading: materialsLoading, refetch: refetchMaterials } = useProjectMaterials(projectId);
  const { createMaterial, loading: createLoading } = useCreateMaterial(projectId);
  const { updateMaterial: executeUpdateMaterial, loading: updateLoading } = useUpdateMaterial();
  const { deleteMaterial, loading: deleteLoading } = useDeleteMaterial();
  
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateMaterialData>({
    materialId: '',
    plyThickness: defaultThickness,
    innerLaminateCode: '',
    outerLaminateCode: '',
    plyType: 'HDHMR',
    grainDirection: 'Y'
  });

  // Reset form when adding new material
  useEffect(() => {
    if (isAddingMaterial) {
      setFormData({
        materialId: '',
        plyThickness: defaultThickness,
        innerLaminateCode: '',
        outerLaminateCode: '',
        plyType: 'HDHMR',
        grainDirection: 'Y'
      });
    }
  }, [isAddingMaterial]);

  // Set form data when editing a material
  useEffect(() => {
    if (editingMaterialId !== null) {
      const materialToEdit = materials.find(m => m.id === editingMaterialId);
      if (materialToEdit) {
        // Find the closest valid thickness value or default to the first one
        const closestThickness = PLY_THICKNESS_VALUES.find(t => t === materialToEdit.plyThickness) || defaultThickness;
        
        setFormData({
          materialId: materialToEdit.materialId,
          plyThickness: closestThickness,
          innerLaminateCode: materialToEdit.innerLaminateCode,
          outerLaminateCode: materialToEdit.outerLaminateCode,
          plyType: materialToEdit.plyType,
          grainDirection: materialToEdit.grainDirection || 'Y'
        });
      }
    }
  }, [editingMaterialId, materials]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'plyThickness') {
      const numberValue = parseFloat(value);
      // Verify that the value is one of our valid thickness options
      const thickness = PLY_THICKNESS_VALUES.find(t => t === numberValue) || defaultThickness;
      setFormData(prev => ({ ...prev, plyThickness: thickness }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[MaterialManagement] Form submitted. Editing ID:', editingMaterialId, 'Form Data:', formData);
    
    try {
      if (editingMaterialId !== null) {
        console.log('[MaterialManagement] Attempting to update material ID:', editingMaterialId);
        await executeUpdateMaterial(editingMaterialId, formData);
        console.log('[MaterialManagement] Material update successful for ID:', editingMaterialId);
        setEditingMaterialId(null);
      } else {
        console.log('[MaterialManagement] Attempting to create new material.');
        const newMaterial = await createMaterial(formData);
        console.log('[MaterialManagement] Material creation successful. New material:', newMaterial);
        setIsAddingMaterial(false);
      }
      console.log('[MaterialManagement] Refetching materials after save.');
      await refetchMaterials();
      console.log('[MaterialManagement] Materials refetched.');
    } catch (error) {
      console.error('[MaterialManagement] Error saving material:', error);
      // Check if error is an instance of Error and has a message property
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      alert(`Failed to save material: ${errorMessage}. Please check console for details.`);
    }
  };

  const handleDelete = async (materialId: number) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      console.log('[MaterialManagement] Attempting to delete material ID:', materialId);
      try {
        await deleteMaterial(materialId);
        console.log('[MaterialManagement] Material deletion successful for ID:', materialId);
        console.log('[MaterialManagement] Refetching materials after delete.');
        refetchMaterials();
        console.log('[MaterialManagement] Materials refetched after delete.');
      } catch (error) {
        console.error('[MaterialManagement] Error deleting material:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        alert(`Failed to delete material: ${errorMessage}. Please check console for details.`);
      }
    }
  };

  const calculateOverallThickness = (plyThickness: number): number => {
    return plyThickness + 2; // Assuming inner and outer laminates are 1mm each
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Material Management</h2>
        {!isAddingMaterial && !editingMaterialId && (
          <Button onClick={() => setIsAddingMaterial(true)} size="sm">
            <Plus size={16} className="mr-1" /> Add Material
          </Button>
        )}
      </div>
      
      {materialsLoading ? (
        <p className="text-gray-500">Loading materials...</p>
      ) : (
        <>
          {/* Material Form */}
          {(isAddingMaterial || editingMaterialId !== null) && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
              <h3 className="text-lg font-medium mb-3">
                {editingMaterialId !== null ? 'Edit Material' : 'Add New Material'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material ID
                  </label>
                  <input
                    type="text"
                    name="materialId"
                    value={formData.materialId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="e.g., M001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ply Thickness (mm)
                  </label>
                  <select
                    name="plyThickness"
                    value={formData.plyThickness}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    {PLY_THICKNESS_VALUES.map(thickness => (
                      <option key={thickness} value={thickness}>{thickness}mm</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inner Material
                  </label>
                  <input
                    type="text"
                    name="innerLaminateCode"
                    value={formData.innerLaminateCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Enter inner material code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outer Material
                  </label>
                  <input
                    type="text"
                    name="outerLaminateCode"
                    value={formData.outerLaminateCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Enter outer material code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ply Type
                  </label>
                  <select
                    name="plyType"
                    value={formData.plyType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="HDHMR">HDHMR</option>
                    <option value="Blockboard">Blockboard</option>
                    <option value="MDF">MDF</option>
                    <option value="Plywood">Plywood</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grain Direction
                  </label>
                  <select
                    name="grainDirection"
                    value={formData.grainDirection}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Thickness (mm)
                  </label>
                  <input
                    type="text"
                    value={calculateOverallThickness(formData.plyThickness)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md shadow-sm text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Calculated: Ply + Inner + Outer Laminate</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingMaterial(false);
                    setEditingMaterialId(null);
                  }}
                >
                  <X size={16} className="mr-1" /> Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  <Save size={16} className="mr-1" /> Save
                </Button>
              </div>
            </form>
          )}
          
          {/* Materials List */}
          {materials.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ply Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thickness</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materials</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materials.map((material) => (
                    <tr key={material.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {material.materialId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {material.plyType}
                        {material.grainDirection && <span className="text-xs ml-1">({material.grainDirection})</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {material.overallThickness}mm
                        <span className="text-xs block">(Ply: {material.plyThickness}mm)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Inner: {material.innerLaminateCode}</div>
                        <div>Outer: {material.outerLaminateCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingMaterialId(material.id)}
                            disabled={isAddingMaterial || editingMaterialId !== null}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(material.id)}
                            disabled={deleteLoading || isAddingMaterial || editingMaterialId !== null}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">
              No materials defined yet. Add materials to use in your box configurations.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default MaterialManagement;

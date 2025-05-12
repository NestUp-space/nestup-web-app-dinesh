import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelSelector from './ModelSelector';
import * as useApiHooks from '@/hooks/useApi'; // Import all hooks

// Mock the custom API hooks
jest.mock('@/hooks/useApi', () => ({
  ...jest.requireActual('@/hooks/useApi'), // Import and retain default behavior
  useGet: jest.fn(),
  usePost: jest.fn(),
  usePut: jest.fn(),
  useDelete: jest.fn(),
}));

import { Project, Subtask } from '@/types'; // Import Project and Subtask types

// Define types for mocked BoxComponent props for clarity
interface MockBoxComponentProps {
  box: any; // Should match BoxItem from ModelSelector
  index: number;
  boxes: any[]; // Array of BoxItem
  catalogueModels: any[]; // Array of CatalogueModel
  handleMoveBox: (boxId: string, direction: 'up' | 'down') => void;
  handleRemoveBox: (boxIdToRemove: string) => void;
  handleBoxModelSelect: (boxId: string, modelId: string | null) => void;
  handleBoxInputChange: (boxId: string, inputName: string, value: any) => void;
  handleSaveBox?: (boxId: string) => Promise<void>;
  handleDeleteBox?: (boxId: string) => Promise<void>;
  renderInputField: (
    boxId: string,
    key: string,
    inputType?: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT',
    options?: string | null,
    displayLabel?: string | null
  ) => React.ReactNode;
}

// Mock BoxComponent to simplify testing ModelSelector
jest.mock('./BoxComponent', () => ({
  __esModule: true,
  default: jest.fn(({ 
    box, 
    index, 
    handleSaveBox, 
    // handleDeleteBox, // Not used in this simplified mock for now
    handleBoxModelSelect, 
    handleBoxInputChange, 
    renderInputField, 
    catalogueModels 
  }: MockBoxComponentProps) => (
    <div data-testid={`box-component-${index}`}>
      <p>Box {index + 1} - Model: {box.selectedModelId || 'None'}</p>
      <button 
        onClick={() => handleSaveBox?.(box.id)} 
        data-testid={`save-box-${index}`} 
        disabled={!box.isModified || box.isSaving}
      >
        Save Box {index + 1}
      </button>
      <select
        data-testid={`model-select-${index}`}
        value={box.selectedModelId || ''}
        onChange={(e) => handleBoxModelSelect(box.id, e.target.value || null)}
      >
        <option value="">-- Select --</option>
        {catalogueModels.map((model: any) => ( // model type can be more specific if CatalogueModel is imported
          <option key={model.id} value={model.id}>{model.name}</option>
        ))}
      </select>
      <input
        data-testid={`input-${index}-testParam`}
        type="text"
        value={box.inputValues?.testParam || ''}
        onChange={(e) => handleBoxInputChange(box.id, 'testParam', e.target.value)}
      />
      {renderInputField(box.id, 'testParam', 'TEXT', null, 'Test Parameter')}
    </div>
  )),
}));


const mockCatalogueModels: any[] = [ // Use any[] or define CatalogueModel type if available
  {
    id: 'model1',
    name: 'Test Model 1',
    description: 'Description for model 1',
    inputParameters: [
      { id: 'param1', inputName: 'testParam', displayLabel: 'Test Parameter', inputType: 'TEXT', defaultValue: 'default value' },
    ],
  },
  {
    id: 'model2',
    name: 'Test Model 2',
    description: 'Description for model 2',
    inputParameters: [],
  },
];

const mockProject: Project = { // Added Project type
  id: 70,
  name: 'Test Project',
  client: { id: 1, name: 'Test Client', email: 'client@example.com' }, // Corrected client structure
  status: { id: 1, status: 'In Progress' }, 
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tasks: [], // Added required tasks array
  // Add other optional fields like description, address, etc. if needed for specific tests
};

describe('ModelSelector Component', () => {
  let mockUseGet: jest.Mock;
  let mockUsePost: jest.Mock;
  let mockUsePut: jest.Mock;
  let mockSaveBoxInstance: jest.Mock;
  let mockUpdateBoxInstance: jest.Mock;

  beforeEach(() => {
    // Reset mocks for each test
    mockSaveBoxInstance = jest.fn().mockResolvedValue({ id: 'db-box-1', projectId: 70, modelDefinitionId: 'model1', runtimeInputsJson: {} });
    mockUpdateBoxInstance = jest.fn().mockResolvedValue({ id: 'db-box-existing', projectId: 70, modelDefinitionId: 'model1', runtimeInputsJson: {} });

    mockUseGet = useApiHooks.useGet as jest.Mock;
    mockUsePost = useApiHooks.usePost as jest.Mock;
    mockUsePut = useApiHooks.usePut as jest.Mock;

    // Default mock for useGet (catalogue models)
    mockUseGet.mockImplementation((endpoint: string) => {
      if (endpoint === '/v1/catalogue') {
        return { data: mockCatalogueModels, loading: false, error: null, refetch: jest.fn() };
      }
      if (endpoint.includes('/model-instances')) { // For fetching existing boxes
        return { data: [], loading: false, error: null, refetch: jest.fn() };
      }
      if (endpoint.includes('/plank-generation')) {
        return { data: { plankList: [] }, loading: false, error: null, refetch: jest.fn() };
      }
      return { data: null, loading: false, error: null, refetch: jest.fn() };
    });

    // Mock for usePost and usePut to return the specific execute functions
    mockUsePost.mockReturnValue({ execute: mockSaveBoxInstance, loading: false, error: null });
    mockUsePut.mockReturnValue({ execute: mockUpdateBoxInstance, loading: false, error: null });
  });

  test('should allow adding a new box, selecting a model, entering input, and saving it', async () => {
    render(<ModelSelector project={mockProject} projectId={mockProject.id} />);

    // Wait for initial loading to complete (e.g., catalogue models)
    await screen.findByText('Configure Project Boxes');
    
    // Initially, there should be one box (default)
    expect(screen.getAllByTestId(/box-component-/)).toHaveLength(1);

    // Select a model for the first box
    const modelSelect = screen.getByTestId('model-select-0') as HTMLSelectElement;
    fireEvent.change(modelSelect, { target: { value: 'model1' } });

    await waitFor(() => {
      expect(modelSelect.value).toBe('model1');
    });

    // Enter some input for the model parameter
    const inputField = screen.getByTestId('input-0-testParam') as HTMLInputElement;
    fireEvent.change(inputField, { target: { value: 'new value' } });
    
    await waitFor(() => {
      expect(inputField.value).toBe('new value');
    });

    // Click the save button for the first box
    const saveButton = screen.getByTestId('save-box-0');
    expect(saveButton).not.toBeDisabled(); // Should be enabled because it's modified
    fireEvent.click(saveButton);

    // Assert that saveBoxInstance (from usePost) was called correctly
    await waitFor(() => {
      expect(mockSaveBoxInstance).toHaveBeenCalledTimes(1);
      expect(mockSaveBoxInstance).toHaveBeenCalledWith(
        `/api/projects/${mockProject.id}/model-instances`, // Endpoint for new box
        expect.objectContaining({
          modelDefinitionId: 'model1',
          runtimeInputsJson: { testParam: 'new value' },
          uiDisplayOrder: 0,
        })
      );
    });

    // After saving, the box should reflect its new DB ID (mocked as 'db-box-1')
    // and should no longer be in a 'modified' state (save button disabled if not modified again)
    // This part depends on how the state is updated post-save in the actual component.
    // For this sample, we'll just check the API call.
  });

  test('should load existing boxes and allow updating one', async () => {
    const existingBoxId = 'existing-db-id-1';
    const mockExistingInstances = [
      { 
        id: existingBoxId, 
        projectId: mockProject.id, 
        modelDefinitionId: 'model1', 
        runtimeInputsJson: { testParam: 'initial db value' },
        uiDisplayOrder: 0,
      }
    ];

    mockUseGet.mockImplementation((endpoint: string) => {
      if (endpoint === '/v1/catalogue') {
        return { data: mockCatalogueModels, loading: false, error: null, refetch: jest.fn() };
      }
      if (endpoint === `/api/projects/${mockProject.id}/model-instances`) {
        return { data: mockExistingInstances, loading: false, error: null, refetch: jest.fn() };
      }
      return { data: null, loading: false, error: null, refetch: jest.fn() };
    });

    render(<ModelSelector project={mockProject} projectId={mockProject.id} />);

    await screen.findByText('Box 1 - Model: Test Model 1'); // Wait for existing box to render
    
    // Change input for the existing box
    const inputField = screen.getByTestId('input-0-testParam') as HTMLInputElement;
    expect(inputField.value).toBe('initial db value'); // Check initial value
    fireEvent.change(inputField, { target: { value: 'updated db value' } });

    await waitFor(() => {
      expect(inputField.value).toBe('updated db value');
    });

    // Click save for the existing box
    const saveButton = screen.getByTestId('save-box-0');
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    // Assert that updateBoxInstance (from usePut) was called
    await waitFor(() => {
      expect(mockUpdateBoxInstance).toHaveBeenCalledTimes(1);
      expect(mockUpdateBoxInstance).toHaveBeenCalledWith(
        `/api/projects/${mockProject.id}/model-instances/${existingBoxId}`, // Endpoint for existing box
        expect.objectContaining({
          modelDefinitionId: 'model1',
          runtimeInputsJson: { testParam: 'updated db value' },
          uiDisplayOrder: 0,
        })
      );
    });
  });

  // Add more tests:
  // - Deleting a box
  // - Moving boxes
  // - Batch save configuration
  // - Plank list generation (mocking refetchPlanks)
  // - Error handling for API calls
});

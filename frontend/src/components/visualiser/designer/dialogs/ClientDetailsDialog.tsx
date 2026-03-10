'use client';

/**
 * Client Details Dialog
 * Popup for entering/editing customer details
 * Used for PDF generation and label printing
 */

import { useState, useEffect } from 'react';
import { useDesignerStore, CustomerDetails } from '@/stores/designerStore';

interface ClientDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (details: CustomerDetails) => void;
  title?: string;
}

export function ClientDetailsDialog({
  isOpen,
  onClose,
  onSave,
  title = 'Customer Details',
}: ClientDetailsDialogProps) {
  const customerDetails = useDesignerStore((state) => state.customerDetails);
  const setCustomerDetails = useDesignerStore((state) => state.setCustomerDetails);

  const [formData, setFormData] = useState<CustomerDetails>({
    customerName: '',
    firmName: '',
    address: '',
    phone: '',
    email: '',
    gst: '',
    transportAmount: 0,
  });

  // Load current details when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData(customerDetails);
    }
  }, [isOpen, customerDetails]);

  const handleChange = (field: keyof CustomerDetails) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'transportAmount' 
      ? parseFloat(e.target.value) || 0 
      : e.target.value;
    
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    setCustomerDetails(formData);
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  const handleCancel = () => {
    setFormData(customerDetails); // Reset to original
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={handleChange('customerName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter customer name"
            />
          </div>

          {/* Firm Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firm Name
            </label>
            <input
              type="text"
              value={formData.firmName}
              onChange={handleChange('firmName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter firm/company name"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={handleChange('address')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Enter full address"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Number
            </label>
            <input
              type="text"
              value={formData.gst}
              onChange={handleChange('gst')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="GST Number (optional)"
            />
          </div>

          {/* Transport Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transport Amount (₹)
            </label>
            <input
              type="number"
              value={formData.transportAmount || ''}
              onChange={handleChange('transportAmount')}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.customerName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientDetailsDialog;

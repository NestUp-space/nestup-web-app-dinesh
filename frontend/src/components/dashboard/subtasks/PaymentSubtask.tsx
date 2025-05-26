"use client";

import React, { useState } from 'react';
import { IndianRupee, FileCheck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/dashboard/button';
import { Subtask, Project, User } from '@/types';

interface PaymentSubtaskProps {
  subtask: Subtask;
  project: Project;
  onPaymentComplete: () => void;
  currentUser: User | null;
}

interface PaymentDetail {
  amount: number;
  description: string;
  paymentType: string;
  reference?: string;
}

export const PaymentSubtask: React.FC<PaymentSubtaskProps> = ({
  subtask,
  project,
  onPaymentComplete,
  currentUser
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const paymentDetails: PaymentDetail | null = React.useMemo(() => {
    if (subtask.metadataJson) {
      try {
        const metadata = JSON.parse(subtask.metadataJson);
        return metadata.paymentDetails || null;
      } catch (e) {
        console.error('Error parsing payment details:', e);
        return null;
      }
    }
    return null;
  }, [subtask.metadataJson]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please upload payment proof');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('referenceNumber', referenceNumber);
    if (paymentDetails) {
      formData.append('amount', paymentDetails.amount.toString());
      formData.append('paymentType', paymentDetails.paymentType);
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project.id}/tasks/${subtask.id}/payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment verification failed');
      }

      setSuccess(true);
      setSelectedFile(null);
      setReferenceNumber('');
      onPaymentComplete();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!paymentDetails) {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <p className="text-red-600 text-sm">Payment details not configured for this task.</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      {/* Payment Information */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Details</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-sm font-medium text-gray-900 flex items-center">
                <IndianRupee className="w-4 h-4 mr-1" />
                {paymentDetails.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Type:</span>
              <span className="text-sm font-medium text-gray-900">
                {paymentDetails.paymentType}
              </span>
            </div>
            <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">{paymentDetails.description}</p>
          </div>
        </div>
      </div>

      {/* Payment Proof Upload */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Reference Number
            </label>
            <input
              id="referenceNumber"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter payment reference number"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300 text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="payment-proof" className="block text-sm font-medium text-gray-700 mb-1">
              Upload Payment Proof
            </label>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                onClick={() => document.getElementById('payment-proof')?.click()}
                variant="outline"
                className="flex items-center space-x-2 border-gray-300 hover:border-gray-400 text-gray-700"
              >
                <FileCheck className="w-4 h-4" />
                <span>Choose File</span>
              </Button>
              <span className="text-sm text-gray-500 truncate">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
            </div>
            <input
              id="payment-proof"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              {error && (
                <div className="flex items-center text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center text-green-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Payment verified successfully</span>
                </div>
              )}
            </div>
            {subtask.actionByRole === currentUser?.role?.role && (
              <Button
                type="submit"
                disabled={isSubmitting || !selectedFile}
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 shadow-sm transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <IndianRupee className="w-4 h-4" />
                    <span>Verify Payment</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaymentSubtask;

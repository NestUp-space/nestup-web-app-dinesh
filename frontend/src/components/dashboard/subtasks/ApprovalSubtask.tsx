"use client";

import React, { useState } from 'react';
import { CheckCircle2, Clock, ThumbsDown, ThumbsUp, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/dashboard/button';
import { Subtask, Project, User } from '@/types';

interface ApprovalSubtaskProps {
  subtask: Subtask;
  project: Project;
  onApprovalComplete: () => void;
  currentUser: User | null;
}

type ApprovalAction = 'approve' | 'reject';

interface ApprovalHistoryItem {
  action: ApprovalAction;
  comment: string;
  timestamp: string;
  userId: string;
}

export const ApprovalSubtask: React.FC<ApprovalSubtaskProps> = ({
  subtask,
  project,
  onApprovalComplete,
  currentUser
}) => {
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleApprovalAction = async (action: ApprovalAction) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project.id}/tasks/${subtask.id}/approval`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            action,
            comment: comment.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process approval');
      }

      const result = await response.json();
      
      // Update approval history
      setApprovalHistory(prev => [{
        action,
        comment: comment.trim(),
        timestamp: new Date().toISOString(),
        userId: result.userId,
      }, ...prev]);

      setComment('');
      setShowCommentBox(false);
      onApprovalComplete();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    if (subtask.completed) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          <span>Approved</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-orange-500">
        <Clock className="w-5 h-5 mr-2" />
        <span>Pending Approval</span>
      </div>
    );
  };

  return (
    <div className="h-full space-y-6">
      {/* Status Display */}
      <div className={`
        p-4 rounded-lg border shadow-sm transition-all duration-200
        ${subtask.completed 
          ? 'bg-green-50 border-green-200' 
          : 'bg-orange-50 border-orange-200'
        }
      `}>
        <h4 className="text-sm font-medium mb-2 text-gray-700">Current Status</h4>
        {getStatusDisplay()}
      </div>

      {/* Action Section */}
      {!subtask.completed && subtask.actionByRole === currentUser?.role?.role && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {!showCommentBox ? (
            <div className="p-4">
              <h4 className="text-sm font-medium mb-3 text-gray-700">Take Action</h4>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCommentBox(true)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-sm transition-all duration-200"
                  disabled={isSubmitting}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => setShowCommentBox(true)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-sm transition-all duration-200"
                  disabled={isSubmitting}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              <div className="p-4">
                <h4 className="text-sm font-medium mb-3 text-gray-700">Add Comment</h4>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment (optional)"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={3}
                />
              </div>
              <div className="p-4 bg-gray-50">
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprovalAction('approve')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-sm transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Approval'}
                  </Button>
                  <Button
                    onClick={() => handleApprovalAction('reject')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setShowCommentBox(false);
                    setComment('');
                  }}
                  variant="ghost"
                  className="w-full mt-3"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <div className="flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Approval History */}
      {approvalHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Approval History</h4>
          <div className="space-y-4">
            {approvalHistory.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-full ${
                        item.action === 'approve' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {item.action === 'approve' ? (
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.action === 'approve' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {item.comment && (
                    <div className="mt-3 flex items-start pl-11">
                      <MessageCircle className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 break-words">{item.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalSubtask;

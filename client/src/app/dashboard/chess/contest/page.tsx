'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/retroui/Button';
import { Input } from '@/components/retroui/Input';
import { Label } from '@/components/retroui/Label';
import { Dialog } from '@/components/retroui/Dialog';
import { Checkbox } from '@/components/retroui/Checkbox';

interface ContestFormData {
  title: string;
  maxParticipants: number;
  startDate: string;
  endDate: string;
  prizePool: number;
  termsAccepted: boolean;
}

export default function ContestPage() {
  const [formData, setFormData] = useState<ContestFormData>({
    title: '',
    maxParticipants: 40,
    startDate: '',
    endDate: '',
    prizePool: 0,
    termsAccepted: false,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ContestFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Contest title is required';
    }

    if (formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Minimum 2 participants required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.prizePool <= 0) {
      newErrors.prizePool = 'Prize pool must be greater than 0';
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsDialogOpen(true);
    }
  };

  const handleConfirm = async () => {
    const loadingToast = toast.loading('Creating contest...', {
      position: 'top-center',
    });

    try {
      const contestData = {
        title: formData.title,
        type: 'standard', // Default type as requested
        startDate: formData.startDate, // This will be in YYYY-MM-DD format
        endDate: formData.endDate, // This will be in YYYY-MM-DD format
        prizePool: formData.prizePool,
        timeControl: null, // Can be added later if needed
        settings: {
          maxParticipants: formData.maxParticipants,
          termsAccepted: formData.termsAccepted
        }
      };

      const response = await fetch('http://localhost:8000/api/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contestData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Contest created successfully:', result.data);
        toast.dismiss(loadingToast);
        toast.success('Contest created successfully!', {
          duration: 4000,
          position: 'top-center',
        });
        setIsDialogOpen(false);
        // Reset form
        setFormData({
          title: '',
          maxParticipants: 40,
          startDate: '',
          endDate: '',
          prizePool: 0,
          termsAccepted: false,
        });
      } else {
        console.error('Failed to create contest:', result.message);
        toast.dismiss(loadingToast);
        toast.error(`Failed to create contest: ${result.message}`, {
          duration: 5000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error creating contest:', error);
      toast.dismiss(loadingToast);
      toast.error('Error creating contest. Please try again.', {
        duration: 5000,
        position: 'top-center',
      });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-black text-black mb-4 uppercase">
              Create Chess Contest
            </h1>
            <p className="text-lg font-bold text-black">
              Set up your tournament and invite players to compete
            </p>
          </motion.div>

          {/* Contest Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8"
          >
            <div className="space-y-6">
              {/* Contest Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg font-bold text-black">
                  Contest Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter contest title (e.g., 'Spring Chess Championship')"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`text-lg ${errors.title ? 'border-red-500' : ''}`}
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p className="text-red-500 font-bold text-sm">{errors.title}</p>
                )}
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label htmlFor="maxParticipants" className="text-lg font-bold text-black">
                  Maximum Participants *
                </Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="2"
                  max="1000"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 40)}
                  className={`text-lg ${errors.maxParticipants ? 'border-red-500' : ''}`}
                  aria-invalid={!!errors.maxParticipants}
                />
                {errors.maxParticipants && (
                  <p className="text-red-500 font-bold text-sm">{errors.maxParticipants}</p>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-lg font-bold text-black">
                    Start Date *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={`text-lg ${errors.startDate ? 'border-red-500' : ''}`}
                    aria-invalid={!!errors.startDate}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 font-bold text-sm">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-lg font-bold text-black">
                    End Date *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={`text-lg ${errors.endDate ? 'border-red-500' : ''}`}
                    aria-invalid={!!errors.endDate}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 font-bold text-sm">{errors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Prize Pool */}
              <div className="space-y-2">
                <Label htmlFor="prizePool" className="text-lg font-bold text-black">
                  Total Prize Pool (ETH) *
                </Label>
                <Input
                  id="prizePool"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.prizePool}
                  onChange={(e) => handleInputChange('prizePool', parseFloat(e.target.value) || 0)}
                  className={`text-lg ${errors.prizePool ? 'border-red-500' : ''}`}
                  aria-invalid={!!errors.prizePool}
                />
                {errors.prizePool && (
                  <p className="text-red-500 font-bold text-sm">{errors.prizePool}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => handleInputChange('termsAccepted', checked as boolean)}
                  className={`mt-1 ${errors.termsAccepted ? 'border-red-500' : ''}`}
                />
                <div className="space-y-1">
                  <Label htmlFor="terms" className="text-sm font-bold text-black cursor-pointer">
                    I agree to the terms and conditions *
                  </Label>
                  <p className="text-xs text-gray-600">
                    By creating this contest, you agree to our platform rules and contest guidelines.
                  </p>
                  {errors.termsAccepted && (
                    <p className="text-red-500 font-bold text-sm">{errors.termsAccepted}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-4"
              >
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  className="w-full font-bold uppercase text-lg py-4"
                >
                  Create Contest
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Confirmation Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Content size="md">
              <Dialog.Header>
                <h2 className="text-2xl font-black text-white uppercase">
                  Confirm Contest Creation
                </h2>
              </Dialog.Header>
              
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-lg font-bold text-black mb-3">Contest Details:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-bold">Title:</span>
                      <span>{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Max Participants:</span>
                      <span>{formData.maxParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Start Date:</span>
                      <span>{new Date(formData.startDate).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">End Date:</span>
                      <span>{new Date(formData.endDate).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Prize Pool:</span>
                      <span className="font-bold text-green-600">{formData.prizePool} ETH</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  Are you sure you want to create this contest? This action cannot be undone.
                </p>
              </div>

              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="font-bold uppercase"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="font-bold uppercase"
                >
                  Confirm & Create
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

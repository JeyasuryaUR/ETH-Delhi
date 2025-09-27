"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/retroui/Button';
import { Input } from '@/components/retroui/Input';
import { Label } from '@/components/retroui/Label';
import { Checkbox } from '@/components/retroui/Checkbox';

interface CreateTournamentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTournamentCreated: () => void;
}

interface TournamentFormData {
  title: string;
  startDate: string;
  endDate: string;
  prizePool: number;
  termsAccepted: boolean;
}

interface FormErrors {
  title?: string;
  startDate?: string;
  endDate?: string;
  prizePool?: string;
  termsAccepted?: string;
}

export function CreateTournamentDialog({ isOpen, onClose, onTournamentCreated }: CreateTournamentDialogProps) {
  const [formData, setFormData] = useState<TournamentFormData>({
    title: '',
    startDate: '',
    endDate: '',
    prizePool: 0,
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof TournamentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      if (startDate <= new Date()) {
        newErrors.startDate = 'Start date must be in the future';
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
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

  const handleCreateTournament = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          start_at: new Date(formData.startDate).toISOString(),
          end_at: new Date(formData.endDate).toISOString(),
          prize_pool: formData.prizePool.toString(),
          status: 'upcoming'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      const tournament = await response.json();
      
      toast.success('Tournament created successfully!', {
        style: {
          background: '#FFE81E',
          color: '#000',
          fontWeight: 'bold',
          border: '2px solid #000',
        },
      });

      // Reset form
      setFormData({
        title: '',
        startDate: '',
        endDate: '',
        prizePool: 0,
        termsAccepted: false,
      });
      
      setErrors({});
      onTournamentCreated();
      onClose();
      
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament. Please try again.', {
        style: {
          background: '#ff4444',
          color: '#fff',
          fontWeight: 'bold',
          border: '2px solid #000',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80"
        onClick={handleClose}
      />
      
      {/* Dialog Content */}
      <div className="relative z-10 max-w-2xl w-full mx-4">
        <div className="p-8 bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-8 text-center">
            <motion.div 
              className="w-16 h-16 bg-[#FFE81E] border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-2xl">🏆</span>
          </motion.div>
          <h2 className="text-3xl font-black text-black uppercase mb-2">Create Tournament</h2>
          <p className="text-black font-medium">Set up your competitive chess tournament</p>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2">Tournament Title</Label>
            <Input
              placeholder="Enter tournament name..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`font-medium ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.title}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2">Start Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`font-medium ${errors.startDate ? 'border-red-500' : ''}`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.startDate}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2">End Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`font-medium ${errors.endDate ? 'border-red-500' : ''}`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2">Prize Pool (ETH)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.prizePool}
              onChange={(e) => handleInputChange('prizePool', parseFloat(e.target.value) || 0)}
              className={`font-medium ${errors.prizePool ? 'border-red-500' : ''}`}
            />
            {errors.prizePool && (
              <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.prizePool}</p>
            )}
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 border border-black">
            <Checkbox
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => handleInputChange('termsAccepted', checked)}
              className={errors.termsAccepted ? 'border-red-500' : ''}
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-black">
                I agree to the tournament terms and conditions
              </p>
              <p className="text-xs text-black mt-1">
                By creating this tournament, you agree to our platform rules and prize distribution policies.
              </p>
              {errors.termsAccepted && (
                <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.termsAccepted}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={handleClose}
            className="font-bold uppercase"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateTournament}
            className="font-bold uppercase"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Tournament'}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
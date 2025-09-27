"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/retroui/Button';
import { Input } from '@/components/retroui/Input';
import { Label } from '@/components/retroui/Label';
import { Checkbox } from '@/components/retroui/Checkbox';
import { Select } from '@/components/retroui/Select';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { API_BASE } from '@/lib/config';

interface CreateTournamentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTournamentCreated: () => void;
}

// Time control options with their categories
const TIME_CONTROL_OPTIONS = [
  { value: '3+2', label: '3+2', category: 'blitz' },
  { value: '5+1', label: '5+1', category: 'blitz' },
  { value: '10+1', label: '10+1', category: 'rapid' },
  { value: '20+5', label: '20+5', category: 'rapid' },
  { value: '30+30', label: '30+30', category: 'standard' },
  { value: '1hr+30s', label: '1 hr + 30 seconds', category: 'standard' },
] as const;

interface TournamentFormData {
  title: string;
  type: string;
  timeControl: string;
  startDate: string;
  endDate: string;
  prizePool: number;
  maxParticipants: number;
  totalRounds: number;
  organizerWalletAddress: string;
  termsAccepted: boolean;
}

interface FormErrors {
  title?: string;
  timeControl?: string;
  startDate?: string;
  endDate?: string;
  prizePool?: string;
  maxParticipants?: string;
  totalRounds?: string;
  organizerWalletAddress?: string;
  termsAccepted?: string;
}

export function CreateTournamentDialog({ isOpen, onClose, onTournamentCreated }: CreateTournamentDialogProps) {
  const { primaryWallet } = useDynamicContext();
  const [formData, setFormData] = useState<TournamentFormData>({
    title: '',
    type: '',
    timeControl: '',
    startDate: '',
    endDate: '',
    prizePool: 0,
    maxParticipants: 32,
    totalRounds: 7,
    organizerWalletAddress: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update wallet address when primaryWallet changes
  useEffect(() => {
    if (primaryWallet?.address) {
      setFormData(prev => ({
        ...prev,
        organizerWalletAddress: primaryWallet.address
      }));
    }
  }, [primaryWallet?.address]);

  // Get contest type based on selected time control
  const getContestType = (timeControl: string): string => {
    const option = TIME_CONTROL_OPTIONS.find(opt => opt.value === timeControl);
    return option?.category || 'standard';
  };

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

    if (!formData.timeControl) {
      newErrors.timeControl = 'Time control is required';
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

    if (formData.maxParticipants <= 0) {
      newErrors.maxParticipants = 'Max participants must be greater than 0';
    }

    if (formData.totalRounds <= 0) {
      newErrors.totalRounds = 'Total rounds must be greater than 0';
    }

    if (!primaryWallet?.address) {
      newErrors.organizerWalletAddress = 'Please connect your wallet first';
    } else if (!formData.organizerWalletAddress.trim()) {
      newErrors.organizerWalletAddress = 'Wallet address is required';
    } else if (!formData.organizerWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      newErrors.organizerWalletAddress = 'Invalid wallet address format';
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTournament = async () => {
    // Check if wallet is connected before validation
    if (!primaryWallet?.address) {
      toast.error('Please connect your wallet to create a tournament', {
        style: {
          background: '#ff4444',
          color: '#fff',
          fontWeight: 'bold',
          border: '2px solid #000',
        },
      });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const contestType = getContestType(formData.timeControl);
      
      const response = await fetch(API_BASE + '/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          type: contestType,
          timeControl: formData.timeControl,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          prizePool: formData.prizePool.toString(),
          maxParticipants: formData.maxParticipants,
          totalRounds: formData.totalRounds,
          organizerWalletAddress: primaryWallet.address, // Use actual connected wallet address
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
        timeControl: '',
        startDate: '',
        endDate: '',
        prizePool: 0,
        maxParticipants: 32,
        totalRounds: 7,
        organizerWalletAddress: primaryWallet?.address || '',
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

          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2">Time Control</Label>
            <Select onValueChange={(value) => handleInputChange('timeControl', value)} value={formData.timeControl}>
              <Select.Trigger className={`font-medium ${errors.timeControl ? 'border-red-500' : ''}`}>
                <Select.Value placeholder="Select time control..." />
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  <Select.Label className="text-xs font-bold text-gray-600 uppercase px-2 py-1">Blitz</Select.Label>
                  {TIME_CONTROL_OPTIONS.filter(opt => opt.category === 'blitz').map((option) => (
                    <Select.Item key={option.value} value={option.value} className="font-medium">
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Group>
                <Select.Separator />
                <Select.Group>
                  <Select.Label className="text-xs font-bold text-gray-600 uppercase px-2 py-1">Rapid</Select.Label>
                  {TIME_CONTROL_OPTIONS.filter(opt => opt.category === 'rapid').map((option) => (
                    <Select.Item key={option.value} value={option.value} className="font-medium">
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Group>
                <Select.Separator />
                <Select.Group>
                  <Select.Label className="text-xs font-bold text-gray-600 uppercase px-2 py-1">Standard</Select.Label>
                  {TIME_CONTROL_OPTIONS.filter(opt => opt.category === 'standard').map((option) => (
                    <Select.Item key={option.value} value={option.value} className="font-medium">
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select>
            {errors.timeControl && (
              <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.timeControl}</p>
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

          <div className="grid md:grid-cols-3 gap-6">
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

            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2">Max Participants</Label>
              <Input
                type="number"
                min="2"
                placeholder="32"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 0)}
                className={`font-medium ${errors.maxParticipants ? 'border-red-500' : ''}`}
              />
              {errors.maxParticipants && (
                <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.maxParticipants}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-bold text-black uppercase mb-2">Total Rounds</Label>
              <Input
                type="number"
                min="1"
                placeholder="7"
                value={formData.totalRounds}
                onChange={(e) => handleInputChange('totalRounds', parseInt(e.target.value) || 0)}
                className={`font-medium ${errors.totalRounds ? 'border-red-500' : ''}`}
              />
              {errors.totalRounds && (
                <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.totalRounds}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold text-black uppercase mb-2">Wallet Address</Label>
            <Input
              placeholder={primaryWallet?.address ? "Wallet connected..." : "Please connect your wallet first"}
              value={formData.organizerWalletAddress}
              onChange={(e) => handleInputChange('organizerWalletAddress', e.target.value)}
              className={`font-medium font-mono text-sm ${errors.organizerWalletAddress ? 'border-red-500' : ''} ${!primaryWallet?.address ? 'bg-gray-100' : 'bg-green-50'}`}
              readOnly
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-600">Prize pool will be sent to this address</p>
              {primaryWallet?.address && (
                <p className="text-xs text-green-600 font-bold">✓ WALLET CONNECTED</p>
              )}
              {!primaryWallet?.address && (
                <p className="text-xs text-red-600 font-bold">⚠ CONNECT WALLET</p>
              )}
            </div>
            {errors.organizerWalletAddress && (
              <p className="text-red-500 text-xs font-bold mt-1 uppercase">{errors.organizerWalletAddress}</p>
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
            className={`font-bold uppercase ${!primaryWallet?.address ? 'bg-gray-400 hover:bg-gray-400' : ''}`}
            disabled={isSubmitting || !primaryWallet?.address}
            title={!primaryWallet?.address ? 'Please connect your wallet first' : ''}
          >
            {isSubmitting 
              ? 'Creating...' 
              : !primaryWallet?.address 
                ? 'Connect Wallet First' 
                : 'Create Tournament'
            }
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
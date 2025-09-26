import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createUserProfile = async (req: Request, res: Response) => {
  try {
    const {
      username,
      email,
      display_name,
      wallet_address,
      ens_name,
      ens_namehash,
      ens_resolver,
      ens_registered,
      ens_verified,
    } = req.body ?? {};

    // Basic required fields check
    if (!username || !email || !display_name || !wallet_address) {
      return res.status(400).json({
        success: false,
        message: 'username, email, display_name and wallet_address are required',
      });
    }

    // Normalize certain fields to lowercase for uniqueness expectations
    const normalizedUsername = String(username).toLowerCase();
    const normalizedWallet = String(wallet_address).toLowerCase();
    const normalizedEnsName = ens_name ? String(ens_name).toLowerCase() : null;

    const user = await prisma.users.create({
      data: {
        username: normalizedUsername,
        email: email as string,
        display_name: display_name as string,
        wallet_address: normalizedWallet,
        ens_name: normalizedEnsName,
        ens_namehash: ens_namehash || null,
        ens_resolver: ens_resolver || null,
        ens_registered: Boolean(ens_registered ?? false),
        ens_verified: Boolean(ens_verified ?? false),
      },
    });

    return res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    // Handle unique constraint violations gracefully
    if (err?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A user with provided unique fields already exists',
        meta: err?.meta,
      });
    }

    console.error('createUserProfile error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUserByWalletAddress = async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.params;

    if (!wallet_address) {
      return res.status(400).json({
        success: false,
        message: 'wallet_address parameter is required',
      });
    }

    // Normalize wallet address to lowercase for consistent lookup
    const normalizedWallet = String(wallet_address).toLowerCase();

    const user = await prisma.users.findUnique({
      where: {
        wallet_address: normalizedWallet,
      },
      select: {
        id: true,
        username: true,
        display_name: true,
        email: true,
        wallet_address: true,
        ens_name: true,
        ens_namehash: true,
        ens_resolver: true,
        ens_registered: true,
        ens_verified: true,
        ens_verified_at: true,
        rating_cached: true,
        rating_type_cached: true,
        rating_cached_updated_at: true,
        created_at: true,
        is_active: true,
        metadata: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    console.error('getUserByWalletAddress error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



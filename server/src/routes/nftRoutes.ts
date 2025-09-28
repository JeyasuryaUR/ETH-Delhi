import express from 'express';
import { NFTService } from '../services/nftService';

const router = express.Router();

/**
 * Test endpoint to simulate NFT minting for a specific game
 */
router.post('/mint-test/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Game ID is required'
      });
    }

    console.log(`🧪 Testing NFT minting for game: ${gameId}`);

    // Test the NFT minting process
    await NFTService.mintCanonicalGameNFT(gameId);

    return res.status(200).json({
      success: true,
      message: 'NFT minting test completed',
      data: {
        gameId,
        note: 'Check console for detailed NFT minting simulation'
      }
    });

  } catch (error: any) {
    console.error('NFT minting test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get NFT data for a specific game (without minting)
 */
router.get('/nft-data/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Game ID is required'
      });
    }

    const nftData = await NFTService.prepareCanonicalGameForNFT(gameId);

    if (!nftData) {
      return res.status(404).json({
        success: false,
        message: 'Game not found or cannot prepare NFT data'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'NFT data prepared successfully',
      data: nftData
    });

  } catch (error: any) {
    console.error('Get NFT data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
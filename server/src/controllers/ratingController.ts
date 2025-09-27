import axios from "axios";
import { Request, Response } from "express";
import FormData from "form-data";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type MaybeNumber = number | null;

// Walrus configuration
const WALRUS_CONFIG = {
  PUBLISHER: process.env.WALRUS_PUBLISHER || "https://publisher.walrus-testnet.walrus.space",
  AGGREGATOR: process.env.WALRUS_AGGREGATOR || "https://aggregator.walrus-testnet.walrus.space",
  EPOCHS: 5
};

interface WalrusResponse {
  blobStoreResult: {
    newlyCreated: {
      blobObject: {
        id: string;
        registeredEpoch: number;
        blobId: string;
        size: number;
        encodingType: string;
        certifiedEpoch: number | null;
        storage: {
          id: string;
          startEpoch: number;
          endEpoch: number;
          storageSize: number;
        };
        deletable: boolean;
      };
      resourceOperation: {
        registerFromScratch: {
          encodedLength: number;
          epochsAhead: number;
        };
      };
      cost: number;
    };
  };
  storedQuiltBlobs: Array<{
    identifier: string;
    quiltPatchId: string;
  }>;
}

const safeNumber = (v: any): MaybeNumber => {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const extractFideRating = (
  d: any
): { rating: MaybeNumber; source: string | null } => {
  if (!d) return { rating: null, source: null };

  // 1) Preferred: explicit classical / standard rating fields
  const classicalCandidates = [
    safeNumber(d?.classical_rating),
    safeNumber(d?.classical),
    safeNumber(d?.standard_rating),
    safeNumber(d?.standard),
  ].filter((x) => x !== null) as number[];

  if (classicalCandidates.length > 0) {
    return { rating: classicalCandidates[0], source: "classical" };
  }

  // 2) If classical not present, collect any of classical/rapid/blitz and average them
  const possible = [
    safeNumber(d?.classical_rating),
    safeNumber(d?.rapid_rating),
    safeNumber(d?.blitz_rating),
    safeNumber(d?.rapid),
    safeNumber(d?.blitz),
    safeNumber(d?.fide_rating),
    safeNumber(d?.rating),
    safeNumber(d?.player?.fide_rating),
    safeNumber(d?.player?.rating),
    safeNumber(d?.data?.fide_rating),
    safeNumber(d?.data?.rating),
    safeNumber(d?.standard?.rating),
    safeNumber(d?.rapid?.rating),
    safeNumber(d?.blitz?.rating),
  ].filter((v) => v !== null) as number[];

  if (possible.length === 1) {
    return { rating: possible[0], source: "single-available" };
  } else if (possible.length > 1) {
    const sum = possible.reduce((s, x) => s + x, 0);
    const avg = sum / possible.length;
    return { rating: avg, source: `average-of-${possible.length}-fields` };
  }

  // 3) Fallback: scan object for any numeric value (last resort)
  const flatNumbers: number[] = [];
  const walk = (obj: any) => {
    if (obj === null || obj === undefined) return;
    if (typeof obj === "number") {
      flatNumbers.push(obj);
      return;
    }
    if (typeof obj === "string") {
      const n = Number(obj);
      if (!Number.isNaN(n)) flatNumbers.push(n);
      return;
    }
    if (typeof obj === "object") {
      for (const v of Object.values(obj)) walk(v);
    }
  };
  walk(d);

  if (flatNumbers.length > 0) {
    return { rating: flatNumbers[0], source: "first-numeric-found" };
  }

  // nothing found
  return { rating: null, source: null };
};

const computeWeightedAverage = (
  items: { value: MaybeNumber; weight: number }[]
): MaybeNumber => {
  const numerator = items.reduce(
    (sum, it) => (it.value !== null ? sum + it.value * it.weight : sum),
    0
  );
  const denom = items.reduce(
    (sum, it) => (it.value !== null ? sum + it.weight : sum),
    0
  );
  return denom > 0 ? numerator / denom : null;
};

export const getChessDotComRating = async (req: Request, res: Response) => {
  const { chessUsername, lichessUsername, fideId } = req.query as {
    chessUsername?: string;
    lichessUsername?: string;
    fideId?: string;
  };

  if (!chessUsername && !lichessUsername && !fideId) {
    return res.status(400).json({
      error:
        "At least one of chessUsername, lichessUsername or fideId must be provided",
    });
  }

  try {
    const promises: Promise<any>[] = [];

    if (chessUsername) {
      promises.push(
        axios.get(
          `https://api.chess.com/pub/player/${encodeURIComponent(
            chessUsername
          )}/stats`
        )
      );
    } else promises.push(Promise.resolve(null));

    if (lichessUsername) {
      promises.push(
        axios.get(
          `https://lichess.org/api/user/${encodeURIComponent(lichessUsername)}`
        )
      );
    } else promises.push(Promise.resolve(null));

    if (fideId) {
      promises.push(
        axios.get(
          `https://fide-api.vercel.app/player_info/?fide_id=${encodeURIComponent(
            fideId
          )}&history=false`
        )
      );
    } else promises.push(Promise.resolve(null));

    const [chessRes, lichessRes, fideRes] = await Promise.all(promises);

    const chessData = chessRes?.data ?? null;
    const chessCom = {
      bullet: (chessData?.chess_bullet?.last?.rating ?? null) as MaybeNumber,
      blitz: (chessData?.chess_blitz?.last?.rating ?? null) as MaybeNumber,
      rapid: (chessData?.chess_rapid?.last?.rating ?? null) as MaybeNumber,
    };

    const lichessData = lichessRes?.data ?? null;
    const lichess = {
      bullet: (lichessData?.perfs?.bullet?.rating ?? null) as MaybeNumber,
      blitz: (lichessData?.perfs?.blitz?.rating ?? null) as MaybeNumber,
      rapid: (lichessData?.perfs?.rapid?.rating ?? null) as MaybeNumber,
    };

    const fideRaw = fideRes?.data ?? null;
    const { rating: fideRating, source: fideSource } =
      extractFideRating(fideRaw);

    // per-platform averages
    const chessRatings = Object.values(chessCom).filter(
      (r) => typeof r === "number" && !Number.isNaN(r)
    ) as number[];
    const lichessRatings = Object.values(lichess).filter(
      (r) => typeof r === "number" && !Number.isNaN(r)
    ) as number[];

    const chessAvg: MaybeNumber =
      chessRatings.length > 0
        ? chessRatings.reduce((a, b) => a + b, 0) / chessRatings.length
        : null;
    const lichessAvg: MaybeNumber =
      lichessRatings.length > 0
        ? lichessRatings.reduce((a, b) => a + b, 0) / lichessRatings.length
        : null;

    // weights: fide=3, chess.com=2, lichess=1
    const weightedAverage = computeWeightedAverage([
      { value: fideRating, weight: 3 },
      { value: chessAvg, weight: 2 },
      { value: lichessAvg, weight: 1 },
    ]);

    const result = {
      chessCom,
      lichess,
      fide: {
        fideId: fideId ?? null,
        rating: fideRating,
        source: fideSource,
        raw: fideRaw,
      },
      averages: {
        chessAvg,
        lichessAvg,
        fideRating,
        weightedAverage,
      },
    };

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to fetch ratings",
      details: error?.message ?? String(error),
    });
  }
};

// Store rating data in Walrus
export const storeRatingInWalrus = async (req: Request, res: Response) => {
  const { chessUsername, lichessUsername, fideId } = req.body as {
    chessUsername?: string;
    lichessUsername?: string;
    fideId?: string;
  };

  if (!chessUsername && !lichessUsername && !fideId) {
    return res.status(400).json({
      error: "At least one of chessUsername, lichessUsername or fideId must be provided",
    });
  }

  try {
    // First get the rating data
    const ratingData = await getRatingData(chessUsername, lichessUsername, fideId);
    
    // Create FormData for Walrus API
    const formData = new FormData();
    
    // Create JSON data for each rating component
    const playerRatingData = {
      player: {
        chessUsername: chessUsername || null,
        lichessUsername: lichessUsername || null,
        fideId: fideId || null,
      },
      ratings: {
        chessCom: ratingData.chessCom,
        lichess: ratingData.lichess,
        fide: ratingData.fide,
        averages: ratingData.averages,
      },
      timestamp: new Date().toISOString(),
    };

    // Add each rating component as a separate file
    formData.append('player-rating', JSON.stringify(playerRatingData), {
      filename: 'player-rating.json',
      contentType: 'application/json'
    });
    
    formData.append('chess-com-avg', JSON.stringify(ratingData.averages.chessAvg), {
      filename: 'chess-com-avg.json',
      contentType: 'application/json'
    });
    
    formData.append('lichess-avg', JSON.stringify(ratingData.averages.lichessAvg), {
      filename: 'lichess-avg.json',
      contentType: 'application/json'
    });
    
    formData.append('fide-rating', JSON.stringify(ratingData.averages.fideRating), {
      filename: 'fide-rating.json',
      contentType: 'application/json'
    });

    // Add metadata for each file
    const metadata = [
      {
        identifier: "player-rating",
        tags: {
          type: "chess-ratings",
          component: "complete-data",
          platform: "multi-platform",
          timestamp: new Date().toISOString()
        }
      },
      {
        identifier: "chess-com-avg",
        tags: {
          type: "chess-ratings",
          component: "chess-com-average",
          platform: "chess.com"
        }
      },
      {
        identifier: "lichess-avg",
        tags: {
          type: "chess-ratings",
          component: "lichess-average",
          platform: "lichess"
        }
      },
      {
        identifier: "fide-rating",
        tags: {
          type: "chess-ratings",
          component: "fide-rating",
          platform: "fide"
        }
      }
    ];

    formData.append('_metadata', JSON.stringify(metadata));

    // Store in Walrus with deletable=true
    const walrusResponse = await axios.put(
      `${WALRUS_CONFIG.PUBLISHER}/v1/quilts?epochs=${WALRUS_CONFIG.EPOCHS}&deletable=true`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    const walrusData: WalrusResponse = walrusResponse.data;

    return res.json({
      success: true,
      walrus: walrusData,
      ratingData: playerRatingData,
      quiltPatchIds: walrusData.storedQuiltBlobs,
    });

  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to store ratings in Walrus",
      details: error?.message ?? String(error),
    });
  }
};

// Retrieve rating data from Walrus
export const getRatingFromWalrus = async (req: Request, res: Response) => {
  const { quiltPatchId } = req.params;

  if (!quiltPatchId) {
    return res.status(400).json({
      error: "quiltPatchId is required",
    });
  }

  try {
    const response = await axios.get(
      `${WALRUS_CONFIG.AGGREGATOR}/v1/blobs/by-quilt-patch-id/${quiltPatchId}`
    );

    return res.json({
      success: true,
      data: response.data,
    });

  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to retrieve ratings from Walrus",
      details: error?.message ?? String(error),
    });
  }
};

// Helper function to get rating data (extracted from getChessDotComRating)
const getRatingData = async (chessUsername?: string, lichessUsername?: string, fideId?: string) => {
  const promises: Promise<any>[] = [];

  if (chessUsername) {
    promises.push(
      axios.get(
        `https://api.chess.com/pub/player/${encodeURIComponent(
          chessUsername
        )}/stats`
      )
    );
  } else promises.push(Promise.resolve(null));

  if (lichessUsername) {
    promises.push(
      axios.get(
        `https://lichess.org/api/user/${encodeURIComponent(lichessUsername)}`
      )
    );
  } else promises.push(Promise.resolve(null));

  if (fideId) {
    promises.push(
      axios.get(
        `https://fide-api.vercel.app/player_info/?fide_id=${encodeURIComponent(
          fideId
        )}&history=false`
      )
    );
  } else promises.push(Promise.resolve(null));

  const [chessRes, lichessRes, fideRes] = await Promise.all(promises);

  const chessData = chessRes?.data ?? null;
  const chessCom = {
    bullet: (chessData?.chess_bullet?.last?.rating ?? null) as MaybeNumber,
    blitz: (chessData?.chess_blitz?.last?.rating ?? null) as MaybeNumber,
    rapid: (chessData?.chess_rapid?.last?.rating ?? null) as MaybeNumber,
  };

  const lichessData = lichessRes?.data ?? null;
  const lichess = {
    bullet: (lichessData?.perfs?.bullet?.rating ?? null) as MaybeNumber,
    blitz: (lichessData?.perfs?.blitz?.rating ?? null) as MaybeNumber,
    rapid: (lichessData?.perfs?.rapid?.rating ?? null) as MaybeNumber,
  };

  const fideRaw = fideRes?.data ?? null;
  const { rating: fideRating, source: fideSource } = extractFideRating(fideRaw);

  // per-platform averages
  const chessRatings = Object.values(chessCom).filter(
    (r) => typeof r === "number" && !Number.isNaN(r)
  ) as number[];
  const lichessRatings = Object.values(lichess).filter(
    (r) => typeof r === "number" && !Number.isNaN(r)
  ) as number[];

  const chessAvg: MaybeNumber =
    chessRatings.length > 0
      ? chessRatings.reduce((a, b) => a + b, 0) / chessRatings.length
      : null;
  const lichessAvg: MaybeNumber =
    lichessRatings.length > 0
      ? lichessRatings.reduce((a, b) => a + b, 0) / lichessRatings.length
      : null;

  // weights: fide=3, chess.com=2, lichess=1
  const weightedAverage = computeWeightedAverage([
    { value: fideRating, weight: 3 },
    { value: chessAvg, weight: 2 },
    { value: lichessAvg, weight: 1 },
  ]);

  return {
    chessCom,
    lichess,
    fide: {
      fideId: fideId ?? null,
      rating: fideRating,
      source: fideSource,
      raw: fideRaw,
    },
    averages: {
      chessAvg,
      lichessAvg,
      fideRating,
      weightedAverage,
    },
  };
};

// Update user rating by fetching existing data, modifying it, and storing new blob
export const updateUserRating = async (req: Request, res: Response) => {
  const { userId, ratingChange, ratingType = "standard" } = req.body as {
    userId: string;
    ratingChange: number; // Positive or negative number
    ratingType?: string;
  };

  if (!userId || ratingChange === undefined) {
    return res.status(400).json({
      error: "userId and ratingChange are required",
    });
  }

  try {
    // Get user from database
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // If user has existing Walrus blob, fetch the current rating data
    let currentRatingData = null;
    if (user.walrus_blob_id) {
      try {
        const response = await axios.get(
          `${WALRUS_CONFIG.AGGREGATOR}/v1/blobs/by-quilt-patch-id/${user.walrus_blob_id}`
        );
        currentRatingData = response.data;
      } catch (error) {
        console.warn("Failed to fetch existing rating data from Walrus:", error);
        // Continue with fresh data if fetch fails
      }
    }

    // Get fresh rating data from platforms
    const freshRatingData = await getRatingData(
      user.username, // Assuming username is chess username
      user.username, // Assuming username is lichess username
      (user.metadata as any)?.fideId as string // Assuming fideId is stored in metadata
    );

    // Calculate new ratings by applying the change
    const updatedRatings = {
      chessCom: {
        bullet: freshRatingData.chessCom.bullet ? freshRatingData.chessCom.bullet + ratingChange : null,
        blitz: freshRatingData.chessCom.blitz ? freshRatingData.chessCom.blitz + ratingChange : null,
        rapid: freshRatingData.chessCom.rapid ? freshRatingData.chessCom.rapid + ratingChange : null,
      },
      lichess: {
        bullet: freshRatingData.lichess.bullet ? freshRatingData.lichess.bullet + ratingChange : null,
        blitz: freshRatingData.lichess.blitz ? freshRatingData.lichess.blitz + ratingChange : null,
        rapid: freshRatingData.lichess.rapid ? freshRatingData.lichess.rapid + ratingChange : null,
      },
      fide: {
        fideId: freshRatingData.fide.fideId,
        rating: freshRatingData.fide.rating ? freshRatingData.fide.rating + ratingChange : null,
        source: freshRatingData.fide.source,
        raw: freshRatingData.fide.raw,
      },
    };

    // Calculate new averages
    const chessRatings = Object.values(updatedRatings.chessCom).filter(
      (r) => typeof r === "number" && !Number.isNaN(r)
    ) as number[];
    const lichessRatings = Object.values(updatedRatings.lichess).filter(
      (r) => typeof r === "number" && !Number.isNaN(r)
    ) as number[];

    const chessAvg: MaybeNumber =
      chessRatings.length > 0
        ? chessRatings.reduce((a, b) => a + b, 0) / chessRatings.length
        : null;
    const lichessAvg: MaybeNumber =
      lichessRatings.length > 0
        ? lichessRatings.reduce((a, b) => a + b, 0) / lichessRatings.length
        : null;

    const fideRating = updatedRatings.fide.rating;

    // Calculate weighted average
    const weightedAverage = computeWeightedAverage([
      { value: fideRating, weight: 3 },
      { value: chessAvg, weight: 2 },
      { value: lichessAvg, weight: 1 },
    ]);

    const updatedAverages = {
      chessAvg,
      lichessAvg,
      fideRating,
      weightedAverage,
    };

    // Create updated rating data
    const updatedRatingData = {
      player: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        walletAddress: user.wallet_address,
        ensName: user.ens_name,
      },
      ratings: {
        chessCom: updatedRatings.chessCom,
        lichess: updatedRatings.lichess,
        fide: updatedRatings.fide,
        averages: updatedAverages,
      },
      previousData: currentRatingData,
      ratingChange,
      timestamp: new Date().toISOString(),
    };

    // Store updated data in Walrus
    const formData = new FormData();
    
    formData.append('player-rating', JSON.stringify(updatedRatingData), {
      filename: 'player-rating.json',
      contentType: 'application/json'
    });
    
    formData.append('chess-com-avg', JSON.stringify(updatedAverages.chessAvg), {
      filename: 'chess-com-avg.json',
      contentType: 'application/json'
    });
    
    formData.append('lichess-avg', JSON.stringify(updatedAverages.lichessAvg), {
      filename: 'lichess-avg.json',
      contentType: 'application/json'
    });
    
    formData.append('fide-rating', JSON.stringify(updatedAverages.fideRating), {
      filename: 'fide-rating.json',
      contentType: 'application/json'
    });

    // Add metadata
    const metadata = [
      {
        identifier: "player-rating",
        tags: {
          type: "chess-ratings",
          component: "complete-data",
          platform: "multi-platform",
          timestamp: new Date().toISOString(),
          ratingChange,
          userId: user.id
        }
      },
      {
        identifier: "chess-com-avg",
        tags: {
          type: "chess-ratings",
          component: "chess-com-average",
          platform: "chess.com",
          ratingChange
        }
      },
      {
        identifier: "lichess-avg",
        tags: {
          type: "chess-ratings",
          component: "lichess-average",
          platform: "lichess",
          ratingChange
        }
      },
      {
        identifier: "fide-rating",
        tags: {
          type: "chess-ratings",
          component: "fide-rating",
          platform: "fide",
          ratingChange
        }
      }
    ];

    formData.append('_metadata', JSON.stringify(metadata));

    // Store in Walrus with deletable=true
    const walrusResponse = await axios.put(
      `${WALRUS_CONFIG.PUBLISHER}/v1/quilts?epochs=${WALRUS_CONFIG.EPOCHS}&deletable=true`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    const walrusData: WalrusResponse = walrusResponse.data;
    const newBlobId = walrusData.storedQuiltBlobs[0]?.quiltPatchId;

    // Update user in database with new blob ID and rating
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        walrus_blob_id: newBlobId,
        rating_cached: Math.round(weightedAverage || user.rating_cached + ratingChange),
        rating_type_cached: ratingType,
        rating_cached_updated_at: new Date(),
      },
    });

    // Add to ratings history
    await prisma.ratings_history.create({
      data: {
        user_id: userId,
        rating_type: ratingType,
        rating: Math.round(weightedAverage || user.rating_cached + ratingChange),
        source: "walrus-update",
        metadata: {
          ratingChange,
          previousBlobId: user.walrus_blob_id,
          newBlobId,
          walrusResponse: walrusData as any,
        },
      },
    });

    return res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        rating_cached: updatedUser.rating_cached,
        rating_type_cached: updatedUser.rating_type_cached,
        walrus_blob_id: updatedUser.walrus_blob_id,
      },
      ratingChange,
      newRating: updatedUser.rating_cached,
      walrus: walrusData,
      quiltPatchIds: walrusData.storedQuiltBlobs,
    });

  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to update user rating",
      details: error?.message ?? String(error),
    });
  }
};

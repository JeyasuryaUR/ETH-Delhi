import axios from "axios";
import { Request, Response } from "express";

type MaybeNumber = number | null;

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

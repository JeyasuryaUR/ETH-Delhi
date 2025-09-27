import express from "express";
import { 
  getChessDotComRating, 
  storeRatingInWalrus, 
  getRatingFromWalrus,
  updateUserRating
} from "../controllers/ratingController";

const ratingRouter = express.Router();

// Get rating data from chess platforms
ratingRouter.post("/getRating", getChessDotComRating);

// Store rating data in Walrus
ratingRouter.post("/store", storeRatingInWalrus);

// Retrieve rating data from Walrus
ratingRouter.get("/retrieve/:quiltPatchId", getRatingFromWalrus);

// Update user rating (fetch, modify, store new blob)
ratingRouter.post("/update", updateUserRating);

export default ratingRouter;

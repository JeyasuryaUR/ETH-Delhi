import express from "express";
import { getChessDotComRating } from "../controllers/ratingController";

const ratingRouter = express.Router();

ratingRouter.post("/getRating", getChessDotComRating);

export default ratingRouter;

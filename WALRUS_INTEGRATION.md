# Walrus Integration for Chess Ratings

This document describes the integration of Walrus platform for storing and retrieving chess rating data.

## Overview

The Walrus integration allows you to:
- Store chess rating data from multiple platforms (Chess.com, Lichess, FIDE) in Walrus
- Retrieve stored rating data using quilt patch IDs
- Maintain data integrity and availability across epochs

## API Endpoints

### 1. Store Rating Data in Walrus
**POST** `/api/ratings/store`

Stores chess rating data in Walrus platform.

**Request Body:**
```json
{
  "chessUsername": "magnuscarlsen",
  "lichessUsername": "DrNykterstein", 
  "fideId": "1503014"
}
```

**Response:**
```json
{
  "success": true,
  "walrus": {
    "blobStoreResult": {
      "newlyCreated": {
        "blobObject": {
          "id": "0xe6ac1e1ac08a603aef73a34328b0b623ffba6be6586e159a1d79c5ef0357bc02",
          "registeredEpoch": 103,
          "blobId": "6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKo",
          "size": 1782224,
          "encodingType": "RS2",
          "certifiedEpoch": null,
          "storage": {
            "id": "0xbc8ff9b4071927689d59468f887f94a4a503d9c6c5ef4c4d97fcb475a257758f",
            "startEpoch": 103,
            "endEpoch": 104,
            "storageSize": 72040000
          },
          "deletable": false
        },
        "resourceOperation": {
          "registerFromScratch": {
            "encodedLength": 72040000,
            "epochsAhead": 1
          }
        },
        "cost": 12075000
      }
    },
    "storedQuiltBlobs": [
      {
        "identifier": "player-rating",
        "quiltPatchId": "6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKoBAQDQAA"
      },
      {
        "identifier": "chess-com-avg",
        "quiltPatchId": "6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKoB0AB7Ag"
      },
      {
        "identifier": "lichess-avg", 
        "quiltPatchId": "6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKoB0AB7Ah"
      },
      {
        "identifier": "fide-rating",
        "quiltPatchId": "6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKoB0AB7Ai"
      }
    ]
  },
  "ratingData": {
    "player": {
      "chessUsername": "magnuscarlsen",
      "lichessUsername": "DrNykterstein",
      "fideId": "1503014"
    },
    "ratings": {
      "chessCom": {
        "bullet": 2850,
        "blitz": 2900,
        "rapid": 2950
      },
      "lichess": {
        "bullet": 2800,
        "blitz": 2850,
        "rapid": 2900
      },
      "fide": {
        "fideId": "1503014",
        "rating": 2850,
        "source": "classical",
        "raw": {...}
      },
      "averages": {
        "chessAvg": 2900,
        "lichessAvg": 2850,
        "fideRating": 2850,
        "weightedAverage": 2866.67
      }
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "quiltPatchIds": [...]
}
```

### 2. Retrieve Rating Data from Walrus
**GET** `/api/ratings/retrieve/:quiltPatchId`

Retrieves stored rating data from Walrus using a quilt patch ID.

**Parameters:**
- `quiltPatchId` (string): The quilt patch ID returned from the store operation

**Response:**
```json
{
  "success": true,
  "data": "stored_data_content"
}
```

### 3. Update User Rating
**POST** `/api/ratings/update`

Updates a user's rating by fetching existing data, applying a change, and storing a new blob in Walrus.

**Request Body:**
```json
{
  "userId": "user-uuid-here",
  "ratingChange": 50,
  "ratingType": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid-here",
    "username": "magnuscarlsen",
    "rating_cached": 2916,
    "rating_type_cached": "standard",
    "walrus_blob_id": "6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKoBAQDQAB"
  },
  "ratingChange": 50,
  "newRating": 2916,
  "walrus": {
    "blobStoreResult": {...},
    "storedQuiltBlobs": [...]
  },
  "quiltPatchIds": [...]
}
```

### 4. Get Rating Data (Without Storing)
**POST** `/api/ratings/getRating`

Gets chess rating data from platforms without storing in Walrus.

**Request Body:**
```json
{
  "chessUsername": "magnuscarlsen",
  "lichessUsername": "DrNykterstein",
  "fideId": "1503014"
}
```

**Response:**
```json
{
  "chessCom": {
    "bullet": 2850,
    "blitz": 2900,
    "rapid": 2950
  },
  "lichess": {
    "bullet": 2800,
    "blitz": 2850,
    "rapid": 2900
  },
  "fide": {
    "fideId": "1503014",
    "rating": 2850,
    "source": "classical",
    "raw": {...}
  },
  "averages": {
    "chessAvg": 2900,
    "lichessAvg": 2850,
    "fideRating": 2850,
    "weightedAverage": 2866.67
  }
}
```

## Data Structure

The system stores four separate data components in Walrus:

1. **player-rating**: Complete rating data with player information
2. **chess-com-avg**: Chess.com average rating
3. **lichess-avg**: Lichess average rating  
4. **fide-rating**: FIDE rating

Each component is stored with appropriate metadata tags for easy identification and retrieval.

## Rating Update System

The update system works as follows:

1. **Fetch existing data**: Retrieves current rating data from Walrus (if available)
2. **Get fresh data**: Fetches latest ratings from chess platforms
3. **Apply changes**: Modifies ratings by the specified amount (+x or -x)
4. **Store new blob**: Creates a new deletable blob in Walrus with updated data
5. **Update database**: Replaces the old blob ID with the new one in the user record
6. **Track history**: Records the rating change in the ratings_history table

### Key Features:
- **Deletable blobs**: All stored data uses `deletable=true` for easy cleanup
- **Blob replacement**: Old blob IDs are replaced with new ones automatically
- **Rating history**: All changes are tracked in the database
- **Weighted calculation**: Uses the same weighted average system (FIDE=3, Chess.com=2, Lichess=1)

## Configuration

The Walrus integration uses the following environment variables:

```bash
WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
```

Default values are used if these are not set.

## Testing

Run the test script to verify the integration:

```bash
# Start the server
npm run dev

# In another terminal, run the test
node test-walrus-integration.js
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Bad Request (missing required parameters)
- `500`: Internal Server Error (API failures, network issues)

## Dependencies

- `axios`: HTTP client for API calls
- `form-data`: For multipart form data uploads to Walrus

## Notes

- The system uses a weighted average calculation: FIDE=3, Chess.com=2, Lichess=1
- Data is stored for 5 epochs by default
- All timestamps are in ISO 8601 format
- The integration handles missing or invalid rating data gracefully

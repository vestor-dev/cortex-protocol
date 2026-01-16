const { Router } = require("express");
const { body, param, query } = require("express-validator");
const validate = require("../middleware/validate");

const router = Router();

// In-memory stream index (replace with DB)
const streamsIndex = new Map();

/**
 * GET /api/v1/streams
 * List payment streams, optionally filtering by sender or recipient.
 */
router.get(
  "/",
  [
    query("sender").optional().isString().isLength({ min: 56, max: 56 }),
    query("recipient").optional().isString().isLength({ min: 56, max: 56 }),
    query("status").optional().isIn(["Active", "Paused", "Completed", "Cancelled"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  (req, res) => {
    const { sender, recipient, status, page = "1", limit = "20" } = req.query;
    let results = Array.from(streamsIndex.values());

    if (sender) results = results.filter((s) => s.sender === sender);
    if (recipient) results = results.filter((s) => s.recipient === recipient);
    if (status) results = results.filter((s) => s.status === status);

    const total = results.length;
    const offset = (Number(page) - 1) * Number(limit);
    const paginated = results.slice(offset, offset + Number(limit));

    res.json({
      data: paginated,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  }
);

/**
 * GET /api/v1/streams/:id
 */
router.get(
  "/:id",
  [param("id").isInt({ min: 1 })],
  validate,
  (req, res) => {
    const stream = streamsIndex.get(req.params.id);
    if (!stream) {
      return res.status(404).json({ error: "Stream not found" });
    }
    res.json(stream);
  }
);

/**
 * POST /api/v1/streams
 * Index a stream after on-chain creation.
 */
router.post(
  "/",
  [
    body("id").isInt({ min: 1 }),
    body("sender").isString().isLength({ min: 56, max: 56 }),
    body("recipient").isString().isLength({ min: 56, max: 56 }),
    body("token").isString(),
    body("deposit").isInt({ min: 1 }),
    body("ratePerSecond").isInt({ min: 1 }),
    body("startTime").isInt({ min: 0 }),
    body("endTime").isInt({ min: 0 }),
  ],
  validate,
  (req, res) => {
    const stream = {
      ...req.body,
      status: "Active",
      withdrawn: 0,
      indexedAt: Date.now(),
    };
    streamsIndex.set(String(stream.id), stream);
    res.status(201).json(stream);
  }
);

module.exports = router;

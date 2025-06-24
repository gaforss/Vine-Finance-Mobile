const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const Account = require('../models/account'); // Adjust path if needed

// GET /api/accounts - return accounts as JSON for the authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const accounts = await Account.find({user: req.user._id});
    res.json(accounts);
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch accounts'});
  }
});

module.exports = router;

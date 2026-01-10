import express from "express";
import axios from "axios";

const router = express.Router();
const GAMMA_API =
  process.env.GAMMA_API_URL || "https://gamma-api.polymarket.com";

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${GAMMA_API}/markets`, {
      params: { limit: 100 },
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const response = await axios.get(`${GAMMA_API}/markets/${req.params.id}`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

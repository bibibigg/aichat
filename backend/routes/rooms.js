const express = require("express");
const router = express.Router();
const pool = require("../db");

// 채팅방 목록 조회
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name FROM chat_rooms");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 채팅방 생성
router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "채팅방 이름이 필요합니다." });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO chat_rooms (name) VALUES (?)",
      [name]
    );
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

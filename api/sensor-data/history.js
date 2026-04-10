module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const deviceId = req.query?.deviceId;
  const limit = Number(req.query?.limit || 24);

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId is required" });
  }

  return res.status(200).json({
    data: [],
    limit: Number.isNaN(limit) ? 24 : limit,
    timestamp: new Date().toISOString(),
    message: "No historical sensor data available yet.",
  });
};

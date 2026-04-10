module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.status(200).json({
    name: "Asset Manager API",
    version: "1.0.0",
    endpoints: [
      "/api/healthz",
      "/api/sensor-data",
      "/api/sensor-data/history",
    ],
  });
};

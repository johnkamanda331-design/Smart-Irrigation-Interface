const jsonBody = (req) => {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  return null;
};

module.exports = (req, res) => {
  if (req.method === "GET") {
    const deviceId = req.query?.deviceId;

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    return res.status(200).json({
      data: null,
      timestamp: new Date().toISOString(),
      message: "No live sensor data available yet.",
    });
  }

  if (req.method === "POST") {
    const body = jsonBody(req);

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const { deviceId, moisture, temperature, timestamp } = body;

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    return res.status(201).json({
      message: "Sensor data received",
      data: { deviceId, moisture, temperature, timestamp: timestamp ?? new Date().toISOString() },
    });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};

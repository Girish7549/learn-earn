const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/database");
connectDB();

const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const bundleRoutes = require("./routes/bundles");
const purchaseRoutes = require("./routes/purchase");
const webhookRoutes = require("./routes/webhooks");
const dashboardRoutes = require("./routes/dashboard");

const rawBodyMiddleware = require("./middlewares/rawBodyMiddleware");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Razorpay webhook requires raw body; route uses raw middleware
app.use("/api/webhooks/razorpay", rawBodyMiddleware);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/bundles", bundleRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health
app.get("/", (req, res) => {
  res.status(200).send(`
    <html>
      <head><title>Server Status</title></head>
      <body>
        <h1>Listening at port ${process.env.PORT}</h1>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

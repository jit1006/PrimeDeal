import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./routes/user.route";
import shopRoute from "./routes/shop.route";
import productRoute from "./routes/product.route";
import addressRoute from "./routes/address.route";
import path from "path";
import { errorHandler } from "./middlewares/errorHandler";
import orderRoute from "./routes/order.route";

const app = express();
const PORT = process.env.PORT || 3000;

const DIRNAME = path.resolve();

// default middlewares
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json());
app.use(cookieParser());
const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

//api
app.use("/api/v1/user", userRoute);
app.use("/api/v1/shop", shopRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/address", addressRoute);
app.use("/api/v1/order", orderRoute);

app.use(express.static(path.join(DIRNAME, "/client/dist")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  const indexPath = path.resolve(DIRNAME, "client", "dist", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

app.use(errorHandler as any);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

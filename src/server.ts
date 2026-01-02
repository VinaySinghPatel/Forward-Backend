import http from "http";
import app from "./app.js";
import { initSocket } from "./socket/index.js";
import { connectDB} from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();
connectDB();

const server = http.createServer(app);
// Initialize Socket
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Congrats Forward is Now Running oN Port ${PORT}`);
});

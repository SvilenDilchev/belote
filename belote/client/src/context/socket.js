import io from "socket.io-client";
import { createContext } from "react";

// Use environment variable or default to production API
const SERVER_URL =
  process.env.REACT_APP_API_URL || "https://belote-api.svilen.dev";

// Create socket connection
export const socket = io.connect(SERVER_URL);

// Create context for socket
export const SocketContext = createContext(socket);

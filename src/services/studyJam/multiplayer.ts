// src/services/studyJam/multiplayer.ts
import { NetworkInfo } from "react-native-network-info";
import TcpSocket from "react-native-tcp-socket";

let server: TcpSocket.Server | null = null;
let client: TcpSocket.Socket | null = null;
let connectedClients: TcpSocket.Socket[] = [];

// --- HOST FUNCTIONS ---

export async function startHostServer(
  onClientJoin: (name: string) => void,
  onClientAnswer: (score: number) => void,
) {
  const ip = await NetworkInfo.getIPV4Address();
  if (!ip) throw new Error("Please connect to Wi-Fi or turn on Hotspot");

  // The "Join Code" is the last block of the IP (e.g., 192.168.43.105 -> 105)
  const joinCode = ip.split(".").pop();

  server = TcpSocket.createServer((socket) => {
    connectedClients.replace(socket);

    socket.on("data", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "JOIN") onClientJoin(message.name);
      if (message.type === "ANSWER_UPDATE") onClientAnswer(message.score);
    });

    socket.on("error", (error) => console.log("Socket error:", error));
    socket.on("close", () => {
      connectedClients = connectedClients.filter((c) => c !== socket);
    });
  }).listen({ port: 12345, host: "0.0.0.0" });

  return { ip, joinCode };
}

export function broadcastQuizStart() {
  connectedClients.forEach((socket) => {
    socket.write(JSON.stringify({ type: "START_QUIZ" }));
  });
}

export function stopHostServer() {
  if (server) {
    server.close();
    server = null;
    connectedClients = [];
  }
}

// --- CLIENT FUNCTIONS ---

export async function joinStudyJam(
  hostJoinCode: string,
  myName: string,
  onStartQuiz: () => void,
) {
  // Construct the Host IP. Mobile hotspots usually use 192.168.43.x or 172.20.10.x.
  // You might need to scan subnets, but for a simple implementation, assume standard Android hotspot subnet:
  const hostIp = `192.168.43.${hostJoinCode}`;

  return new Promise((resolve, reject) => {
    client = TcpSocket.createConnection({ port: 12345, host: hostIp }, () => {
      // Successfully connected! Tell the host our name.
      client?.write(JSON.stringify({ type: "JOIN", name: myName }));
      resolve(true);
    });

    client.on("data", (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "START_QUIZ") onStartQuiz();
    });

    client.on("error", (error) => reject(error));
  });
}

export function sendAnswerUpdate(score: number) {
  if (client) {
    client.write(JSON.stringify({ type: "ANSWER_UPDATE", score }));
  }
}

export function disconnectClient() {
  if (client) {
    client.destroy();
    client = null;
  }
}

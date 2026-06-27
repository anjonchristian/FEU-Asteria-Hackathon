import * as Network from "expo-network";
import TcpSocket from "react-native-tcp-socket";
import dgram from "react-native-udp";
import { create } from "zustand";

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
};

export type DiscoveredHost = {
  ip: string;
  name: string;
};

interface StudyJamState {
  hostIp: string | null;
  me: Player | null;
  players: Player[];

  status: "idle" | "hosting" | "connecting" | "waiting" | "playing";

  error: string | null;

  discoveredHosts: DiscoveredHost[];

  server: any | null;
  client: any | null;

  connectedClients: any[];

  broadcastSocket: any | null;
  discoverySocket: any | null;

  broadcastInterval: ReturnType<typeof setInterval> | null;

  hostRoom: (name: string) => Promise<void>;
  joinRoom: (ip: string, name: string) => void;

  startDiscovery: () => void;
  stopDiscovery: () => void;

  leaveRoom: () => void;

  startGame: () => void;

  broadcastState: () => void;
}

const TCP_PORT = 12345;
const UDP_PORT = 41234;

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useMultiplayerStore = create<StudyJamState>((set, get) => ({
  hostIp: null,
  me: null,
  players: [],

  status: "idle",
  error: null,

  discoveredHosts: [],

  server: null,
  client: null,

  connectedClients: [],

  broadcastSocket: null,
  discoverySocket: null,

  broadcastInterval: null,

  // ==========================
  // HOST
  // ==========================

  hostRoom: async (hostName) => {
    try {
      get().leaveRoom();

      const ip = await Network.getIpAddressAsync();

      const me: Player = {
        id: generateId(),
        name: hostName,
        isHost: true,
      };

      const server = TcpSocket.createServer((socket) => {
        set((state) => ({
          connectedClients: [...state.connectedClients, socket],
        }));

        socket.on("data", (data) => {
          try {
            const msg = JSON.parse(data.toString());

            if (msg.type === "JOIN") {
              set((state) => ({
                players: [...state.players, msg.player],
              }));

              get().broadcastState();
            }
          } catch (e) {
            console.log("TCP parse error", e);
          }
        });

        socket.on("close", () => {
          set((state) => ({
            connectedClients: state.connectedClients.filter(
              (c) => c !== socket,
            ),
          }));
        });

        socket.on("error", (e) => console.log("TCP error", e));
      }).listen({
        port: TCP_PORT,
        host: "0.0.0.0",
      });

      // ==========================
      // UDP BROADCAST FIX
      // ==========================

      const udp = dgram.createSocket({
        type: "udp4",
      });

      // error listener MUST exist before bind
      (udp as any).on("error", (err: any) => {
        console.log("UDP error", err?.message);
      });

      // set socket immediately
      set({
        hostIp: ip,
        me,
        players: [me],
        status: "waiting",
        server,
        broadcastSocket: udp,
        error: null,
      });

      udp.bind(0, () => {
        // socket was replaced/closed
        if (get().broadcastSocket !== udp) {
          try {
            udp.close();
          } catch {}

          return;
        }

        try {
          (udp as any).setBroadcast(true);
        } catch (e) {
          console.log("UDP broadcast setup failed", e);
          return;
        }

        const interval = setInterval(() => {
          if (get().broadcastSocket !== udp) {
            clearInterval(interval);
            return;
          }

          try {
            const msg = `STUDYJAM_HOST:${hostName}`;

            udp.send(
              msg,
              0,
              msg.length,
              UDP_PORT,
              "255.255.255.255",
              (err: any) => {
                if (err) {
                  console.log("UDP send error", err.message);
                }
              },
            );
          } catch {
            console.log("UDP socket closed");

            clearInterval(interval);
          }
        }, 2000);

        set({
          broadcastInterval: interval,
        });
      });
    } catch (e) {
      set({
        error: "Could not host room",
        status: "idle",
      });
    }
  },

  // ==========================
  // JOIN
  // ==========================

  joinRoom: (ip, name) => {
    set({
      status: "connecting",
      error: null,
    });

    get().stopDiscovery();

    const me: Player = {
      id: generateId(),
      name,
      isHost: false,
    };

    const client = TcpSocket.createConnection(
      {
        port: TCP_PORT,
        host: ip,
      },

      () => {
        client.write(
          JSON.stringify({
            type: "JOIN",
            player: me,
          }),
        );
      },
    );

    client.on("data", (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "SYNC") {
          set({
            hostIp: ip,
            me,
            players: msg.players,
            status: msg.status,
            client,
          });
        }
      } catch (e) {
        console.log("SYNC error", e);
      }
    });

    client.on("error", () => {
      set({
        error: "Connection failed",
        status: "idle",
      });
    });

    client.on("close", () => {
      set({
        client: null,
        hostIp: null,
        status: "idle",
      });
    });
  },

  // ==========================
  // DISCOVERY
  // ==========================

  startDiscovery: () => {
    get().stopDiscovery();

    const udp = dgram.createSocket({
      type: "udp4",
    });

    (udp as any).on("error", (err: any) => {
      console.log("Discovery UDP error", err?.message);
    });

    udp.bind(UDP_PORT, () => {
      (udp as any).on("message", (msg: any, rinfo: any) => {
        const text = msg.toString();

        if (text.startsWith("STUDYJAM_HOST:")) {
          const host = {
            ip: rinfo.address,
            name: text.replace("STUDYJAM_HOST:", ""),
          };

          set((state) => {
            if (state.discoveredHosts.some((h) => h.ip === host.ip)) {
              return state;
            }

            return {
              discoveredHosts: [...state.discoveredHosts, host],
            };
          });
        }
      });
    });

    set({
      discoverySocket: udp,
      discoveredHosts: [],
    });
  },

  stopDiscovery: () => {
    const socket = get().discoverySocket;

    try {
      if (socket) {
        socket.removeAllListeners?.();

        setTimeout(() => {
          try {
            socket.close();
          } catch {}
        }, 50);
      }
    } catch {}

    set({
      discoverySocket: null,
    });
  },

  // ==========================
  // STATE SYNC
  // ==========================

  broadcastState: () => {
    const { connectedClients, players, status } = get();

    const payload = JSON.stringify({
      type: "SYNC",
      players,
      status,
    });

    connectedClients.forEach((c) => {
      try {
        c.write(payload);
      } catch {}
    });
  },

  startGame: () => {
    set({
      status: "playing",
    });

    get().broadcastState();
  },

  // ==========================
  // CLEANUP
  // ==========================

  leaveRoom: () => {
    const {
      server,
      client,
      connectedClients,
      broadcastSocket,
      discoverySocket,
      broadcastInterval,
    } = get();

    if (broadcastInterval) {
      clearInterval(broadcastInterval);
    }

    try {
      client?.destroy();
    } catch {}

    connectedClients.forEach((c) => {
      try {
        c.destroy();
      } catch {}
    });

    try {
      server?.close();
    } catch {}

    try {
      broadcastSocket?.removeAllListeners?.();

      broadcastSocket?.close?.();
    } catch {}

    try {
      discoverySocket?.removeAllListeners?.();

      discoverySocket?.close?.();
    } catch {}

    set({
      hostIp: null,
      me: null,
      players: [],
      status: "idle",
      error: null,

      server: null,
      client: null,

      connectedClients: [],

      broadcastSocket: null,
      discoverySocket: null,

      broadcastInterval: null,

      discoveredHosts: [],
    });
  },
}));

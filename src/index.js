const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 7557 });
const rateLimit = new Map();
const limit = 1000;
const banIpList = []; // Example banned IPs

server.on("connection", (socket) => {
  socket.on("message", (message) => {
    // console.log('Received:', message);
    // Broadcast the message to all connected clients
    const ip = socket._socket.remoteAddress;
    if (banIpList.includes(ip)) {
      // console.log(`IP ${ip} is banned.`);
      socket.close();
      return;
    }

    const currentTime = Date.now();
    if (rateLimit.has(ip)) {
      const { lastMessageTime, messageCount } = rateLimit.get(ip);
      if (currentTime - lastMessageTime < limit) {
        // 1 second rate limit
        if (messageCount >= 5) {
          // Max 5 messages per second
          // console.log(`Rate limit exceeded for IP ${ip}`);
          if (messageCount >= 15) {
            // Auto ban after 15 attempts
            banIpList.push(ip);
            // console.log(`IP ${ip} has been banned.`);
          }
          socket.close();
          return;
        }
        rateLimit.set(ip, { lastMessageTime, messageCount: messageCount + 1 });
      } else {
        rateLimit.set(ip, { lastMessageTime: currentTime, messageCount: 1 });
      }
    } else {
      rateLimit.set(ip, { lastMessageTime: currentTime, messageCount: 1 });
    }

    server.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  socket.on("close", () => {
    // console.log('Client disconnected');
  });

  socket.on("error", (error) => {
    // console.error('WebSocket error:', error);
  });
});

const { server, socketServer } = require('./serverConfig');

require('dotenv').config();

const PORT = 3001
server.listen(PORT, process.env.BASE_URL, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Emit event using io
socketServer.on('connection', (socket) => {
  console.log('Socket connected');

  // 
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Server joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
});

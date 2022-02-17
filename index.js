const express = require('express');
const connectDB = require('./server/config/db');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

const userRoutes = require('./server/routes/userRoutes');
const chatRoutes = require('./server/routes/chatRoutes');
const messageRoutes = require('./server/routes/messageRoutes');
const { notFound, errorHandler } = require('./server/middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();
app.use(cors());

app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname1, '/frontend/build')));

  app.get('*', (_, res) => res.sendFile(path.resolve(__dirname1, 'frontend', 'build', 'index.html')));
} else {
  app.get('/', (_, res) => {
    res.send('API is running');
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running on PORT ${PORT}...`.yellow.bold));

const io = require('socket.io')(server, {
  pingTimeout: 60000,
  cors: {
    origin: 'http://localhost:3000',
  },
});

io.on('connection', (socket) => {
  console.log('Connected to socket.io');

  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log('User joined room: ' + room);
  });
  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageReceived) => {
    let chat = newMessageReceived.chat;

    if (!chat.users) return console.log('chat.users not defined');

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;

      socket.in(user._id).emit('message received', newMessageReceived);
    });
  });

  socket.off('setup', () => {
    console.log('User disconnected');
    socket.leave(userData._id);
  });
});

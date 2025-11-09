// server/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Allow frontend on http://localhost:3000 to connect. If your client uses another port, update it.
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json()); // parse JSON bodies

// small friendly root route so browser doesn't show "Cannot GET /"
app.get('/', (req, res) => {
  res.send('Chat server is running. Use the React client at http://localhost:3000');
});

// --- Simple REST endpoint to get last 100 messages ---
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// If you want to serve the React build from Express (production), uncomment:
// app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
// });

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

// Socket.IO events
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  socket.on('send-message', async (payload) => {
    // payload should be { user: 'name', text: 'hello' }
    try {
      if (!payload || !payload.text || !payload.user) return;

      // Save to DB
      const message = new Message({ user: payload.user, text: payload.text });
      await message.save();

      // log for you to see saved messages in server console
      console.log('Saved message:', message.text, 'by', message.user);

      // Broadcast message to all clients
      io.emit('new-message', message); // clients listen for 'new-message'
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// start server
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

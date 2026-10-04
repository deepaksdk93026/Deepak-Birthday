const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize wishes file if it doesn't exist
const wishesFilePath = path.join(__dirname, 'wishes.json');
if (!fs.existsSync(wishesFilePath)) {
  fs.writeFileSync(wishesFilePath, JSON.stringify([], null, 2));
}

// GET /api/wishes - Get all wishes
app.get('/api/wishes', (req, res) => {
  try {
    const wishes = JSON.parse(fs.readFileSync(wishesFilePath, 'utf8'));
    res.json(wishes);
  } catch (error) {
    console.error('Error reading wishes:', error);
    res.status(500).json({ error: 'Failed to read wishes' });
  }
});

// POST /api/wishes - Add a new wish
app.post('/api/wishes', (req, res) => {
  try {
    const { name, message } = req.body;
    
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }
    
    const wishes = JSON.parse(fs.readFileSync(wishesFilePath, 'utf8'));
    
    const newWish = {
      id: Date.now(),
      name,
      message,
      timestamp: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };
    
    wishes.push(newWish);
    
    // Sort wishes by timestamp (newest first)
    wishes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    fs.writeFileSync(wishesFilePath, JSON.stringify(wishes, null, 2));
    
    res.status(201).json(newWish);
  } catch (error) {
    console.error('Error adding wish:', error);
    res.status(500).json({ error: 'Failed to add wish' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Birthday Wishes Server running on http://localhost:${PORT}`);
  console.log(`📁 Wishes stored in wishes.json`);
});
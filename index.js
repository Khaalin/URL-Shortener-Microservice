require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');
const Url = require('./model/url');
const cors = require('cors');

const app = express();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors()); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(express.static('public'));


app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;
  
  try {
    const urlObject = new URL(url);
    
    dns.lookup(urlObject.hostname, async (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      let urlDoc = await Url.findOne({ original_url: url });
      
      if (!urlDoc) {
        const count = await Url.countDocuments();
        urlDoc = await Url.create({
          original_url: url,
          short_url: count + 1
        });
      }

      res.json({
        original_url: urlDoc.original_url,
        short_url: urlDoc.short_url
      });
    });
  } catch (err) {
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;

  try {
    const urlDoc = await Url.findOne({ short_url: parseInt(short_url) });
    
    if (!urlDoc) {
      return res.json({ error: 'No short URL found' });
    }

    res.redirect(urlDoc.original_url);
  } catch (err) {
    res.json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
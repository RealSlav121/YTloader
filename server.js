const express = require('express');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const app = express();

// Serve static files from 'public' (if needed)
app.use(express.static('public'));

// Test endpoint
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Download endpoint
app.get('/download', async (req, res) => {
  const url = req.query.url;
  const format = req.query.format;

  if (!url || !format) {
    return res.status(400).send('Missing URL or format');
  }

  // Clean URL of extras
  const cleanUrl = url.replace(
    /&list=.*|&start_radio=.*|&t=.*|&index=.*|&ab_channel=.*|&pp=.*|&feature=.*$/,
    ''
  );

  // Default title
  let title = 'video';
  try {
    const info = await ytdlp(cleanUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      cookies: path.join(__dirname, 'cookies.txt'),
    });
    if (info.title) {
      title = info.title.replace(/[^\w\s\u0400-\u04FF]/gi, '');
    }
  } catch (err) {
    console.warn('Title fetch failed, using fallback:', err.message);
  }

  const filename = `${title}-${Date.now()}.${format}`;
  const filepath = path.join(__dirname, filename);

  // Download options
  const downloadArgs = {
    output: filepath,
    noCheckCertificates: true,
    cookies: path.join(__dirname, 'cookies.txt'),
  };

  if (format === 'mp4') {
    downloadArgs.format = 'bv*[vcodec*=avc1]+ba[acodec*=mp4a]/mp4';
    downloadArgs.mergeOutputFormat = 'mp4';
  } else if (format === 'mp3') {
    downloadArgs.extractAudio = true;
    downloadArgs.audioFormat = 'mp3';
    downloadArgs.embedMetadata = true;
  } else {
    return res.status(400).send('Invalid format. Use mp4 or mp3.');
  }

  try {
    await ytdlp(cleanUrl, downloadArgs);

    // Send file to client
    res.download(filepath, `${title}.${format}`, (err) => {
      if (err) {
        console.error('Download send error:', err);
        res.status(500).send('Error sending file');
      }

      // Clean up file after sending
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).send('Download failed. Check logs.');
  }
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

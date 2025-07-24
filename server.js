const express = require('express');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const app = express();

// Serve static files from 'public'
app.use(express.static('public'));

// Health check
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

  // Clean the URL
  const cleanUrl = url.replace(
    /&list=.*|&start_radio=.*|&t=.*|&index=.*|&ab_channel=.*|&pp=.*|&feature=.*$/,
    ''
  );

  // Determine title
  let title = 'video';
  try {
    const info = await ytdlp(cleanUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true
    });
    if (info.title) {
      title = info.title.replace(/[^\w\s\u0400-\u04FF]/gi, '');
    }
  } catch (err) {
    console.warn('Title fetch failed, using fallback:', err.message);
  }

  // Prepare file paths
  const filename = `${title}-${Date.now()}.${format}`;
  const filepath = path.join(__dirname, filename);

  // Set download args
  const downloadArgs = { output: filepath, noCheckCertificates: true };
  if (format === 'mp4') {
    downloadArgs.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4';
    downloadArgs.mergeOutputFormat = 'mp4';
  } else if (format === 'mp3') {
    downloadArgs.extractAudio = true;
    downloadArgs.audioFormat = 'mp3';
    downloadArgs.embedMetadata = true;
  } else {
    return res.status(400).send('Invalid format. Use mp4 or mp3.');
  }

  // Download and send
  try {
    await ytdlp(cleanUrl, downloadArgs);
    res.download(filepath, `${title}.${format}`, (err) => {
      if (err) {
        console.error('Send error:', err);
        res.status(500).send('Error sending file');
      }
      fs.unlink(filepath, () => {});
    });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Download failed');
  }
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

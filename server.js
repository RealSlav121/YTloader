const express = require('express');
const ytdlp = require('yt-dlp-exec').default;
const fs = require('fs');
const path = require('path');
const app = express();

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Test route to verify server is working
app.get('/test', (req, res) => {
    res.send('Server is working!');
});

// Download route for MP4 or MP3
app.get('/download', async (req, res) => {
    const url = req.query.url;
    const format = req.query.format;

    console.log(`Received download request: URL=${url}, Format=${format}`);

    if (!url || !format) {
        console.error('Missing URL or format');
        return res.status(400).send('Missing URL or format');
    }

    try {
        // Clean URL to remove playlist and other noise
        const cleanUrl = url.replace(/&list=.*|&start_radio=.*|&t=.*|&index=.*|&ab_channel=.*|&pp=.*|&feature=.*$/, '');
        console.log('Cleaned URL:', cleanUrl);

        // Get video metadata to extract title
        let title = 'video';
        try {
            const info = await ytdlp(cleanUrl, {
                dumpSingleJson: true,
                noCheckCertificates: true
            });
            title = info.title ? info.title.replace(/[^\w\s\u0400-\u04FF]/gi, '') : 'video';
        } catch (err) {
            console.warn('Could not fetch title. Using fallback.', err.message);
        }

        const filename = `${title}-${Date.now()}.${format}`;
        const filepath = path.join(__dirname, filename);

        // Download video or audio
        const downloadArgs = {
            output: filepath,
            noCheckCertificates: true,
            ffmpegLocation: '/usr/bin/ffmpeg' // optional
        };

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

        console.log('Starting yt-dlp download...');
        await ytdlp(cleanUrl, downloadArgs);

        res.download(filepath, `${title}.${format}`, (err) => {
            if (err) {
                console.error('Download error:', err.message);
                res.status(500).send('Error sending file');
            }

            // Clean up file after sending
            fs.unlink(filepath, (unlinkErr) => {
                if (unlinkErr) console.error('Failed to delete file:', unlinkErr.message);
            });
        });

    } catch (error) {
        console.error('Unexpected error:', error.message, error.stack);
        res.status(500).send('Error processing download request');
    }
});

// Start the server on the correct port
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});

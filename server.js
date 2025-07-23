const express = require('express');
const cp = require('child_process');
const fs = require('fs');
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
        // Get video title using yt-dlp
        const titleCmd = ['yt-dlp', '--get-title', url];
        console.log('Fetching title with command:', titleCmd.join(' '));
        const titleResult = cp.spawnSync('yt-dlp', titleCmd.slice(1), { encoding: 'utf8' });
        if (titleResult.error) {
            console.error('Title fetch error:', titleResult.error.message);
            throw titleResult.error;
        }
        if (titleResult.status !== 0) {
            console.error('Title fetch failed:', titleResult.stderr);
            throw new Error('Failed to fetch title');
        }
        const title = titleResult.stdout.trim().replace(/[^\w\s]/gi, '');
        const filename = `${title}-${Date.now()}.${format}`; // Unique filename with title

        // Download video or audio
        const cmd = format === 'mp4' ? 
            ['yt-dlp', '-f', 'bestvideo[vcodec^=avc1]+bestaudio', '--merge-output-format', 'mp4', '-o', filename, url] :
            ['yt-dlp', '-x', '--audio-format', 'mp3', '--embed-metadata', '-o', filename, url];

        console.log('Running yt-dlp command:', cmd.join(' '));
        const downloadResult = cp.spawnSync('yt-dlp', cmd.slice(1), { stdio: 'inherit' });
        if (downloadResult.error) {
            console.error('Download error:', downloadResult.error.message);
            throw downloadResult.error;
        }
        if (downloadResult.status !== 0) {
            console.error('Download failed:', downloadResult.stderr);
            throw new Error('Failed to download');
        }

        res.download(filename, `${title}.${format}`, (err) => {
            if (err) {
                console.error('Download error:', err.message);
                res.status(500).send('Error downloading file');
            }
            // Clean up the file after download
            fs.unlink(filename, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting file:', unlinkErr.message);
            });
        });
    } catch (error) {
        console.error('yt-dlp error:', error.message, error.stack);
        res.status(500).send('Error: Invalid URL or video unavailable');
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
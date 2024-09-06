const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/update-text', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const imagePath = path.join(__dirname, 'uploads', req.file.filename);
        const { text, x = 0, y = 0 } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Load the image and overlay text
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Draw the image
        ctx.drawImage(image, 0, 0);

        // Set text properties and draw text
        ctx.font = '30px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText(text, parseInt(x, 10), parseInt(y, 10));

        // Create a new file path for the edited image
        const editedImagePath = path.join(__dirname, 'uploads', 'edited-' + req.file.filename);
        
        // Write the edited image to the filesystem
        const out = fs.createWriteStream(editedImagePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        
        out.on('finish', () => {
            // Send the edited image back to the client
            res.sendFile(editedImagePath, { root: __dirname });
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the image' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

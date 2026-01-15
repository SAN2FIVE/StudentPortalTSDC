const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
// Use process.cwd() for better reliability on Vercel
const DATA_FILE = path.join(process.cwd(), 'data.json');

// Middleware
app.use(cors()); // Simplified CORS
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Helper to read data
const readData = () => {
    try {
        let activePath = DATA_FILE;
        if (!fs.existsSync(activePath)) {
            // Fallback to __dirname if process.cwd() fails
            activePath = path.join(__dirname, 'data.json');
        }

        if (!fs.existsSync(activePath)) {
            console.log("Data file not found at any path, returning empty structure");
            return { notices: [], students: [] };
        }

        const data = fs.readFileSync(activePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Critical error in readData:", error);
        return { notices: [], students: [] }; // Return empty instead of crashing
    }
};

// Helper to write data
const writeData = (data) => {
    try {
        // Vercel filesystem is read-only in production. 
        // We try to write, but catch the error so the API doesn't return 500.
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log("Data written successfully to", DATA_FILE);
    } catch (error) {
        console.error("PERMANENCE WARNING: Could not write to filesystem (expected on Vercel). Data will not be saved permanently.");
        console.error("Error detail:", error.message);
        // We DON'T throw here, so the API response can still be a 201/200 
        // even if the file didn't update on disk.
    }
};

// --- API Endpoints ---

// Root endpoint for testing
app.get('/', (req, res) => {
    res.json({ message: "TSDC Campus API is running", status: "ok" });
});

// Catch-all root for other methods
app.all('/', (req, res) => {
    res.json({ message: "TSDC Campus API Root", use: "/api/notices or /api/students" });
});

// Get all notices
app.get('/api/notices', (req, res) => {
    try {
        const data = readData();
        res.json(data.notices);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error reading notices",
            error: error.message,
            path: DATA_FILE
        });
    }
});

// Post a new notice
app.post('/api/notices', (req, res) => {
    try {
        const { title, dept, data, type, date } = req.body;
        if (!title || !data) {
            return res.status(400).json({ message: "Title and file data are required" });
        }

        const db = readData();
        const newNotice = {
            id: Date.now(),
            title,
            dept,
            data,
            type,
            date
        };

        db.notices.unshift(newNotice);
        writeData(db);

        res.status(201).json(newNotice);
    } catch (error) {
        res.status(500).json({ message: "Error saving notice", error: error.message });
    }
});

// Delete a notice
app.delete('/api/notices/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const db = readData();
        db.notices = db.notices.filter(n => n.id !== id);
        writeData(db);
        res.json({ message: "Notice deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting notice", error: error.message });
    }
});

// Post student login
app.post('/api/students', (req, res) => {
    try {
        const { name, dept } = req.body;
        if (!name || !dept) {
            return res.status(400).json({ message: "Name and Dept are required" });
        }

        const db = readData();
        const newStudent = {
            id: Date.now(),
            name,
            dept,
            loginTime: new Date().toISOString()
        };

        if (!db.students) db.students = [];
        db.students.push(newStudent);
        writeData(db);

        res.status(201).json(newStudent);
    } catch (error) {
        res.status(500).json({ message: "Error saving student data", error: error.message });
    }
});

// Get all students (for admin)
app.get('/api/students', (req, res) => {
    try {
        const data = readData();
        res.json(data.students || []);
    } catch (error) {
        res.status(500).json({ message: "Error reading students", error: error.message });
    }
});

// Start server (only if not running as a serverless function)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running locally on http://localhost:${PORT}`);
    });
}

module.exports = app;


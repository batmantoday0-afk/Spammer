const http = require('http');

// --- Configuration ---

// Render (and other platforms) sets the PORT environment variable.
// We fall back to 3000 for local testing.
const PORT = process.env.PORT || 3000;

// IMPORTANT: Set this to the path of your main script.
// This is the script that `npm start` might have run previously.
// For example: './index.js', './bot.js', etc.
const YOUR_MAIN_SCRIPT_PATH = './index.js'; // <-- !!! CHANGE THIS !!!

// --- Dummy Server ---

// Create a simple HTTP server.
// Its only job is to listen on the port and respond to health checks.
const server = http.createServer((req, res) => {
  // Send a simple 200 OK response
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is running.\n');
});

// Start the server
server.listen(PORT, () => {
  console.log(`Dummy server listening on port ${PORT}`);
  console.log('Attempting to start the main application script...');

  // --- Run Your Main Script ---
  // Now that the server is running, we execute your main script.
  // This is how we "do what npm start does" while also keeping
  // the web service alive for Render.
  try {
    require(YOUR_MAIN_SCRIPT_PATH);
    console.log(`Successfully loaded and started: ${YOUR_MAIN_SCRIPT_PATH}`);
  } catch (err) {
    console.error(`!!! FAILED to run main script (${YOUR_MAIN_SCRIPT_PATH}) !!!`);
    console.error(err);
    // Even if the script fails, the server keeps running
    // so you can see this error message in your Render logs.
  }
});

// Optional: Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

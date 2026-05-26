const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log("Starting cloudflared tunnel...");

const cf = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3001'], { shell: true });

let urlFound = false;

cf.stderr.on('data', (data) => {
    const text = data.toString();
    const match = text.match(/(https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com)/);
    
    if (match && match[1] && !urlFound) {
        urlFound = true;
        const url = match[1];
        console.log("🎯 Found Cloudflare URL:", url);
        
        console.log("Uploading to Supabase...");
        try {
            // we must run this in the root project directory, so use cwd
            execSync(`npx supabase secrets set WA_SERVER_URL=${url}`, {
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit'
            });
            console.log("✅ Successfully updated Supabase!");
            console.log("Keeping tunnel alive...");
        } catch (e) {
            console.error("❌ Failed to set Supabase secret:", e.message);
        }
    }
});

cf.on('close', (code) => {
    console.log(`cloudflared exited with code ${code}`);
});

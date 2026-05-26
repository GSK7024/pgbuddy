const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isKaggle = process.env.KAGGLE_DATA_PROXY_URL !== undefined;
const isDocker = fs.existsSync('/.dockerenv');

const workDir = process.env.PROJECT_DIR || process.cwd();
const logFile = path.join(process.env.TEMP || '/tmp', 'tunnel-log.txt');

function log(message) {
    const timestamp = new Date().toISOString();
    const fullMessage = `[${timestamp}] ${message}`;
    console.log(fullMessage);
    try {
        fs.appendFileSync(logFile, fullMessage + '\n');
    } catch (e) {
        // silent
    }
}

log(`Starting tunnel in ${isKaggle ? 'KAGGLE' : isDocker ? 'DOCKER' : 'LOCAL'} environment`);
log(`Working directory: ${workDir}`);

const PORT = process.env.PORT || 3001;
const TUNNEL_URL = `http://localhost:${PORT}`;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;

if (!SUPABASE_URL || !SUPABASE_PROJECT_ID) {
    log('WARNING: SUPABASE_URL or SUPABASE_PROJECT_ID not set. Will save to .env.local');
}

log(`Tunneling to ${TUNNEL_URL}...`);

const cf = spawn('cloudflared', ['tunnel', '--url', TUNNEL_URL], { 
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
});

let urlFound = false;
let timeoutId;

function handleTunnelOutput(data, source) {
    const text = data.toString();
    
    log(`[cloudflared-${source}] ${text.trim()}`);
    
    const match = text.match(/(https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com)/);
    
    if (match && match[1] && !urlFound) {
        urlFound = true;
        clearTimeout(timeoutId);
        
        const url = match[1];
        log(`Found Cloudflare URL: ${url}`);
        
        updateSecrets(url);
    }
}

cf.stdout.on('data', (data) => handleTunnelOutput(data, 'stdout'));
cf.stderr.on('data', (data) => handleTunnelOutput(data, 'stderr'));

function updateSecrets(url) {
    log('Updating secrets...');
    
    if (SUPABASE_URL && SUPABASE_PROJECT_ID) {
        try {
            log('Attempting to set Supabase secret via CLI...');
            execSync(`npx supabase secrets set WA_SERVER_URL=${url}`, {
                cwd: workDir,
                stdio: 'inherit',
                timeout: 30000
            });
            log('Successfully updated Supabase secret!');
            return;
        } catch (e) {
            log(`Supabase CLI failed: ${e.message}`);
            log('Falling back to local .env file...');
        }
    }
    
    try {
        const envFile = path.join(workDir, '.env.local');
        const envContent = `WA_SERVER_URL=${url}\nUPDATED_AT=${new Date().toISOString()}\n`;
        fs.writeFileSync(envFile, envContent);
        log(`Saved to ${envFile}`);
    } catch (e) {
        log(`Failed to save .env.local: ${e.message}`);
    }
    
    if (isKaggle) {
        try {
            const kaggleTunnelFile = '/tmp/wa_server_url.txt';
            fs.writeFileSync(kaggleTunnelFile, url);
            log(`Saved to ${kaggleTunnelFile} (Kaggle temp)`);
        } catch (e) {
            log(`Could not save to Kaggle temp: ${e.message}`);
        }
    }
    
    log('Tunnel URL saved and ready!');
    log('Keeping tunnel alive...');
}

timeoutId = setTimeout(() => {
    if (!urlFound) {
        log('TIMEOUT: No tunnel URL found after 5 minutes');
        log('Troubleshooting tips:');
        log('  1. Check if cloudflared is installed: npm install -g @cloudflare/wrangler');
        log('  2. Check if port 3001 is accessible');
        log('  3. Verify your internet connection');
        process.exit(1);
    }
}, 5 * 60 * 1000);

cf.on('close', (code) => {
    log(`Cloudflared exited with code ${code}`);
    if (!urlFound) {
        log('Tunnel failed to start. Check logs above.');
        process.exit(code || 1);
    } else {
        log('Tunnel closed gracefully');
        process.exit(0);
    }
});

cf.on('error', (err) => {
    log(`Tunnel error: ${err.message}`);
    log('Make sure cloudflared is installed:');
    log('  npm install -g @cloudflare/wrangler');
    process.exit(1);
});

process.on('SIGINT', () => {
    log('Shutting down gracefully...');
    cf.kill();
});

process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...');
    cf.kill();
});

log('Tunnel script initialized. Waiting for URL...');

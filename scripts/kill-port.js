#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const process = require('process');

const PORT = process.argv[2] || 3000;

function killPort(port) {
  const platform = process.platform;

  return new Promise((resolve) => {
    let command;

    if (platform === 'win32') {
      // Windows
      command = `netstat -ano | findstr :${port}`;
      exec(command, (err, stdout) => {
        if (err || !stdout) {
          console.log(`No process found on port ${port}.`);
          resolve();
          return;
        }

        const lines = stdout.trim().split('\n');
        const pids = new Set();

        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            pids.add(pid);
          }
        });

        if (pids.size > 0) {
          pids.forEach(pid => {
            console.log(`Killing process ${pid} on port ${port}...`);
            exec(`taskkill /PID ${pid} /F`, (err) => {
              if (err) {
                console.error(`Failed to kill process ${pid}:`, err.message);
              }
            });
          });
          setTimeout(resolve, 1000);
        } else {
          resolve();
        }
      });
    } else {
      // macOS and Linux
      command = `lsof -ti:${port}`;
      exec(command, (err, stdout) => {
        if (err || !stdout) {
          console.log(`No process found on port ${port}.`);
          resolve();
          return;
        }

        const pids = stdout.trim().split('\n');
        pids.forEach(pid => {
          if (pid) {
            console.log(`Killing process ${pid} on port ${port}...`);
            try {
              process.kill(pid, 'SIGKILL');
            } catch (e) {
              console.error(`Failed to kill process ${pid}:`, e.message);
            }
          }
        });

        console.log('Process killed successfully.');
        setTimeout(resolve, 1000);
      });
    }
  });
}

async function main() {
  console.log(`Checking for processes on port ${PORT}...`);
  await killPort(PORT);

  console.log('Starting development server...');
  const npm = spawn('npm', ['run', 'dev:next'], {
    stdio: 'inherit',
    shell: true
  });

  npm.on('error', (error) => {
    console.error('Failed to start development server:', error);
    process.exit(1);
  });

  npm.on('exit', (code) => {
    process.exit(code);
  });
}

main().catch(console.error);

const { spawn } = require("child_process");
const path = require("path");

const uvxPath = "uvx";

console.log("=== STARTING DEBUG ===");

const child = spawn(uvxPath, [
    "--from", "notebooklm-mcp-server",
    "notebooklm-mcp"
], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true
});

let stdout = "";
let stderr = "";

child.stdout.on("data", (data) => {
    console.log("[STDOUT CHUNK]:", data.toString());
    stdout += data.toString();
});

child.stderr.on("data", (data) => {
    console.log("[STDERR CHUNK]:", data.toString());
    stderr += data.toString();
});

const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
        name: "notebook_list",
        arguments: {}
    }
};

child.stdin.write(JSON.stringify(request) + "\n");
// Do NOT end stdin immediately usually, but for a single request it might be fine or we might need to wait.
// Let's keep it open for a second then close.

setTimeout(() => {
    console.log("=== SENDING REQUEST ===");
    console.log(JSON.stringify(request));
}, 100);

setTimeout(() => {
    console.log("=== ENDING STDIN ===");
    child.stdin.end();
}, 2000);

child.on("close", (code) => {
    console.log(`=== PROCESS EXITED: ${code} ===`);
    console.log("FULL STDOUT:", stdout);
    console.log("FULL STDERR:", stderr);
});

// Timeout
setTimeout(() => {
    console.log("=== TIMEOUT ===");
    child.kill();
}, 10000);

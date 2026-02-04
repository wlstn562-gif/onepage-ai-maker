
const { spawn } = require("child_process");
const path = require("path");

const uvxPath = "uvx";

console.log("=== STARTING DEBUG QUERY ===");

const child = spawn(uvxPath, [
    "--from", "notebooklm-mcp-server",
    "notebooklm-mcp"
], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true
});

let stdout = "";
let stderr = "";

const NOTEBOOK_ID = "6bfa56ae-c0ec-4282-b269-41ab37c42891"; // Using ID from previous logs
const QUERY = "이 노트북의 주요 내용을 요약해줘";

child.stdout.on("data", (data) => {
    const chunk = data.toString();
    console.log("[STDOUT CHUNK]:", chunk);
    stdout += chunk;

    if (chunk.includes('"result":') && chunk.includes('"protocolVersion":')) {
        console.log("=== INITIALIZED RECEIVED, SENDING HANDSHAKE ===");
        const initializedMsg = {
            jsonrpc: "2.0",
            method: "notifications/initialized",
            params: {}
        };
        child.stdin.write(JSON.stringify(initializedMsg) + "\n");

        setTimeout(() => {
            console.log("=== SENDING QUERY ===");
            const toolRequest = {
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: {
                    name: "notebook_query",
                    arguments: {
                        notebook_id: NOTEBOOK_ID,
                        query: QUERY
                    }
                }
            };
            child.stdin.write(JSON.stringify(toolRequest) + "\n");
        }, 1000);
    }
});

child.stderr.on("data", (data) => {
    console.log("[STDERR CHUNK]:", data.toString());
    stderr += data.toString();
});

const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
            name: "debug-script",
            version: "1.0.0"
        }
    }
};

child.stdin.write(JSON.stringify(initRequest) + "\n");

setTimeout(() => {
    console.log("=== TIMEOUT REACHED (60s) ===");
    child.kill();
}, 60000);

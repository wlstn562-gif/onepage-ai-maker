
const { spawn } = require("child_process");
const path = require("path");

const uvxPath = "uvx"; // Assume in PATH or use absolute if needed

console.log("Starting NotebookLM MCP test...");

const child = spawn(uvxPath, [
    "--from", "notebooklm-mcp-server",
    "notebooklm-mcp",
    "--json"
], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true
});

child.stdout.on("data", (data) => {
    console.log("STDOUT:", data.toString());
});

child.stderr.on("data", (data) => {
    console.log("STDERR:", data.toString());
});

child.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
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

setTimeout(() => {
    console.log("Sending request:", JSON.stringify(request));
    child.stdin.write(JSON.stringify(request) + "\n");
}, 2000);

setTimeout(() => {
    child.stdin.end();
}, 5000);

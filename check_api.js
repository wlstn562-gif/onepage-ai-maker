
const fetch = require('node-fetch');

async function testApi() {
    try {
        console.log("Fetching API...");
        const res = await fetch('http://localhost:3001/api/notebooklm?action=list');
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testApi();


const apiKey = "AIzaSyAnO8m-_KQdpCDHXOlid-OmbYVPUjJO2Ds";
const url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=" + apiKey;

const payload = {
    instances: [
        { prompt: "A simple stickman drawing, white background" }
    ],
    parameters: {
        sampleCount: 1,
        aspectRatio: "16:9" // 4.0 fast supports this? check docs or error
    }
};

async function test() {
    try {
        console.log("Testing Image Generation...");
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response Body:", text);
    } catch (e) {
        console.error("Network Error:", e);
    }
}

test();

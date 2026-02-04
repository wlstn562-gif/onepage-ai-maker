
const apiKey = "AIzaSyAnO8m-_KQdpCDHXOlid-OmbYVPUjJO2Ds";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function check() {
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
            console.error("Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Available Models:", JSON.stringify(data.models?.map((m) => m.name), null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

check();

import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// Helper for XML escaping
const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { imageUrl, overlayText, highlightWords, overlayImage, overlayShape } = body;

        if (!imageUrl) return NextResponse.json({ error: "No image URL" }, { status: 400 });
        if (!overlayText || overlayText.length === 0) return NextResponse.json({ error: "No text" }, { status: 400 });

        // 1. Fetch Background Image
        const bgRes = await fetch(imageUrl);
        const bgBuffer = await bgRes.arrayBuffer();

        // 1.5 Fetch/Process Overlay Image (Protagonist) if it exists
        let overlayBuffer: Buffer | null = null;

        if (overlayImage) {
            try {
                // Handle Local Files (starts with /) or Remote URLs
                if (overlayImage.startsWith("/")) {
                    const publicPath = path.join(process.cwd(), 'public', overlayImage);
                    if (fs.existsSync(publicPath)) {
                        overlayBuffer = fs.readFileSync(publicPath);
                    }
                } else if (overlayImage.startsWith("data:")) {
                    const parts = overlayImage.split(",");
                    overlayBuffer = Buffer.from(parts[1], 'base64');
                } else {
                    const ovRes = await fetch(overlayImage);
                    overlayBuffer = Buffer.from(await ovRes.arrayBuffer());
                }

                if (overlayBuffer) {
                    // Resize to standard height (e.g., 700px inside 720px canvas)
                    let overlaySharp = sharp(overlayBuffer).resize({ height: 700, fit: 'inside' });

                    // ✅ Apply Circle Mask if requested
                    if (overlayShape === 'circle') {
                        // For circle crop, we force a square aspect ratio first
                        overlaySharp = overlaySharp.resize(600, 600, { fit: 'cover' });

                        const circleSvg = Buffer.from(
                            `<svg width="600" height="600"><circle cx="300" cy="300" r="300" /></svg>`
                        );

                        overlayBuffer = await overlaySharp
                            .composite([{ input: circleSvg, blend: 'dest-in' }])
                            .png()
                            .toBuffer();
                    } else {
                        overlayBuffer = await overlaySharp.png().toBuffer();
                    }
                }
            } catch (err) {
                console.error("Failed to process overlay image:", err);
            }
        }

        // 2. Prepare Text Processing
        const rawLine1 = overlayText[0] || "";
        const rawLine2 = overlayText[1] || "";
        const highlightColor = "#FF0000"; // Red for emphasis

        const processLine = (text: string) => {
            let processed = escapeXml(text);
            const wordsToHighlight = (highlightWords || []).filter((w: any) => w && typeof w === 'string' && w.trim().length > 0);

            if (wordsToHighlight.length === 0) return processed;

            // Sort by length desc to prevent partial replacements
            const sortedWords = [...wordsToHighlight].sort((a: string, b: string) => b.length - a.length);

            for (const word of sortedWords) {
                const escapedWord = escapeXml(word);
                // Simple replacement (replace all occurrences)
                processed = processed.split(escapedWord).join(`<tspan fill="${highlightColor}" font-weight="900">${escapedWord}</tspan>`);
            }
            return processed;
        };

        const renderedLine1 = processLine(rawLine1);
        const renderedLine2 = processLine(rawLine2);

        // 3. Typography Calculations - BIGGER for YouTube Impact
        const calculateFontSize = (text: string, maxSize: number) => {
            const maxLength = text.replace(/\s/g, '').length + (text.match(/\s/g)?.length || 0) * 0.5;
            if (maxLength <= 4) return maxSize;
            const fitSize = 1180 / (maxLength * 0.8); // More aggressive fitting
            return Math.min(maxSize, Math.floor(fitSize));
        };

        const fontSizeMain = calculateFontSize(rawLine1, 180); // Bigger: 150 -> 180
        const fontSizeSub = calculateFontSize(rawLine2, 120);  // Bigger: 100 -> 120

        const strokeWidthMain = Math.max(12, fontSizeMain * 0.15); // Thicker stroke: 8 -> 12
        const strokeWidthSub = Math.max(10, fontSizeSub * 0.15);   // Thicker stroke: 6 -> 10

        const mainColor = "#FFEB3B"; // Yellow Default
        const subColor = "#FFFFFF";  // White Default

        // 4. Create SVG Text Overlay
        const width = 1280;
        const height = 720;

        const svgText = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="blockShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feFlood flood-color="black" result="bg" />
                    <feComposite in="bg" in2="SourceGraphic" operator="in" result="shadow" />
                    <feOffset dx="8" dy="8" result="offsetShadow" />
                    <feMerge>
                        <feMergeNode in="offsetShadow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@900&amp;display=swap');
                    .main-text { 
                        fill: ${mainColor}; 
                        stroke: black; 
                        stroke-width: ${strokeWidthMain}px; 
                        font-family: 'Noto Sans KR', 'Impact', sans-serif; 
                        font-weight: 900; 
                        text-anchor: middle;
                        paint-order: stroke fill;
                        text-shadow: 4px 4px 0px #000;
                    }
                    .sub-text {
                        fill: ${subColor};
                        stroke: black;
                        stroke-width: ${strokeWidthSub}px; 
                        font-family: 'Noto Sans KR', 'Impact', sans-serif; 
                        font-weight: 900; 
                        text-anchor: middle;
                        paint-order: stroke fill;
                    }
                </style>
            </defs>

            ${rawLine2 ? `
                <text x="50%" y="65%" font-size="${fontSizeSub}" class="sub-text" filter="url(#blockShadow)">${renderedLine2}</text>
                <text x="50%" y="88%" font-size="${fontSizeMain}" class="main-text" filter="url(#blockShadow)">${renderedLine1}</text>
            ` : `
                <text x="50%" y="85%" font-size="${fontSizeMain * 1.2}" class="main-text" filter="url(#blockShadow)">${renderedLine1}</text>
            `}
        </svg>
        `;

        // 5. Composite Layers using Sharp
        const compositeLayers: any[] = [];

        // Add Protagonist (Bottom Left)
        if (overlayBuffer) {
            compositeLayers.push({
                input: overlayBuffer,
                gravity: 'southwest'
            });
        }

        // Add Text Overlay (Top)
        compositeLayers.push({
            input: Buffer.from(svgText),
            top: 0,
            left: 0,
        });

        const finalImageBuffer = await sharp(Buffer.from(bgBuffer))
            .resize(1280, 720)
            .composite(compositeLayers)
            .png()
            .toBuffer();

        const base64 = finalImageBuffer.toString("base64");
        const dataUrl = `data:image/png;base64,${base64}`;

        return NextResponse.json({ url: dataUrl });

    } catch (e: any) {
        console.error("Thumbnail Render Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

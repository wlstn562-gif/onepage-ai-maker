
import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST() {
    try {
        const dir = path.join(process.cwd(), ".data", "files");

        // Ensure dir exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let command = "";
        switch (process.platform) {
            case "win32":
                command = `start "" "${dir}"`;
                break;
            case "darwin":
                command = `open "${dir}"`;
                break;
            default: // linux
                command = `xdg-open "${dir}"`;
                break;
        }

        exec(command);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

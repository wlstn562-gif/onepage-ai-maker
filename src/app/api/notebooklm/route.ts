import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

// NotebookLM MCP를 직접 호출하는 헬퍼 함수
async function callNotebookLMMCP(action: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        // uvx를 통해 notebooklm-mcp 호출
        const uvxPath = path.join(process.env.USERPROFILE || "", ".local", "bin", "uvx.exe");
        const isWin = process.platform === "win32";
        const cmd = isWin ? "uvx" : uvxPath; // Windows에서는 PATH에 있는 uvx 사용 권장

        const child = spawn(cmd, [
            "--from", "notebooklm-mcp-server",
            "notebooklm-mcp"
        ], {
            stdio: ["pipe", "pipe", "pipe"],
            shell: true
        });

        let stdoutBuffer = "";
        let stderrBuffer = "";

        // JSON-RPC 메시지 파싱 함수
        const parseMessages = (buffer: string) => {
            const messages = [];
            const lines = buffer.split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        messages.push(JSON.parse(line));
                    } catch (e) {
                        // 불완전한 라인일 수 있음, 무시
                    }
                }
            }
            return messages;
        };

        child.stdout.on("data", (data) => {
            const chunk = data.toString();
            stdoutBuffer += chunk;

            // 초기화 응답 확인 (initialize response)
            if (chunk.includes('"result":') && chunk.includes('"protocolVersion":')) {
                // 2. initialized 알림 전송
                const initializedMsg = {
                    jsonrpc: "2.0",
                    method: "notifications/initialized",
                    params: {}
                };
                child.stdin.write(JSON.stringify(initializedMsg) + "\n");

                // 3. 실제 툴 호출 (약간의 지연 후)
                setTimeout(() => {
                    const toolRequest = {
                        jsonrpc: "2.0",
                        id: 2,
                        method: "tools/call",
                        params: {
                            name: action,
                            arguments: params
                        }
                    };
                    child.stdin.write(JSON.stringify(toolRequest) + "\n");
                }, 500);
            }

            // 툴 실행 결과 확인
            if (chunk.includes('"id":2') && chunk.includes('"result":')) {
                try {
                    const lines = chunk.trim().split("\n");
                    for (let line of lines) {
                        try {
                            const json = JSON.parse(line);
                            if (json.id === 2 && json.result) {
                                // 툴 결과 반환 (content[0].text)
                                const content = json.result.content;
                                if (Array.isArray(content) && content.length > 0 && content[0].text) {
                                    resolve(JSON.parse(content[0].text));
                                } else {
                                    resolve(json.result);
                                }
                                child.kill();
                            }
                        } catch (e) { }
                    }
                } catch (e) { }
            }
        });

        child.stderr.on("data", (data) => {
            stderrBuffer += data.toString();
        });

        // 1. 초기화 요청 (initialize)
        const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: {
                    name: "onepage-ai-maker",
                    version: "1.0.0"
                }
            }
        };
        child.stdin.write(JSON.stringify(initRequest) + "\n");

        child.on("close", (code) => {
            // 정상 종료가 아니고 resolve가 아직 안 된 경우
            // (타임아웃이나 에러로 닫힌 경우 등)
            // 여기서는 특별한 처리를 하지 않고 Timeout에서 처리하도록 둠
        });

        // 타임아웃 120초 (NotebookLM 응답 시간이 길 수 있음)
        setTimeout(() => {
            if (!child.killed) {
                child.kill();
                reject(new Error(`MCP 호출 타임아웃 (120초) STDERR: ${stderrBuffer}`));
            }
        }, 120000);
    });
}

// 인증 토큰 확인
async function checkAuth(): Promise<boolean> {
    const authPath = path.join(process.env.USERPROFILE || "", ".notebooklm-mcp", "auth.json");
    try {
        await fs.access(authPath);
        return true;
    } catch {
        return false;
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "list";

    // 인증 확인
    const isAuthed = await checkAuth();
    if (!isAuthed) {
        return NextResponse.json({
            error: "NotebookLM 인증이 필요합니다. 터미널에서 'uvx --from notebooklm-mcp-server notebooklm-mcp-auth' 실행하세요.",
            needsAuth: true
        }, { status: 401 });
    }

    try {
        switch (action) {
            case "list":
                // 노트북 목록 조회
                const notebooks = await callNotebookLMMCP("notebook_list");
                return NextResponse.json({ success: true, notebooks });

            case "status":
                // 연결 상태 확인
                return NextResponse.json({
                    success: true,
                    connected: true,
                    message: "NotebookLM MCP 연결됨"
                });

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }
    } catch (e: any) {
        console.error("NotebookLM API Error:", e);
        return NextResponse.json({
            error: e.message,
            success: false
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { action, ...params } = body;

    // 인증 확인
    const isAuthed = await checkAuth();
    if (!isAuthed) {
        return NextResponse.json({
            error: "NotebookLM 인증이 필요합니다.",
            needsAuth: true
        }, { status: 401 });
    }

    try {
        switch (action) {
            case "query":
                // 노트북에 질문하기
                if (!params.notebookId || !params.query) {
                    return NextResponse.json({ error: "notebookId와 query가 필요합니다." }, { status: 400 });
                }
                const queryResult = await callNotebookLMMCP("notebook_query", {
                    notebook_id: params.notebookId,
                    query: params.query
                });
                return NextResponse.json({ success: true, result: queryResult });

            case "add_url":
                // URL 추가
                if (!params.notebookId || !params.url) {
                    return NextResponse.json({ error: "notebookId와 url이 필요합니다." }, { status: 400 });
                }
                const addResult = await callNotebookLMMCP("notebook_add_url", {
                    notebook_id: params.notebookId,
                    url: params.url
                });
                return NextResponse.json({ success: true, result: addResult });

            case "add_text":
                // 텍스트 추가
                if (!params.notebookId || !params.text) {
                    return NextResponse.json({ error: "notebookId와 text가 필요합니다." }, { status: 400 });
                }
                const textResult = await callNotebookLMMCP("notebook_add_text", {
                    notebook_id: params.notebookId,
                    text: params.text,
                    title: params.title || "원페이지 AI 메이커 저장"
                });
                return NextResponse.json({ success: true, result: textResult });

            case "create":
                // 노트북 생성
                const createResult = await callNotebookLMMCP("notebook_create", {
                    title: params.title || "새 노트북"
                });
                return NextResponse.json({ success: true, result: createResult });

            case "get_facts":
                // 팩트 체크용 - 노트북에서 관련 정보 검색
                if (!params.notebookId || !params.topic) {
                    return NextResponse.json({ error: "notebookId와 topic이 필요합니다." }, { status: 400 });
                }
                const factsQuery = `"${params.topic}"에 대한 구체적인 팩트, 숫자, 사례를 알려줘. 출처도 포함해서.`;
                const factsResult = await callNotebookLMMCP("notebook_query", {
                    notebook_id: params.notebookId,
                    query: factsQuery
                });
                return NextResponse.json({ success: true, facts: factsResult });

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }
    } catch (e: any) {
        console.error("NotebookLM API Error:", e);
        return NextResponse.json({
            error: e.message,
            success: false
        }, { status: 500 });
    }
}

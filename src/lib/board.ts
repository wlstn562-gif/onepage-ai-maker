import fs from 'fs';
import path from 'path';

const NOTICE_DB_PATH = path.join(process.cwd(), 'data/notices.json');
const EVENT_DB_PATH = path.join(process.cwd(), 'data/events.json');

export interface Notice {
    id: string;
    title: string;
    date: string;
    tag: '필독' | '중요' | '일반';
    content: string;
}

export interface Event {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'meeting' | 'event';
}

// ensure directory exists
function ensureDir() {
    const dir = path.dirname(NOTICE_DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Notices
export function getNotices(): Notice[] {
    ensureDir();
    if (!fs.existsSync(NOTICE_DB_PATH)) {
        return [];
    }
    const fileContent = fs.readFileSync(NOTICE_DB_PATH, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch (e) {
        return [];
    }
}

export function saveNotices(notices: Notice[]) {
    ensureDir();
    fs.writeFileSync(NOTICE_DB_PATH, JSON.stringify(notices, null, 2), 'utf-8');
}

// Events
export function getEvents(): Event[] {
    ensureDir();
    if (!fs.existsSync(EVENT_DB_PATH)) {
        return [];
    }
    const fileContent = fs.readFileSync(EVENT_DB_PATH, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch (e) {
        return [];
    }
}

export function saveEvents(events: Event[]) {
    ensureDir();
    fs.writeFileSync(EVENT_DB_PATH, JSON.stringify(events, null, 2), 'utf-8');
}

import fs from 'fs';
import path from 'path';

// Define Employee type
export interface Employee {
    id: string;
    name: string;
    department: string;
    position: string;
    joinDate: string;
    totalLeave: number;
    usedLeave: number;
    status?: 'active' | 'suspended'; // 'active' (재직) | 'suspended' (휴직/근무정지)
    suspendedAt?: string; // YYYY-MM-DD
    manualLeave?: number; // Arbitrary addition/subtraction
    username?: string; // Login ID
    password?: string; // Login Password
    leaveHistory?: {
        id: string;
        date: string;
        days: number; // 1 or 0.5
        reason: string;
        createdAt: string;
    }[];
}

const dataPath = path.join(process.cwd(), 'data', 'employees.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(dataPath))) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
}

// Ensure file exists
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]', 'utf-8');
}

export function getEmployees(): Employee[] {
    try {
        const data = fs.readFileSync(dataPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading employees data:', error);
        return [];
    }
}

export function saveEmployees(employees: Employee[]): void {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(employees, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving employees data:', error);
    }
}

export function addEmployee(employee: Omit<Employee, 'id'>): Employee {
    const employees = getEmployees();
    const newEmployee = { ...employee, id: Date.now().toString() };
    employees.push(newEmployee);
    saveEmployees(employees);
    return newEmployee;
}

export function updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const employees = getEmployees();
    const index = employees.findIndex(e => e.id === id);

    if (index === -1) return null;

    const updatedEmployee = { ...employees[index], ...updates };
    employees[index] = updatedEmployee;
    saveEmployees(employees);
    return updatedEmployee;
}

export function deleteEmployee(id: string): boolean {
    const employees = getEmployees();
    const filtered = employees.filter(e => e.id !== id);
    if (filtered.length === employees.length) return false;

    saveEmployees(filtered);
    return true;
}

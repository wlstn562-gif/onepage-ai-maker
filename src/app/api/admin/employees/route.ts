import { NextResponse } from 'next/server';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, saveEmployees } from '@/lib/db';
import { calculateTotalLeave } from '@/lib/leave';

export async function GET() {
    const employees = getEmployees();
    return NextResponse.json(employees);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Handle Bulk Recalculate
        if (body.action === 'recalculate') {
            const employees = getEmployees();
            const updatedEmployees = employees.map(emp => {
                // Determine cutoff date: if suspended, use suspendedAt.
                // Note: Logic allows passing undefined to use 'today'
                const cutoffDate = (emp.status === 'suspended' && emp.suspendedAt)
                    ? emp.suspendedAt
                    : undefined;

                const baseLeave = calculateTotalLeave(emp.joinDate, cutoffDate);
                const manualLeave = emp.manualLeave || 0;

                return {
                    ...emp,
                    totalLeave: baseLeave + manualLeave
                };
            });
            saveEmployees(updatedEmployees);
            return NextResponse.json({ success: true, count: updatedEmployees.length });
        }

        const newEmployee = addEmployee(body);
        return NextResponse.json(newEmployee, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const updated = updateEmployee(id, updates);
        if (!updated) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const success = deleteEmployee(id);
        if (!success) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

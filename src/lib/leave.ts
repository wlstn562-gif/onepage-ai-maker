// 1. Normal Holidays: Always +1 day
const NORMAL_HOLIDAYS = [
    // 2024
    '2024-01-01', // New Year
    '2024-03-01', // Samiljeol
    '2024-04-10', // Election
    '2024-05-05', '2024-05-06', // Children + Sub
    '2024-05-15', // Buddha
    '2024-06-06', // Memorial
    '2024-08-15', // Liberation
    '2024-10-01', // Listed as temp holiday in 2024? Or Armed Forces Day (Temporary)
    '2024-10-03', // Foundation
    '2024-10-09', // Hangeul
    '2024-12-25', // Christmas

    // 2025
    '2025-01-01',
    '2025-03-01', '2025-03-03', // Samiljeol + Sub
    '2025-05-05', '2025-05-06', // Childrens/Buddha + Sub
    '2025-06-06',
    '2025-08-15',
    '2025-10-03',
    '2025-10-09',
    '2025-12-25',

    // 2026
    '2026-01-01',
    '2026-03-01', '2026-03-02',
    '2026-05-05', '2026-05-06',
    '2026-05-24', '2026-05-25', // Buddha + Sub
    '2026-06-06',
    '2026-08-15',
    '2026-10-03',
    '2026-10-09',
    '2026-12-25',
];

// 2. Major Holidays (Seollal/Chuseok): Forced Off (No +1), UNLESS overlapping with Rest Days (Tue/Wed)
const MAJOR_HOLIDAYS = [
    // 2024
    '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', // Seollal + Sub
    '2024-09-16', '2024-09-17', '2024-09-18', // Chuseok

    // 2025
    '2025-01-28', '2025-01-29', '2025-01-30', // Seollal
    '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08', // Chuseok + Sub

    // 2026
    '2026-02-17', '2026-02-18', '2026-02-19', // Seollal
    '2026-09-24', '2026-09-25', '2026-09-26', // Chuseok
];

/**
 * Calculates the total accrued leave days based on the Join Date (Anniversary Method).
 * 
 * Rules:
 * 1. Less than 1 year: 1 day per completed month (Max 11 days).
 * 2. At 1 year (and every year thereafter): 15 days basic.
 * 3. Seniority Bonus: After 3 years (from year 3 onwards), +1 day every 2 years.
 * 4. Holiday Bonus (Normal): +1 day for EVERY Normal Public Holiday.
 * 5. Holiday Bonus (Major - Seollal/Chuseok): +1 day ONLY if overlapping with Rest Days (Tue, Wed).
 * 
 * @param joinDateStr 'YYYY-MM-DD' string
 * @param limitDateStr Optional 'YYYY-MM-DD' string (e.g. suspension date). If provided, calculation stops at this date.
 * @returns Total accumulated leave days since joining
 */
export function calculateTotalLeave(joinDateStr: string, limitDateStr?: string): number {
    if (!joinDateStr) return 0;

    const joinDate = new Date(joinDateStr);
    // If limitDateStr is provided (suspension/resignation), use that. Otherwise use Today.
    const today = limitDateStr ? new Date(limitDateStr) : new Date();

    // --- 1. Basic Anniversary Leave Calculation ---
    // Calculate difference in months and years
    let diffOfYears = today.getFullYear() - joinDate.getFullYear();
    let diffOfMonths = today.getMonth() - joinDate.getMonth();
    let diffOfDays = today.getDate() - joinDate.getDate();

    // Adjust logic to get accurate full completed years/months
    if (diffOfDays < 0) {
        diffOfMonths--;
    }
    if (diffOfMonths < 0) {
        diffOfYears--;
        diffOfMonths += 12;
    }

    // 1. First Year Accrual (Max 11)
    let firstYearLeave = 0;
    if (diffOfYears < 1) {
        firstYearLeave = diffOfMonths; // 1 day per month
    } else {
        firstYearLeave = 11; // Cap at 11 for the first year
    }

    // 2. Yearly Accrual (Start from 1st anniversary)
    let yearlyLeave = 0;
    if (diffOfYears >= 1) {
        for (let i = 1; i <= diffOfYears; i++) {
            // Formula: 15 + floor((i - 1) / 2)
            let grant = 15 + Math.floor((i - 1) / 2);
            if (grant > 25) grant = 25; // Max cap 25
            yearlyLeave += grant;
        }
    }

    // --- 2. Holiday Bonus Calculation ---
    // Count how many listed holidays are between joinDate (inclusive) and today (inclusive)
    let holidayCount = 0;
    // Normalize dates to YYYY-MM-DD string comparison to avoid timezone issues
    const joinDateISO = joinDate.toISOString().split('T')[0];
    const todayISO = today.toISOString().split('T')[0];

    // A. Normal Holidays -> Always +1
    NORMAL_HOLIDAYS.forEach(holiday => {
        if (holiday >= joinDateISO && holiday <= todayISO) {
            holidayCount++;
        }
    });

    // B. Major Holidays -> +1 ONLY if Tue(2) or Wed(3)
    MAJOR_HOLIDAYS.forEach(holiday => {
        if (holiday >= joinDateISO && holiday <= todayISO) {
            const dateObj = new Date(holiday);
            const dayOfWeek = dateObj.getDay(); // 0(Sun) - 6(Sat)

            // Studio Rest Days: Tuesday (2) and Wednesday (3)
            if (dayOfWeek === 2 || dayOfWeek === 3) {
                holidayCount++;
            }
        }
    });

    return firstYearLeave + yearlyLeave + holidayCount;
}

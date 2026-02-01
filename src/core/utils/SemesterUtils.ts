/**
 * Utility functions for semester calculations
 */

// List of Indian National Holidays for 2025 (Format: MM-DD)
const INDIAN_HOLIDAYS = [
  // Fixed Date Holidays
  '01-26', // Republic Day
  '08-15', // Independence Day
  '10-02', // Gandhi Jayanti
  '12-25', // Christmas
  '05-01', // Labour Day (May Day)
  
  // Variable Date Holidays for 2025 (these dates change each year)
  '04-10', // Ram Navami (April 10, 2025)
  '04-18', // Good Friday (April 18, 2025)
  '10-31', // Diwali (October 31, 2025)
  '03-14', // Holi (March 14, 2025)
  '08-16', // Janmashtami (August 16, 2025)
  
  // Add more holidays as needed for your specific region
];

// Note: Variable holidays like Diwali, Holi, Eid etc. would need to be calculated
// or fetched from an API for accuracy. For now, we use only fixed-date holidays.

/**
 * Check if a date is a Sunday
 */
export const isSunday = (date: Date): boolean => {
  return date.getDay() === 0;
};

/**
 * Check if a date is an Indian holiday
 */
export const isIndianHoliday = (date: Date): boolean => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateString = `${month}-${day}`;
  
  return INDIAN_HOLIDAYS.includes(dateString);
};

/**
 * Check if a date is a working day (not Sunday and not a holiday)
 */
export const isWorkingDay = (date: Date): boolean => {
  return !isSunday(date) && !isIndianHoliday(date);
};

/**
 * Parse date string in DD/MM/YYYY, DDMMYYYY, or ISO format to Date object
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  // Try to parse as ISO date first (e.g., 2025-08-26T08:24:21.146Z)
  if (dateString.includes('T') || dateString.includes('-')) {
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
  }
  
  // Try to parse as DDMMYYYY format (8 digits without separators)
  if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
    const day = parseInt(dateString.substring(0, 2), 10);
    const month = parseInt(dateString.substring(2, 4), 10) - 1; // Month is 0-indexed in JS Date
    const year = parseInt(dateString.substring(4, 8), 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    return new Date(year, month, day);
  }
  
  // Try to parse as DD/MM/YYYY format with slashes
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    return new Date(year, month, day);
  }
  
  return null;
};

/**
 * Calculate total working days in a semester (excluding Sundays and Indian holidays)
 */
export const calculateSemesterWorkingDays = (
  startDate: string | Date,
  endDate: string | Date
): number => {
  let start: Date;
  let end: Date;
  
  if (typeof startDate === 'string') {
    const parsedStart = parseDate(startDate);
    if (!parsedStart) {
      console.error('Failed to parse start date:', startDate);
      return 0;
    }
    start = parsedStart;
  } else {
    start = startDate;
  }
  
  if (typeof endDate === 'string') {
    const parsedEnd = parseDate(endDate);
    if (!parsedEnd) {
      console.error('Failed to parse end date:', endDate);
      return 0;
    }
    end = parsedEnd;
  } else {
    end = endDate;
  }
  
  if (start > end) {
    console.error('Start date is after end date:', start, end);
    return 0;
  }
  
  // If start and end are the same day, check if it's a working day
  if (start.getTime() === end.getTime()) {
    return isWorkingDay(start) ? 1 : 0;
  }
  
  let totalDays = 0;
  let workingDays = 0;
  let sundays = 0;
  let holidays = 0;
  const currentDate = new Date(start);
  
  console.log('Calculating working days from', start.toDateString(), 'to', end.toDateString());
  
  while (currentDate <= end) {
    totalDays++;
    
    if (isSunday(currentDate)) {
      sundays++;
    } else if (isIndianHoliday(currentDate)) {
      holidays++;
      console.log('Found holiday on:', currentDate.toDateString());
    } else {
      workingDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`Total calculation: ${totalDays} total days, ${sundays} Sundays, ${holidays} holidays, ${workingDays} working days`);
  
  return workingDays;
};

/**
 * Calculate working days from start of semester to today
 */
export const calculateElapsedWorkingDays = (
  semesterStartDate: string | Date
): number => {
  const today = new Date();
  const startDate = typeof semesterStartDate === 'string' ? parseDate(semesterStartDate) : semesterStartDate;
  
  if (!startDate) {
    console.error('Invalid semester start date in calculateElapsedWorkingDays');
    return 0;
  }
  
  // If today is before semester start, return 0
  if (today < startDate) {
    return 0;
  }
  
  return calculateSemesterWorkingDays(startDate, today);
};

/**
 * Calculate remaining working days in semester
 */
export const calculateRemainingWorkingDays = (
  semesterEndDate: string | Date
): number => {
  const today = new Date();
  const endDate = typeof semesterEndDate === 'string' ? parseDate(semesterEndDate) : semesterEndDate;
  
  if (!endDate) {
    console.error('Invalid semester end date in calculateRemainingWorkingDays');
    return 0;
  }
  
  // If today is after semester end, return 0
  if (today > endDate) {
    return 0;
  }
  
  return calculateSemesterWorkingDays(today, endDate);
};

/**
 * Calculate working days between two dates
 */
export const calculateWorkingDaysBetween = (
  startDate: string | Date,
  endDate: string | Date
): number => {
  return calculateSemesterWorkingDays(startDate, endDate);
};

/**
 * Calculate attendance with pre-registration assumption
 * Assumes user attended target% before registration, actual attendance after
 */
export const calculateAttendanceWithPreRegistration = (
  semesterStartDate: string,
  semesterEndDate: string,
  userRegistrationDate: string,
  actualAttendedDays: number,
  targetPercentage: number
): {
  requiredDays: number;
  canSkipDays: number;
  isOnTrack: boolean;
  currentPerformancePercentage: number;
  remainingWorkingDays: number;
  targetDaysForSemester: number;
  projectedFinalPercentage: number;
  preRegistrationDays: number;
  postRegistrationDays: number;
  assumedPreRegistrationAttendance: number;
  actualPostRegistrationPerformance: number;
} => {
  console.log('\n=== ATTENDANCE WITH PRE-REGISTRATION CALCULATION ===');
  console.log(`Semester: ${semesterStartDate} to ${semesterEndDate}`);
  console.log(`User registered: ${userRegistrationDate}`);
  console.log(`Actual attended since registration: ${actualAttendedDays} days`);
  
  const today = new Date();
  const registrationDate = parseDate(userRegistrationDate);
  const semesterStart = typeof semesterStartDate === 'string' ? parseDate(semesterStartDate) : semesterStartDate;
  const semesterEnd = typeof semesterEndDate === 'string' ? parseDate(semesterEndDate) : semesterEndDate;
  
  // Check if semester is in the past (user registered after semester ended)
  if (registrationDate && semesterEnd && registrationDate > semesterEnd) {
    console.warn('⚠️ User registered after semester ended. Semester is in the past.');
    return {
      requiredDays: 0,
      canSkipDays: 0,
      isOnTrack: true,
      currentPerformancePercentage: 0,
      remainingWorkingDays: 0,
      targetDaysForSemester: 0,
      projectedFinalPercentage: 0,
      preRegistrationDays: 0,
      postRegistrationDays: 0,
      assumedPreRegistrationAttendance: 0,
      actualPostRegistrationPerformance: 0
    };
  }
  
  // Check if semester hasn't started yet
  if (registrationDate && semesterStart && today < semesterStart) {
    console.warn('⚠️ Semester has not started yet.');
    const totalSemesterWorkingDays = calculateSemesterWorkingDays(semesterStartDate, semesterEndDate);
    return {
      requiredDays: Math.ceil((targetPercentage / 100) * totalSemesterWorkingDays),
      canSkipDays: 0,
      isOnTrack: true,
      currentPerformancePercentage: 0,
      remainingWorkingDays: totalSemesterWorkingDays,
      targetDaysForSemester: Math.ceil((targetPercentage / 100) * totalSemesterWorkingDays),
      projectedFinalPercentage: 0,
      preRegistrationDays: 0,
      postRegistrationDays: 0,
      assumedPreRegistrationAttendance: 0,
      actualPostRegistrationPerformance: 0
    };
  }
  
  if (!registrationDate) {
    console.error('Invalid registration date, falling back to simple calculation');
    // Fallback to simple calculation without pre-registration assumption
    const totalSemesterWorkingDays = calculateSemesterWorkingDays(semesterStartDate, semesterEndDate);
    const elapsedWorkingDays = calculateElapsedWorkingDays(semesterStartDate);
    const remainingWorkingDays = calculateRemainingWorkingDays(semesterEndDate);
    
    const targetDaysForSemester = Math.ceil((targetPercentage / 100) * totalSemesterWorkingDays);
    const currentPerformancePercentage = elapsedWorkingDays > 0 ? (actualAttendedDays / elapsedWorkingDays) * 100 : 0;
    const stillNeedToAttend = Math.max(0, targetDaysForSemester - actualAttendedDays);
    const maxCanSkipInRemaining = Math.max(0, remainingWorkingDays - stillNeedToAttend);
    
    const currentRate = currentPerformancePercentage / 100;
    const projectedAttendanceInRemaining = remainingWorkingDays * currentRate;
    const projectedTotalAttended = actualAttendedDays + projectedAttendanceInRemaining;
    const projectedFinalPercentage = totalSemesterWorkingDays > 0 ? 
      (projectedTotalAttended / totalSemesterWorkingDays) * 100 : 0;
    
    return {
      requiredDays: stillNeedToAttend, 
      canSkipDays: maxCanSkipInRemaining, 
      isOnTrack: currentPerformancePercentage >= targetPercentage, 
      currentPerformancePercentage: Math.round(currentPerformancePercentage * 100) / 100,
      remainingWorkingDays: remainingWorkingDays, 
      targetDaysForSemester: targetDaysForSemester, 
      projectedFinalPercentage: Math.round(projectedFinalPercentage * 100) / 100,
      preRegistrationDays: 0, 
      postRegistrationDays: elapsedWorkingDays, 
      assumedPreRegistrationAttendance: 0,
      actualPostRegistrationPerformance: Math.round(currentPerformancePercentage * 100) / 100
    };
  }
  
  // Calculate periods
  const totalSemesterWorkingDays = calculateSemesterWorkingDays(semesterStartDate, semesterEndDate);
  const preRegistrationDays = calculateSemesterWorkingDays(semesterStartDate, registrationDate);
  const postRegistrationDaysToToday = calculateSemesterWorkingDays(registrationDate, today);
  const remainingDaysFromToday = calculateSemesterWorkingDays(today, semesterEndDate);
  
  console.log(`Pre-registration period: ${preRegistrationDays} working days`);
  console.log(`Post-registration to today: ${postRegistrationDaysToToday} working days`);
  console.log(`Remaining from today: ${remainingDaysFromToday} working days`);
  console.log(`Total semester: ${totalSemesterWorkingDays} working days`);
  
  // Calculate assumed pre-registration attendance (80% of pre-registration days)
  const assumedPreRegistrationAttendance = Math.round((targetPercentage / 100) * preRegistrationDays);
  
  // Calculate post-registration performance
  const actualPostRegistrationPerformance = postRegistrationDaysToToday > 0 ? 
    (actualAttendedDays / postRegistrationDaysToToday) * 100 : 0;
  
  // Calculate total attended days (assumed + actual)
  const totalAttendedDays = assumedPreRegistrationAttendance + actualAttendedDays;
  
  // Calculate overall performance
  const totalElapsedDays = preRegistrationDays + postRegistrationDaysToToday;
  const currentPerformancePercentage = totalElapsedDays > 0 ? 
    (totalAttendedDays / totalElapsedDays) * 100 : 0;
  
  console.log(`Assumed pre-registration attendance: ${assumedPreRegistrationAttendance} days (${targetPercentage}% of ${preRegistrationDays})`);
  console.log(`Actual post-registration performance: ${actualAttendedDays}/${postRegistrationDaysToToday} = ${actualPostRegistrationPerformance.toFixed(2)}%`);
  console.log(`Combined performance: ${totalAttendedDays}/${totalElapsedDays} = ${currentPerformancePercentage.toFixed(2)}%`);
  
  // Calculate target for entire semester
  const targetDaysForSemester = Math.ceil((targetPercentage / 100) * totalSemesterWorkingDays);
  
  // Calculate requirements for remaining period
  const stillNeedToAttend = Math.max(0, targetDaysForSemester - totalAttendedDays);
  const maxCanSkipInRemaining = Math.max(0, remainingDaysFromToday - stillNeedToAttend);
  
  // Project final percentage based on post-registration performance
  const projectedAttendanceInRemaining = remainingDaysFromToday * (actualPostRegistrationPerformance / 100);
  const projectedTotalAttended = totalAttendedDays + projectedAttendanceInRemaining;
  const projectedFinalPercentage = totalSemesterWorkingDays > 0 ? 
    (projectedTotalAttended / totalSemesterWorkingDays) * 100 : 0;
  
  const isOnTrack = currentPerformancePercentage >= targetPercentage;
  
  console.log(`Target for semester: ${targetDaysForSemester} days (${targetPercentage}% of ${totalSemesterWorkingDays})`);
  console.log(`Still need to attend: ${stillNeedToAttend} days`);
  console.log(`Can skip in remaining: ${maxCanSkipInRemaining} days`);
  console.log(`Projected final: ${projectedFinalPercentage.toFixed(2)}% (if ${actualPostRegistrationPerformance.toFixed(2)}% rate continues)`);
  console.log(`Is on track: ${isOnTrack}`);
  console.log('=== END PRE-REGISTRATION CALCULATION ===\n');
  
  return {
    requiredDays: stillNeedToAttend,
    canSkipDays: maxCanSkipInRemaining,
    isOnTrack,
    currentPerformancePercentage: Math.round(currentPerformancePercentage * 100) / 100,
    remainingWorkingDays: remainingDaysFromToday,
    targetDaysForSemester,
    projectedFinalPercentage: Math.round(projectedFinalPercentage * 100) / 100,
    preRegistrationDays,
    postRegistrationDays: postRegistrationDaysToToday,
    assumedPreRegistrationAttendance,
    actualPostRegistrationPerformance: Math.round(actualPostRegistrationPerformance * 100) / 100
  };
};
export const calculateRequiredAttendanceDays = (
  currentAttendedDays: number,
  totalElapsedWorkingDays: number,
  totalSemesterWorkingDays: number,
  targetPercentage: number
): {
  requiredDays: number;
  canSkipDays: number;
  isOnTrack: boolean;
  currentPercentage: number;
  remainingWorkingDays: number;
  targetDaysForSemester: number;
  projectedFinalPercentage: number;
} => {
  console.log('\n=== ATTENDANCE CALCULATION DEBUG ===');
  console.log(`Input: attended=${currentAttendedDays}, elapsed=${totalElapsedWorkingDays}, total=${totalSemesterWorkingDays}, target=${targetPercentage}%`);
  
  // Calculate current attendance percentage
  const currentPercentage = totalElapsedWorkingDays > 0 ? 
    (currentAttendedDays / totalElapsedWorkingDays) * 100 : 0;
  
  console.log(`Current performance: ${currentAttendedDays}/${totalElapsedWorkingDays} = ${currentPercentage.toFixed(2)}%`);
  
  // Calculate target for entire semester
  const targetDaysForSemester = Math.ceil((targetPercentage / 100) * totalSemesterWorkingDays);
  console.log(`Target for semester: ${targetPercentage}% of ${totalSemesterWorkingDays} = ${targetDaysForSemester} days`);
  
  // Calculate remaining working days in semester
  const remainingWorkingDays = totalSemesterWorkingDays - totalElapsedWorkingDays;
  console.log(`Remaining working days: ${totalSemesterWorkingDays} - ${totalElapsedWorkingDays} = ${remainingWorkingDays}`);
  
  // Calculate how many more days needed to meet target
  const stillNeedToAttend = Math.max(0, targetDaysForSemester - currentAttendedDays);
  console.log(`Still need to attend: ${targetDaysForSemester} - ${currentAttendedDays} = ${stillNeedToAttend} days`);
  
  // Calculate how many days can be skipped in remaining period
  const maxCanSkipInRemaining = Math.max(0, remainingWorkingDays - stillNeedToAttend);
  console.log(`Can skip in remaining period: ${remainingWorkingDays} - ${stillNeedToAttend} = ${maxCanSkipInRemaining} days`);
  
  // Project final percentage if user maintains current behavior
  const currentRate = currentPercentage / 100;
  const projectedAttendanceInRemaining = remainingWorkingDays * currentRate;
  const projectedTotalAttended = currentAttendedDays + projectedAttendanceInRemaining;
  const projectedFinalPercentage = totalSemesterWorkingDays > 0 ? 
    (projectedTotalAttended / totalSemesterWorkingDays) * 100 : 0;
    
  console.log(`Projection: If current rate (${currentPercentage.toFixed(2)}%) continues:`);
  console.log(`- Will attend ${projectedAttendanceInRemaining.toFixed(1)} more days`);
  console.log(`- Total attended: ${projectedTotalAttended.toFixed(1)} days`);
  console.log(`- Final percentage: ${projectedFinalPercentage.toFixed(2)}%`);
  
  const isOnTrack = currentPercentage >= targetPercentage;
  console.log(`Is on track: ${isOnTrack} (${currentPercentage.toFixed(2)}% ${isOnTrack ? '>=' : '<'} ${targetPercentage}%)`);
  
  console.log('=== END CALCULATION DEBUG ===\n');
  
  return {
    requiredDays: stillNeedToAttend,
    canSkipDays: maxCanSkipInRemaining,
    isOnTrack,
    currentPercentage: Math.round(currentPercentage * 100) / 100,
    remainingWorkingDays,
    targetDaysForSemester,
    projectedFinalPercentage: Math.round(projectedFinalPercentage * 100) / 100
  };
};

/**
 * Get semester progress information
 */
export interface SemesterProgress {
  totalWorkingDays: number;
  elapsedWorkingDays: number;
  remainingWorkingDays: number;
  progressPercentage: number;
}

export const getSemesterProgress = (
  startDate: string | Date,
  endDate: string | Date
): SemesterProgress => {
  const totalWorkingDays = calculateSemesterWorkingDays(startDate, endDate);
  const elapsedWorkingDays = calculateElapsedWorkingDays(startDate);
  
  // Ensure elapsed doesn't exceed total (due to edge cases)
  const adjustedElapsed = Math.min(elapsedWorkingDays, totalWorkingDays);
  const adjustedRemaining = Math.max(0, totalWorkingDays - adjustedElapsed);
  
  const progressPercentage = totalWorkingDays > 0 ? 
    (adjustedElapsed / totalWorkingDays) * 100 : 0;
  
  return {
    totalWorkingDays,
    elapsedWorkingDays: adjustedElapsed,
    remainingWorkingDays: adjustedRemaining,
    progressPercentage: Math.round(progressPercentage * 100) / 100
  };
};

/**
 * Test function to verify calculations
 */
export const testSemesterCalculation = (startDate: string, endDate: string) => {
  console.log('\n=== SEMESTER CALCULATION TEST ===');
  console.log(`Period: ${startDate} to ${endDate}`);
  
  const result = getSemesterProgress(startDate, endDate);
  
  console.log('Semester Progress:');
  console.log(`- Total working days: ${result.totalWorkingDays}`);
  console.log(`- Elapsed working days: ${result.elapsedWorkingDays}`);
  console.log(`- Remaining working days: ${result.remainingWorkingDays}`);
  console.log(`- Progress: ${result.progressPercentage}%`);
  
  // Example calculation with dummy attendance data
  const dummyAttendedDays = 1; // As seen in logs
  const targetPercentage = 80;
  
  const attendanceCalc = calculateRequiredAttendanceDays(
    dummyAttendedDays,
    result.elapsedWorkingDays,
    result.totalWorkingDays,
    targetPercentage
  );
  
  console.log('\nAttendance Analysis:');
  console.log(`- Attended so far: ${dummyAttendedDays} days`);
  console.log(`- Current performance: ${attendanceCalc.currentPercentage}%`);
  console.log(`- Target: ${targetPercentage}%`);
  console.log(`- Need to attend (remaining): ${attendanceCalc.requiredDays} days`);
  console.log(`- Can skip (remaining): ${attendanceCalc.canSkipDays} days`);
  console.log(`- On track: ${attendanceCalc.isOnTrack ? 'YES' : 'NO'}`);
  
  console.log('=== END TEST ===\n');
  
  return result;
};

import { addMinutes, isWithinInterval, parseISO } from 'date-fns';

interface Shift {
  id?: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
}

export const validateShift = (
  newShift: Shift,
  existingShifts: Shift[],
  editingShiftId?: string
): { isValid: boolean; error?: string } => {
  const startTime = parseISO(newShift.start_time);
  const endTime = parseISO(newShift.end_time);

  // Check if end time is after start time
  if (endTime <= startTime) {
    return {
      isValid: false,
      error: 'End time must be after start time'
    };
  }

  // Check if shift duration is between 4 and 12 hours
  const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  if (durationInMinutes < 240 || durationInMinutes > 720) {
    return {
      isValid: false,
      error: 'Shift duration must be between 4 and 12 hours'
    };
  }

  // Check for overlapping shifts for the same employee
  const overlappingShift = existingShifts.find(shift => {
    // Skip the current shift being edited
    if (editingShiftId && shift.id === editingShiftId) return false;
    
    // Only check shifts for the same employee
    if (shift.employee_id !== newShift.employee_id) return false;

    const existingStart = parseISO(shift.start_time);
    const existingEnd = parseISO(shift.end_time);

    // Check if either the start or end time falls within an existing shift
    return (
      isWithinInterval(startTime, { start: existingStart, end: existingEnd }) ||
      isWithinInterval(endTime, { start: existingStart, end: existingEnd }) ||
      isWithinInterval(existingStart, { start: startTime, end: endTime })
    );
  });

  if (overlappingShift) {
    return {
      isValid: false,
      error: 'This shift overlaps with another shift for the same employee'
    };
  }

  // Check for minimum rest period between shifts (8 hours)
  const hasInsufficientRest = existingShifts.some(shift => {
    if (editingShiftId && shift.id === editingShiftId) return false;
    if (shift.employee_id !== newShift.employee_id) return false;

    const existingStart = parseISO(shift.start_time);
    const existingEnd = parseISO(shift.end_time);
    const minRestPeriod = 8 * 60; // 8 hours in minutes

    const restAfterExisting = (startTime.getTime() - existingEnd.getTime()) / (1000 * 60);
    const restBeforeExisting = (existingStart.getTime() - endTime.getTime()) / (1000 * 60);

    return restAfterExisting > 0 && restAfterExisting < minRestPeriod ||
           restBeforeExisting > 0 && restBeforeExisting < minRestPeriod;
  });

  if (hasInsufficientRest) {
    return {
      isValid: false,
      error: 'Employees must have at least 8 hours of rest between shifts'
    };
  }

  return { isValid: true };
};

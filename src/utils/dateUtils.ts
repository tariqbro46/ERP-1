
import { format, parse, isValid } from 'date-fns';

/**
 * Formats a standard YYYY-MM-DD date string into the user's preferred format.
 */
export function formatDate(dateStr: string | undefined | null, targetFormat: string = 'DD-MM-YYYY'): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (!isValid(date)) return dateStr;
    
    // Map our human-readable formats to date-fns formats
    const formatMap: Record<string, string> = {
      'DD-MM-YYYY': 'dd-MM-yyyy',
      'MM-DD-YYYY': 'MM-dd-yyyy',
      'YYYY-MM-DD': 'yyyy-MM-dd',
      'DD/MM/YYYY': 'dd/MM/yyyy',
      'MM/DD/YYYY': 'MM/dd/yyyy',
      'DD.MM.YYYY': 'dd.MM.yyyy',
    };

    const fnsFormat = formatMap[targetFormat] || 'dd-MM-yyyy';
    return format(date, fnsFormat);
  } catch (e) {
    return dateStr;
  }
}

/**
 * Parses flexible user input like 1-1-25, 1.1.25, 1*1*25 into a standard YYYY-MM-DD string.
 */
export function parseDateInput(input: string): string | null {
  if (!input) return null;

  // Replace common delimiters with a standard one (-)
  const normalizedInput = input.replace(/[./* ]/g, '-');
  const parts = normalizedInput.split('-');

  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];

    // Handle single digit day/month
    if (day.length === 1) day = '0' + day;
    if (month.length === 1) month = '0' + month;

    // Handle 2-digit years
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100);
      year = century.toString() + year;
    }

    // Attempt to create a valid ISO date string (YYYY-MM-DD)
    // We assume the user is inputting DD-MM-YYYY unless otherwise specified, 
    // but we can try to be smart or just follow a default priority.
    // Given the request context (Bangladesh/Tally), DD-MM-YYYY is most common.
    
    const isoDateCandidate = `${year}-${month}-${day}`;
    const date = new Date(isoDateCandidate);
    
    if (isValid(date) && date.getFullYear() > 1900) {
      return format(date, 'yyyy-MM-dd');
    }
  }

  // Fallback: try standard new Date parsing
  try {
    const date = new Date(input);
    if (isValid(date) && date.getFullYear() > 1900) {
      return format(date, 'yyyy-MM-dd');
    }
  } catch (e) {}

  return null;
}

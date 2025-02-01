import {Component} from '@angular/core';
import {Workbook} from "exceljs";

interface ProcessedRecord {
  date: string;      // e.g., "2024/10/14"
  clockIn: string;   // formatted as "HH:mm"
  clockOut: string;  // formatted as "HH:mm"
  leaveHours: number | ""; // may be a partial number of hours
  workHours: number | "";
}

interface ProcessedData {
  name: string;
  records: ProcessedRecord[];
}

interface FileData {
  name: string;
  workbook: Workbook; // Assume this comes from your Excel library (e.g., ExcelJS)
}

@Component({
  selector: 'app-attendance-converter',
  templateUrl: './attendance-converter.component.html',
  styleUrl: './attendance-converter.component.css',
})
export class AttendanceConverterComponent {
  filesData: FileData[] = [];
  excelUploaded = false;

  dataHeaders: string[] = [];
  dataRows: string[][] = [];
  dataUploaded = false;

  filePrefix = new Date().toLocaleDateString('zh-TW', {year: 'numeric', month: 'long'}) + '工時表';

  async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    for (const file of Array.from(input.files)) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet('1月');
      if (!worksheet) return;
      const cellI3 = worksheet.getCell('I3').value;
      const name = cellI3 ? cellI3.toString() : '';
      this.filesData.push({name, workbook});
    }
    this.excelUploaded = true;
  }

  async onDataFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const file = input.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0]; // Load the first sheet
    if (!worksheet) return;

    this.dataHeaders = [];
    this.dataRows = [];

    worksheet.eachRow((row, rowNumber) => {
      const rowData = row.values as (string | null)[];
      // Remove first undefined value (ExcelJS row.values starts with index 1)
      rowData.shift();

      if (rowNumber === 1) {
        this.dataHeaders = rowData.map(cell => (cell ? cell.toString() : ''));
      } else {
        this.dataRows.push(rowData.map(cell => (cell ? cell.toString() : '')));
      }
    });

    console.log(this.processAttendance(this.dataRows));
    this.updateExcelData(this.filesData, this.processAttendance(this.dataRows));
    console.log(this.filesData);
    this.dataUploaded = true;
  }

  /**
   * Processes the raw attendance rows into the desired structure.
   *
   * Assumptions:
   * 1. For clock records (type “上班打卡” or “下班打卡”), we use the Completion time.
   * 2. For each day per employee, clockIn is the earliest Completion time and clockOut the latest.
   * 3. workHours = (clockOut - clockIn) in hours, minus 1 if the period covers 12:30–13:30, then floored.
   * 4. Leave records (type “請假”) are processed by calculating the overlap (in hours) with
   *    each day’s working window (08:30–17:30).
   * 5. All date strings in dataRows are in UTC; this code converts them to UTC+8.
   *
   * @param dataRows Raw data rows from Excel (each row is an array of strings or nulls)
   */
  processAttendance(dataRows: (string | null)[][]): ProcessedData[] {

    /**
     * Converts a UTC date string to a Date object adjusted to UTC+8.
     * @param dateStr A UTC date string.
     * @returns A new Date object with 8 hours added.
     */
    function parseAndAdjust(dateStr: string): Date {
      const d = new Date(dateStr);
      // Add 8 hours (in milliseconds)
      return new Date(d.getTime() - 8 * 60 * 60 * 1000);
    }

    /**
     * Formats a Date object into a "HH:mm" string in 24-hour format.
     * @param date The Date to format.
     */
    function formatTime(date: Date): string {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    /**
     * Formats a Date object into a "YYYY/MM/DD" string.
     * @param date The Date to format.
     */
    function formatDate(date: Date): string {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}/${month}/${day}`;
    }

    /**
     * For a given leave period and a specific day, calculates the number of leave hours
     * that fall within the working hours of that day (assumed 08:30–17:30).
     * If the leave spans the full lunch period (12:30–13:30), subtract one hour.
     * @param leaveStart The start of the leave period (UTC+8 adjusted).
     * @param leaveEnd The end of the leave period (UTC+8 adjusted).
     * @param currentDay A Date object representing the day (set to midnight).
     * @returns The number of leave hours for the current day.
     */
    function calculateLeaveForDay(leaveStart: Date, leaveEnd: Date, currentDay: Date): number {
      // Define work day window for the current day:
      const workStart = new Date(currentDay);
      workStart.setHours(8, 30, 0, 0);
      const workEnd = new Date(currentDay);
      workEnd.setHours(17, 30, 0, 0);

      // The effective leave period on this day is the overlap of [workStart, workEnd]
      // with the leave period [leaveStart, leaveEnd].
      const effectiveStart = leaveStart > workStart ? leaveStart : workStart;
      const effectiveEnd = leaveEnd < workEnd ? leaveEnd : workEnd;

      if (effectiveEnd <= effectiveStart) {
        return 0;
      }
      let hours = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60);

      // Subtract 1 hour for lunch if the effective period covers 12:30–13:30.
      const lunchStart = new Date(currentDay);
      lunchStart.setHours(12, 30, 0, 0);
      const lunchEnd = new Date(currentDay);
      lunchEnd.setHours(13, 30, 0, 0);
      if (effectiveStart <= lunchStart && effectiveEnd >= lunchEnd) {
        hours -= 1;
      }
      return hours;
    }


    // Group data by employee name and by date.
    type GroupedDay = { clockTimes: Date[]; leaveHours: number };
    const grouped: { [empName: string]: { [date: string]: GroupedDay } } = {};

    dataRows.forEach(row => {
      // Columns (based on your header order):
      // 0: ID, 1: Start time, 2: Completion time, 3: Email, 4: Name, 5: 部門,
      // 6: 打卡/請假, 7: 名字, 8: 附上圖片, 9: 請假事由, 10: 請假時間(起), 11: 請假時間(迄)
      const recordType = row[6];    // "打卡/請假"
      const empName = row[7];       // employee name
      if (!empName) return;         // skip if no name

      if (!grouped[empName]) {
        grouped[empName] = {};
      }

      if (recordType === "請假") {
        // For a leave record, adjust the start and end times.
        const leaveStartStr = row[10];
        const leaveEndStr = row[11];
        if (!leaveStartStr || !leaveEndStr) return;
        const leaveStart = parseAndAdjust(leaveStartStr);
        const leaveEnd = parseAndAdjust(leaveEndStr);

        // Loop over each day in the leave period.
        // We start from the day of leaveStart (set to midnight) to the day of leaveEnd.
        let currentDate = new Date(leaveStart.getTime());
        currentDate.setHours(0, 0, 0, 0);
        const endDate = new Date(leaveEnd.getTime());
        endDate.setHours(0, 0, 0, 0);
        while (currentDate <= endDate) {
          const leaveForDay = calculateLeaveForDay(leaveStart, leaveEnd, currentDate);
          const dateKey = formatDate(currentDate);
          if (!grouped[empName][dateKey]) {
            grouped[empName][dateKey] = {clockTimes: [], leaveHours: 0};
          }
          if (grouped[empName][dateKey].leaveHours === 8) {
            // Skip if the leave hours for the day are already 8.
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }
          grouped[empName][dateKey].leaveHours += leaveForDay;
          // Move to the next day.
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Process clock records: adjust the Completion time from UTC to UTC+8.
        const compTimeStr = row[2];
        if (!compTimeStr) return;
        const compTime = parseAndAdjust(compTimeStr);
        if (Number.isNaN(compTime.getTime())) return; // skip if invalid date
        const dateKey = formatDate(compTime);
        if (!grouped[empName][dateKey]) {
          grouped[empName][dateKey] = {clockTimes: [], leaveHours: 0};
        }
        grouped[empName][dateKey].clockTimes.push(compTime);
      }
    });

    // Build processed records for each employee.
    const processedData: ProcessedData[] = [];
    for (const empName in grouped) {
      const dailyRecords: ProcessedRecord[] = [];
      for (const dateKey in grouped[empName]) {
        const entry = grouped[empName][dateKey];
        let clockIn: Date | null = null;
        let clockOut: Date | null = null;
        if (entry.clockTimes.length > 0) {
          // Earliest time becomes clockIn and latest becomes clockOut.
          clockIn = new Date(Math.min(...entry.clockTimes.map(dt => dt.getTime())));
          clockOut = new Date(Math.max(...entry.clockTimes.map(dt => dt.getTime())));
        }
        // Compute work hours (flooring the number) if valid clock times exist.
        let workHours: number | "" = "";
        if (clockIn && clockOut) {
          let diffHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          // Subtract 1 hour if the period covers lunch break (12:30–13:30).
          const lunchStart = new Date(clockIn);
          lunchStart.setHours(12, 30, 0, 0);
          const lunchEnd = new Date(clockIn);
          lunchEnd.setHours(13, 30, 0, 0);
          if (clockIn <= lunchStart && clockOut >= lunchEnd) {
            diffHours -= 1;
          }
          workHours = Math.floor(diffHours);
          if (workHours > 8) { // Cap work hours at 8 hours.
            workHours = 8;
          }
        }
        dailyRecords.push({
          date: dateKey,
          clockIn: clockIn ? formatTime(clockIn) : "",
          clockOut: clockOut ? formatTime(clockOut) : "",
          leaveHours: entry.leaveHours || "",
          workHours
        });
      }
      // Optionally, sort records by date.
      dailyRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      processedData.push({name: empName, records: dailyRecords});
    }
    return processedData;
  }

  updateExcelData(filesData: FileData[], processedData: ProcessedData[]): void {
    // Iterate through each processed data record
    processedData.forEach((data) => {
      // Find the matching fileData by name
      const fileData = filesData.find((file) => file.name === data.name);
      if (!fileData) {
        console.warn(`No workbook found for ${data.name}`);
        return;
      }

      // Group the records by month (extracted from the "YYYY/MM/DD" date format)
      const recordsByMonth = new Map<number, ProcessedRecord[]>();
      data.records.forEach((record) => {
        const dateParts = record.date.split('/');
        if (dateParts.length !== 3) {
          console.warn(`Invalid date format for record: ${record.date}`);
          return;
        }
        // Parse month as number (assuming "MM" in the date string)
        const month = parseInt(dateParts[1], 10);
        if (!recordsByMonth.has(month)) {
          recordsByMonth.set(month, []);
        }
        recordsByMonth.get(month)!.push(record);
      });

      // Update each month's worksheet in the workbook
      recordsByMonth.forEach((records, month) => {
        const sheetName = `${month}月`;  // e.g., "1月", "2月", ..., "12月"
        const worksheet = fileData.workbook.getWorksheet(sheetName);
        if (!worksheet) {
          console.warn(`Worksheet ${sheetName} not found in workbook for ${data.name}`);
          return;
        }

        // Set the static cells
        // I3 gets the employee name
        worksheet.getCell('I3').value = data.name;
        // C4 is always set to '大聯大控股'
        worksheet.getCell('C4').value = '大聯大控股';

        // For each record in this month, determine the correct row based on the day.
        records.forEach((record) => {
          // Split the date to extract the day
          const dateParts = record.date.split('/');
          const day = parseInt(dateParts[2], 10);
          // Calculate the row: row 7 corresponds to the 1st day (i.e., row = day + 6)
          const rowNumber = day + 6;

          // Update the cells:
          // Column D: clockIn
          worksheet.getCell(`D${rowNumber}`).value = record.clockIn;
          // Column E: clockOut
          worksheet.getCell(`E${rowNumber}`).value = record.clockOut;
          // Column F: leaveHours (this can be a number or an empty string)
          worksheet.getCell(`F${rowNumber}`).value = record.leaveHours;
          // Column H: workHours
          worksheet.getCell(`H${rowNumber}`).value = record.workHours;

          // if leaveHours + workHours is not equal to 8, mark the row with a yellow background
          if ((Number(record.leaveHours) || 0) + (Number(record.workHours) || 0) !== 8) {
            const row = worksheet.getRow(rowNumber);
            // Define the target columns either by letters or by index (D=4, E=5, G=7)
            const targetColumns = ['D', 'E', 'H'];
            // Alternatively: const targetColumns = [4, 5, 7];

            targetColumns.forEach((col) => {
              const cell = row.getCell(col); // Works with letters or numbers
              cell.style = {
                ...cell.style, fill: {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: {argb: 'FFFF00'}
                }
              };
            });
          }
        });
      });
    });
  }


  async downloadExcels(): Promise<void> {
    for (const file of this.filesData) {
      try {
        // Generate an ArrayBuffer from the workbook using ExcelJS
        const buffer: ArrayBuffer = await file.workbook.xlsx.writeBuffer();

        // Create a Blob from the buffer with the appropriate Excel MIME type
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        // Create an object URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger the download
        const link = document.createElement("a");
        link.href = url;
        link.download = `${this.filePrefix}_${file.name}.xlsx`;  // Set the file name for download

        // Append the link to the DOM, trigger a click, and remove it afterward
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Revoke the object URL to free up resources
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`Error downloading Excel file for ${file.name}:`, error);
      }
    }
  }

}

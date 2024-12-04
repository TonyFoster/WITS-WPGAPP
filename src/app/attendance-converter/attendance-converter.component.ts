import {Component, Inject, PLATFORM_ID} from '@angular/core';
import * as XLSX from 'xlsx';
import {isPlatformBrowser} from '@angular/common';

@Component({
  selector: 'app-attendance-converter',
  templateUrl: './attendance-converter.component.html',
  styleUrl: './attendance-converter.component.css',
})
export class AttendanceConverterComponent {
  workbook: XLSX.WorkBook | undefined;
  tabs: { name: string; data: any[] }[] = [];
  activeTabIndex: number = 0;

  data: any;
  colHeaders = ['Date', 'Start', 'Finish', 'AB Hrs', 'OT Hrs', 'Total Hrs'];
  columns = [
    {data: 'Date', readOnly: true},
    {data: 'Start', readOnly: true},
    {data: 'Finish', readOnly: true},
    {data: 'AB Hrs', type: 'numeric'},
    {data: 'OT Hrs', type: 'numeric'},
    {data: 'Total Hrs', type: 'numeric'},
  ];
  rowHeaders = true;
  width = '100%';
  licenseKey = 'non-commercial-and-evaluation';
  cell: any[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
  }

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  handleFile(event: any) {
    const file = event.target.files[0];
    if (!file) {
      alert('No file selected');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = e.target.result;
      this.workbook = XLSX.read(data, {type: 'binary'});
      this.initializeTabs();
    };
    reader.onerror = (error) => console.error(error);
    reader.readAsBinaryString(file);
  }

  initializeTabs(): void {
    if (!this.workbook) {
      alert('Please upload an Excel file first.');
      return;
    }

    const timestampsByName: { [name: string]: Date[] } = {};
    let mostRecentDate = new Date(0); // Initialize to a very old date

    this.workbook.SheetNames.forEach((sheetName) => {
      const worksheet = this.workbook!.Sheets[sheetName];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {header: 1});

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row[2] && row[7]) {
          const name = row[7];
          const excelDate = row[2];
          const jsDate = this.convertExcelDateToJSDate(excelDate);
          if (!timestampsByName[name]) {
            timestampsByName[name] = [];
          }
          timestampsByName[name].push(jsDate);
          if (jsDate > mostRecentDate) {
            mostRecentDate = jsDate; // Update most recent date found
          }
        }
      }
    });

    const mostRecentYear = mostRecentDate.getFullYear();
    const mostRecentMonth = mostRecentDate.getMonth();

    this.tabs = Object.keys(timestampsByName).map((name) => {
      // Filter timestamps to include only the most recent month and year found
      const timestamps = timestampsByName[name].filter(date =>
        date.getFullYear() === mostRecentYear && date.getMonth() === mostRecentMonth
      );

      const dict: { [key: string]: { start: Date; end: Date } } = {};
      const dateArray: Date[] = [];

      timestamps.forEach((timestamp) => {
        const dateObj = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
        const dateKey = this.formatDate(dateObj);

        if (!dict[dateKey]) {
          dict[dateKey] = {start: timestamp, end: timestamp};
          dateArray.push(dateObj);
        } else {
          if (timestamp < dict[dateKey].start) {
            dict[dateKey].start = timestamp;
          }
          if (timestamp > dict[dateKey].end) {
            dict[dateKey].end = timestamp;
          }
        }
      });

      // Generate all dates for the month
      const allDates: Date[] = [];
      const startDate = new Date(mostRecentYear, mostRecentMonth, 1);
      const endDate = new Date(mostRecentYear, mostRecentMonth + 1, 0);
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        allDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Map through all dates to create table data
      const tableData = allDates.map((date) => {
        const dateKey = this.formatDate(date);
        const entry = dict[dateKey];
        let start = '';
        let finish = '';
        let total = '';

        if (entry) {
          start = this.formatTime(entry.start);
          finish = this.formatTime(entry.end);

          const totalMinutes = (entry.end.getTime() - entry.start.getTime()) / (1000 * 60);
          let totalHours = totalMinutes / 60;
          if (totalHours > 5) {
            totalHours -= 1; // Subtract 1 hour for breaks
          }
          total = totalHours.toFixed(2);
        }

        return {
          Date: dateKey,
          Start: start,
          Finish: finish,
          'AB Hrs': '',
          'OT Hrs': '',
          'Total Hrs': this.adjustedTotal(total),
        };
      });

      return {name, data: tableData};
    });
  }


  setActiveTab(index: number): void {
    this.activeTabIndex = index;
    this.data = this.tabs[index].data;
    this.cell = this.updateHighlightRow(this.data);
  }

  updateHighlightRow(data: any[]): any[] {
    let cell: any[] = [];
    data.forEach((row, index) => {
      if (new Date(row['Date']).getDay() > 0 && new Date(row['Date']).getDay() < 6) {
        if (row['Total Hrs'] != 8) {
          for (let i = 0; i < Object.keys(row).length; i++) {
            cell.push({row: index, col: i, className: 'red'});
          }
        }
      }
    });
    return cell;
  }


  convertExcelDateToJSDate(excelDate: number): Date {
    const baseDate = new Date(Date.UTC(1900, 0, 1));
    const days = Math.floor(excelDate) - (excelDate > 60 ? 2 : 1);
    const fractionOfDay = excelDate - Math.floor(excelDate);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    baseDate.setUTCDate(baseDate.getUTCDate() + days);
    baseDate.setUTCMilliseconds(baseDate.getUTCMilliseconds() + (fractionOfDay * millisecondsPerDay));

    // Adjust the baseDate to UTC+8
    const utc8Date = new Date(baseDate.getTime() - 8 * 60 * 60 * 1000);

    return utc8Date;
  }

  private formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${month < 10 ? '0' + month : month}/${day < 10 ? '0' + day : day}/${year}`;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr}`;
  }

  adjustedTotal(value: any): any {
    if (value === '' || value == null) {
      return ''; // Keep empty values as they are
    }
    const total = Math.floor(Number(value));
    return total > 8 ? 8 : total;
  }
}

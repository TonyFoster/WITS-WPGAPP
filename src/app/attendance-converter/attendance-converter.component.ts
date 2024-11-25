import {Component} from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-attendance-converter',
  templateUrl: './attendance-converter.component.html',
  styleUrl: './attendance-converter.component.css'
})
export class AttendanceConverterComponent {
  workbook: XLSX.WorkBook | undefined;
  tabs: { name: string; data: { date: string; start: string; end: string; total: string }[] }[] = [];
  activeTabIndex: number = 0;
  outputHtml: string = '';

  handleFile(event: any) {
    const file = event.target.files[0];
    if (!file) {
      alert('No file selected');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = e.target.result;
      this.workbook = XLSX.read(data, { type: 'binary' });
      this.formatTimes();
    };
    reader.onerror = (error) => console.error(error);
    reader.readAsBinaryString(file);
  }

  formatTimes(): void {
    if (!this.workbook) {
      alert('Please upload an Excel file first.');
      return;
    }

    const firstSheetName = this.workbook.SheetNames[0];
    const worksheet = this.workbook.Sheets[firstSheetName];
    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const timestampsByName: { [name: string]: Date[] } = {};
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
      }
    }

    this.tabs = Object.keys(timestampsByName).map((name) => {
      const timestamps = timestampsByName[name];
      const dict: { [key: string]: { start: Date; end: Date } } = {};
      const dateArray: Date[] = [];

      timestamps.forEach((timestamp) => {
        const dateObj = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
        const dateKey = this.formatDate(dateObj);

        if (!dict[dateKey]) {
          dict[dateKey] = { start: timestamp, end: timestamp };
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

      // Ensure all dates in the range are included
      dateArray.sort((a, b) => a.getTime() - b.getTime());
      const firstDate = new Date(dateArray[0]);
      const lastDate = new Date(dateArray[dateArray.length - 1]);
      const allDates: Date[] = [];

      let currentDate = new Date(firstDate);
      while (currentDate <= lastDate) {
        allDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const tableData = allDates.map((date) => {
        const dateKey = this.formatDate(date);
        const entry = dict[dateKey];
        let start = '';
        let end = '';
        let total = '';

        if (entry) {
          start = this.formatTime(entry.start);
          end = this.formatTime(entry.end);

          const totalMinutes = (entry.end.getTime() - entry.start.getTime()) / (1000 * 60);
          let totalHours = totalMinutes / 60;
          if (totalHours > 5) {
            totalHours -= 1; // Subtract 1 hour for breaks
          }
          total = totalHours.toFixed(2);
        }

        return {
          date: dateKey,
          start,
          end,
          total,
        };
      });

      return { name, data: tableData };
    });
  }

  setActiveTab(index: number): void {
    this.activeTabIndex = index;
  }


  private convertExcelDateToJSDate(excelDate: number): Date {
    const utcDate = new Date((excelDate - (25567 + 1)) * 86400 * 1000);
    // Adjust to UTC+8
    const offsetMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    return new Date(utcDate.getTime() - offsetMilliseconds);
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

  protected readonly Number = Number;

  adjustedTotal(value: any): any {
    if (value === '' || value == null) {
      return ''; // Keep empty values as they are
    }
    const total = Math.floor(Number(value));
    return total > 8 ? 8 : total;
  }


}

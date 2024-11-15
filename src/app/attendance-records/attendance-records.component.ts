import {Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AttendanceRecord} from '../attendance-record';
import {CookieService} from 'ngx-cookie-service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-attendance-records',
  templateUrl: './attendance-records.component.html',
  styleUrl: './attendance-records.component.css'
})
export class AttendanceRecordsComponent {
  recordsUrl = 'https://api.tony19907051.com/wits/records';
  records: AttendanceRecord[] = [];
  errorMessage = '';
  name: string = '';

  constructor(private http: HttpClient, public cookieService: CookieService, private router: Router) {
    this.getName();
  }

  ngOnInit(): void {
    this.getAttendanceRecords();
  }

  getAttendanceRecords(): void {
    this.http.get<AttendanceRecord[]>(this.recordsUrl + '?name=' + this.name).subscribe({
      next: (records) => {
        this.records = records;
        this.records.map(record => {
          record.createdAt = new Date(Number(record.createdAt) * 1000);
        })
        this.records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }, error: (err) => {
        this.errorMessage = JSON.stringify(err.error);
      }
    });
  }

  getName() {
    this.name = this.cookieService.get('name');
  }

  goHome() {
    this.router.navigate(['/']).then();
  }
}

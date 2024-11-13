import {Component} from '@angular/core';
import {CookieService} from 'ngx-cookie-service';
import {MatDialog} from '@angular/material/dialog';
import {NameSelectorModalComponent} from './name-selector-modal/name-selector-modal.component';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  name: string = '';
  motd: string = '';
  errorMessage: string = '';
  checkUrl = 'https://api.tony19907051.com/wits/check';

  constructor(public cookieService: CookieService, private dialog: MatDialog, private http: HttpClient) {
    this.getName();
    this.getMOTD();
  }

  check() {
    this.errorMessage = '';
    if (this.name === '') {
      this.error('Please set your name first!');
      return;
    }

    this.http.post<any>(this.checkUrl, { name: this.name }).subscribe({
      next: (result) => {
        alert("Success!");
      },
      error: (err) => {
        this.error(JSON.stringify(err.error));
      }
    });

  }

  error(message: string) {
    this.errorMessage = message;
  }

  viewAttendanceRecords() {

  }

  requestLeave() {

  }

  enableNotifications() {

  }

  getName() {
    this.name = this.cookieService.get('name');
  }

  setName() {
    const dialogRef = this.dialog.open(NameSelectorModalComponent, {
      width: '300px'
    });

    dialogRef.afterClosed().subscribe((selectedName: string | undefined) => {
      if (selectedName) {
        this.cookieService.set('name', selectedName);
        this.getName();
      }
    });
  }

  getMOTD(): string {
    return 'Hello World!';
  }

  updateMOTD() {

  }
}

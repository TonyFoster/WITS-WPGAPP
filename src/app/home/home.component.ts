import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {Router} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from '@angular/common/http';
import {NameSelectorModalComponent} from '../name-selector-modal/name-selector-modal.component';
import {isPlatformBrowser} from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  name: string = '';
  motd: string = '';
  errorMessage: string = '';
  checkButtonText: string = 'Check';
  checkUrl = 'https://api.tony19907051.com/wits/check';
  lastCheckTimeUrl = 'https://api.tony19907051.com/wits/lastCheckTime';
  lastCheckTime: Date = new Date();

  constructor(private router: Router,
              public cookieService: CookieService,
              private dialog: MatDialog,
              private http: HttpClient,
              @Inject(PLATFORM_ID) private platformId: Object) {
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.getName();
      this.getMOTD();
      this.getLastCheckTime();
    }
  }

  check() {
    if (this.checkButtonText !== 'Check') {
      return;
    }
    this.errorMessage = '';
    if (this.name === '') {
      this.error('Please set your name first!');
      return;
    }

    this.checkButtonText = 'Checking...';

    this.http.post<any>(this.checkUrl, {name: this.name}).subscribe({
      next: (result) => {
        this.checkButtonText = 'Checked!';
        setTimeout(() => {
          this.checkButtonText = 'Check';
        }, 1000 * 10);
        this.getLastCheckTime();
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
    this.router.navigate(['/attendance-records']).then();
  }

  requestLeave() {

  }

  enableNotifications() {

  }

  getLastCheckTime() {
    this.http.get<any>(this.lastCheckTimeUrl + '?name=' + this.name).subscribe({
      next: (response) => {
        this.lastCheckTime = new Date(Number(response.lastCheckTime) * 1000);
      },
      error: (err) => {
        this.error(JSON.stringify(err.error));
      }
    });

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

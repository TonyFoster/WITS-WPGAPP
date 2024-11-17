import {Component, OnInit} from '@angular/core';
import {FcmService} from './fcm.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(private fcmService: FcmService) {}

  ngOnInit() {
    this.fcmService.requestPermission();
    this.fcmService.listenForMessages();
  }
}

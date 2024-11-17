import {Injectable} from '@angular/core';
import {AngularFireMessaging} from '@angular/fire/compat/messaging';

@Injectable({
  providedIn: 'root'
})
export class FcmService {

  constructor(private afMessaging: AngularFireMessaging) {
  }

  requestPermission() {
    console.log(this.afMessaging);
    console.log(this.afMessaging.requestToken);
    this.afMessaging.requestToken.subscribe(next => {
      console.log(next);
    });
  }

  listenForMessages() {
    this.afMessaging.messages.subscribe((message) => {
      console.log('FCM Message:', message);
    });
  }
}

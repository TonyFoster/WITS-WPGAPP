import {NgModule, isDevMode} from '@angular/core';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ServiceWorkerModule} from '@angular/service-worker';
import {NameSelectorModalComponent} from './name-selector-modal/name-selector-modal.component';
import {AttendanceRecordsComponent} from './attendance-records/attendance-records.component';
import {HomeComponent} from './home/home.component';
import {HoldButtonComponent} from './home/hold-button/hold-button.component';
import {FormsModule} from '@angular/forms';
import {CookieService} from 'ngx-cookie-service';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideHttpClient} from '@angular/common/http';
import {AttendanceConverterComponent} from './attendance-converter/attendance-converter.component';

@NgModule({
  declarations: [
    AppComponent,
    NameSelectorModalComponent,
    AttendanceRecordsComponent,
    HomeComponent,
    HoldButtonComponent,
    AttendanceConverterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    FormsModule
  ],
  providers: [
    provideClientHydration(),
    CookieService,
    provideAnimationsAsync(),
    provideHttpClient(),
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

import {NgModule} from '@angular/core';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {CookieService} from 'ngx-cookie-service';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {NameSelectorModalComponent} from './name-selector-modal/name-selector-modal.component';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {provideHttpClient} from '@angular/common/http';
import {AttendanceRecordsComponent} from './attendance-records/attendance-records.component';
import { HomeComponent } from './home/home.component';
import { HoldButtonComponent } from './home/hold-button/hold-button.component';

@NgModule({
  declarations: [
    AppComponent,
    NameSelectorModalComponent,
    AttendanceRecordsComponent,
    HomeComponent,
    HoldButtonComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatFormField,
    MatSelect,
    FormsModule,
    MatOption,
    MatButton,
    MatLabel
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

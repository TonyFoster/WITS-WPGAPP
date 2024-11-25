import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AttendanceRecordsComponent} from './attendance-records/attendance-records.component';
import {HomeComponent} from './home/home.component';
import {AttendanceConverterComponent} from './attendance-converter/attendance-converter.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'attendance-records', component: AttendanceRecordsComponent },
  { path: 'attendance-converter', component: AttendanceConverterComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

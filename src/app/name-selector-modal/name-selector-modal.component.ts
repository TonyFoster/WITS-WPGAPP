import {Component, EventEmitter, Inject, Output} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-name-selector-modal',
  templateUrl: './name-selector-modal.component.html',
  styleUrl: './name-selector-modal.component.css'
})
export class NameSelectorModalComponent {

  selectedName: string = '';
  names: string[] = ['侯性男', '劉仁傑', '陳祈男', '吳印', '虞振華', '盧宥銨', '鍾學明', '林昶翰', '沈羽碒'];
  filteredNames: string[] = [];

  constructor(public dialogRef: MatDialogRef<NameSelectorModalComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.filterNames();
  }


  // Filter names based on the input
  filterNames() {
    const inputValue = this.selectedName.toLowerCase();
    this.filteredNames = this.names.filter(name =>
      name.toLowerCase().includes(inputValue)
    );
  }

  // Set selected name from suggestions
  selectName(name: string) {
    this.selectedName = name;
    this.filteredNames = []; // Hide suggestions after selection
  }

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    this.dialogRef.close(this.selectedName);
  }
}

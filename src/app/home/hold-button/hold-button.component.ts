import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-hold-button',
  templateUrl: './hold-button.component.html',
  styleUrl: './hold-button.component.css'
})
export class HoldButtonComponent {
  isHolding = false;
  progress = 0;
  private interval: any;
  @Output() clicked = new EventEmitter<void>();
  @Output() touched = new EventEmitter<void>();
  @Input() buttonText: string = 'Hold to click';

  startHold() {
    this.touched.emit();
    this.isHolding = true;
    this.progress = 20;
    this.interval = setInterval(() => {
      this.progress += 1;
      if (this.progress >= 100) {
        this.progress = 100;
        this.completeHold();
      }
    }, 10);
  }

  cancelHold() {
    this.isHolding = false;
    this.progress = 0;
    clearInterval(this.interval);
  }

  completeHold() {
    this.clicked.emit();
    setTimeout(() => {
      this.cancelHold();
    }, 1000);
  }
}

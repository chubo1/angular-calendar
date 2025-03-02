import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-appointment-item',
  templateUrl: './appointment-item.component.html',
  styleUrls: ['./appointment-item.component.scss']
})
export class AppointmentItemComponent {
  @Input() appointment: { title: string, interval: string} = { title: '', interval: '' };
}

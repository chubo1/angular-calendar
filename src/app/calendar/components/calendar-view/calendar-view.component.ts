import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'
import { AppointmentDialogComponent } from './appointment-dialog/appointment-dialog.component';
import { DeleteAppointmentComponent } from './delete-appointment/delete-appointmentcomponent';
import { AppointmentService } from '../../../services/appointment.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Appointment } from '../../../models/appointment.model';
import { AppointmentItemComponent } from '../appointment-item/appointment-item.component';


@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    AppointmentItemComponent
  ],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })),
      transition(':enter', [animate('300ms ease-in', style({ opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-out', style({ opacity: 0 }))]),
    ])
  ]
})
export class CalendarViewComponent {
  private appointmentService = inject(AppointmentService);
  private dialog = inject(MatDialog);

  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(new Date());
  appointments = signal<Appointment[]>(this.appointmentService.getAppointments());

  timelineStart = 60;
  timelineEnd = 1380;
  timelineHeight = this.timelineEnd - this.timelineStart;
  hoursList = computed(() => Array.from({ length: (this.timelineEnd - this.timelineStart) / 60 }, (_, i) => this.timelineStart + i * 60));
  gridLines = computed(() => Array.from({ length: (this.timelineEnd - this.timelineStart) / 60 }, (_, i) => i * 60));

  // Computed appointments for the selected day
  appointmentsForSelectedDay = computed(() => {
    const selected = this.selectedDate();
    if (!selected) return [];
    const dateKey = selected.toISOString().split('T')[0];
    return this.appointments().filter(app => app.date === dateKey);
  });

  // Define the days in the current month
  calendarDays = computed(() => {
    const startOfMonth = new Date(this.currentDate());
    startOfMonth.setDate(1);
    const daysInMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(startOfMonth);
      day.setDate(i);
      days.push(day);
    }
    return days;
  });

  constrainPosition = (event: any): { x: number; y: number } => {
    if (!event || event.y === undefined) return { x: 0, y: 0 };
    const minY = 0;
    const maxY = this.timelineEnd - this.timelineStart;
    return { x: 0, y: Math.min(Math.max(event.y, minY), maxY) };
  };

  updateMonth(offset: number) {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  }

  onDragEnded(event: CdkDragEnd, app: Appointment) {
    const pos = event.source.getFreeDragPosition();
    let newStart = this.timelineStart + Math.round(pos.y / 15) * 15;

    if (newStart < this.timelineStart) newStart = this.timelineStart;
    if (newStart + app.duration > this.timelineEnd) newStart = this.timelineEnd - app.duration;

    app.start = newStart;
    // Ensure the signal updates correctly
    this.appointments.set(this.appointments().map(a => (a === app ? { ...a, start: newStart } : a)));
  }

  formatTime(totalMinutes: number): string {
    let hr = Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12;
    if (hr === 0) hr = 12;
    return `${hr}:${min.toString().padStart(2, '0')} ${ampm}`;
  }

  formatInterval(app: Appointment): string {
    return `${this.formatTime(app.start)} – ${this.formatTime(app.start + app.duration)}`;
  }

  openDeleteDialog(event: any, app: Appointment, index: number): void {
    event.preventDefault();
    const dialogRef = this.dialog.open(DeleteAppointmentComponent, { width: '300px', data: { title: app.title } });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.appointments.set(this.appointments().filter((_, i) => i !== index));
        if(app.id){
          this.appointmentService.deleteAppointment(app.id)
        }
      }
    });
  }

  selectDate(day: Date): void {
    this.selectedDate.set(day);
  }

  openAppointmentDialog(event: MouseEvent): void {
    if (!this.selectedDate()) return;
    const slotOffset = event.offsetY;
    const snappedOffset = Math.round(slotOffset / 15) * 15;
    let selectedTime = this.timelineStart + snappedOffset;

    if (selectedTime + 60 > this.timelineEnd) selectedTime = this.timelineEnd - 60;

    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '400px',
      data: { selectedDate: this.selectedDate(), selectedTime: selectedTime }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newApp: Appointment = {
          date: this.selectedDate()!.toISOString().split('T')[0],
          start: result.selectedTime,
          duration: 60,
          title: result.title,
          description: result.description
        };
        this.appointments.set([...this.appointments(), newApp]);
        this.appointmentService.addAppointment(newApp)
      }
    });
  }
}

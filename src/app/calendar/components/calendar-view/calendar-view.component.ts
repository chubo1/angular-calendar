import { Component, inject, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, combineLatest, map, Subscription } from 'rxjs';
import { AppointmentDialogComponent } from './appointment-dialog/appointment-dialog.component';
import { DeleteAppointmentComponent } from './delete-appointment/delete-appointmentcomponent';
import { AppointmentService } from '../../../services/appointment.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Appointment } from '../../../models/appointment.model';
import { AppointmentItemComponent } from '../appointment-item/appointment-item.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';

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
    MatMenuTrigger,
    MatMenuModule,
    AppointmentItemComponent,
  ],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })),
      transition(':enter', [animate('300ms ease-in', style({ opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class CalendarViewComponent implements OnDestroy {
  private appointmentService = inject(AppointmentService);
  private dialog = inject(MatDialog);

  @ViewChild(MatMenuTrigger)
  contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };
  selectedApp!: Appointment;
  index!: number;
  currentDate$ = new BehaviorSubject<Date>(new Date());
  selectedDate$ = new BehaviorSubject<Date | null>(new Date());
  appointments$ = new BehaviorSubject<Appointment[]>(this.appointmentService.getAppointments());

  timelineStart = 60;
  timelineEnd = 1380;
  timelineHeight = this.timelineEnd - this.timelineStart;

  hoursList$ = this.currentDate$.pipe(
    map(() =>
      Array.from({ length: (this.timelineEnd - this.timelineStart) / 60 }, (_, i) => this.timelineStart + i * 60)
    )
  );

  gridLines$ = this.currentDate$.pipe(
    map(() =>
      Array.from({ length: (this.timelineEnd - this.timelineStart) / 60 }, (_, i) => i * 60)
    )
  );

  subscriptions: Subscription[] = [];

  constructor() {
    this.contextMenu = new MatMenuTrigger();
  }

  appointmentsForSelectedDay$ = combineLatest([this.selectedDate$, this.appointments$]).pipe(
    map(([selectedDate, appointments]) => {
      if (!selectedDate) return [];
      const dateKey = selectedDate.toISOString().split('T')[0];
      return appointments.filter((app) => app.date === dateKey);
    })
  );

  calendarDays$ = this.currentDate$.pipe(
    map((currentDate) => {
      const startOfMonth = new Date(currentDate);
      startOfMonth.setDate(1);
      const daysInMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0).getDate();
      const days = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const day = new Date(startOfMonth);
        day.setDate(i);
        days.push(day);
      }
      return days;
    })
  );

  updateMonth(offset: number): void {
    this.currentDate$.next(
      new Date(this.currentDate$.value.setMonth(this.currentDate$.value.getMonth() + offset))
    );
  }

  selectDate(day: Date): void {
    this.selectedDate$.next(day);
  }

  onDragEnded(event: CdkDragEnd, app: Appointment): void {
    const pos = event.source.getFreeDragPosition();
    let newStart = this.timelineStart + Math.round(pos.y / 15) * 15;

    if (newStart < this.timelineStart) newStart = this.timelineStart;
    if (newStart + app.duration > this.timelineEnd) newStart = this.timelineEnd - app.duration;

    app.start = newStart;
    const updatedAppointments = this.appointments$.value.map((a) => (a === app ? { ...a, start: newStart } : a));
    this.appointments$.next(updatedAppointments);
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

  openDeleteDialog(event: Event): void {
    event.preventDefault();
    const dialogRef = this.dialog.open(DeleteAppointmentComponent, {
      width: '300px',
      data: { title: this.selectedApp.title },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        const updatedAppointments = this.appointments$.value.filter((_, i) => i !== this.index);
        this.appointments$.next(updatedAppointments);
        if (this.selectedApp.id) {
          this.appointmentService.deleteAppointment(this.selectedApp.id);
        }
      }
    });
  }

  openAppointmentDialog(event: MouseEvent): void {
    if (!this.selectedDate$.value) return;

    const slotOffset = event.offsetY;
    const snappedOffset = Math.round(slotOffset / 15) * 15;
    let selectedTime = this.timelineStart + snappedOffset;

    if (selectedTime + 60 > this.timelineEnd) selectedTime = this.timelineEnd - 60;

    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '400px',
      data: { selectedDate: this.selectedDate$.value, selectedTime: selectedTime },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newApp: Appointment = {
          date: this.selectedDate$.value!.toISOString().split('T')[0],
          start: result.selectedTime,
          duration: 60,
          title: result.title
        };
        const updatedAppointments = [...this.appointments$.value, newApp];
        this.appointments$.next(updatedAppointments);
        this.appointmentService.addAppointment(newApp);
      }
    });
  }

  onContextMenu(event: MouseEvent, app: Appointment, index: number): void {
    this.index = index;
    event.preventDefault();
    const x = event.clientX + 'px';
    const y = event.clientY + 'px';

    this.selectedApp = app;
    this.contextMenuPosition = { x, y };
    if (this.contextMenu) {
      this.contextMenu.openMenu();
    }
  }

  editAppointment(): void {
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '400px',
      data: {
        selectedDate: this.selectedApp.date,
        selectedTime: this.selectedApp.start,
        title: this.selectedApp.title
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updatedApp: Appointment = {
          id: this.selectedApp.id,
          date: this.selectedApp.date,
          start: this.selectedApp.start,
          duration: this.selectedApp.duration,
          title: result.title
        };

        const updatedAppointments = this.appointments$.value.map((app) =>
          app.id === updatedApp.id ? updatedApp : app
        );

        this.appointments$.next(updatedAppointments);

        this.appointmentService.updateAppointment(updatedApp);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}

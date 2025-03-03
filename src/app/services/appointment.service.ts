import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private storageKey = 'appointments';
  private appointmentsSubject: BehaviorSubject<Appointment[]>;
  public appointments$: Observable<Appointment[]>;

  constructor() {
    this.appointmentsSubject = new BehaviorSubject<Appointment[]>(this.loadAppointments());
    this.appointments$ = this.appointmentsSubject.asObservable();
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error('LocalStorage is not available:', e);
      return false;
    }
  }

  private loadAppointments(): Appointment[] {
    if (this.isLocalStorageAvailable()) {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }

  private saveAppointments(appointments: Appointment[]): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(this.storageKey, JSON.stringify(appointments));
    }
  }

  getAppointments(): Appointment[] {
    return this.appointmentsSubject.value;
  }

  addAppointment(appointment: Appointment): void {
    if (!appointment.id) {
      appointment.id = new Date().getTime();
    }
    const updatedAppointments = [...this.appointmentsSubject.value, appointment];
    this.appointmentsSubject.next(updatedAppointments);
    this.saveAppointments(updatedAppointments);
  }

  updateAppointment(updatedAppointment: Appointment): Observable<void> {  
    const updatedAppointments = this.appointmentsSubject.value.map(app =>
      app.id === updatedAppointment.id ? updatedAppointment : app
    );

    this.appointmentsSubject.next(updatedAppointments);
    this.saveAppointments(updatedAppointments);

    return of();
  }
  
  deleteAppointment(id: number): void {
    const updatedAppointments = this.appointmentsSubject.value.filter((app) => app.id !== id);
    this.appointmentsSubject.next(updatedAppointments);
    this.saveAppointments(updatedAppointments);
  }
}
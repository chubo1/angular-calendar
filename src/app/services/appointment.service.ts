import { Injectable } from '@angular/core';
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private storageKey = 'appointments';
  private appointments: Appointment[] = [];

  constructor() {
    this.loadAppointments();
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  private loadAppointments(): void {
    if (this.isLocalStorageAvailable()) {
      const stored = localStorage.getItem(this.storageKey);
      this.appointments = stored ? JSON.parse(stored) : [];
    }
  }

  private saveAppointments(): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.appointments));
    }
  }

  getAppointments(): Appointment[] {
    return this.appointments;
  }

  addAppointment(appointment: Appointment): void {
    if (!appointment.id) {
      appointment.id = new Date().getTime();
    }
    this.appointments.push(appointment);
    this.saveAppointments();
  }

  deleteAppointment(id: number): void {
    this.appointments = this.appointments.filter(app => app.id !== id);
    this.saveAppointments();
  }
}

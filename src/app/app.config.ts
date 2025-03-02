import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'calendar',
    loadComponent: () => import('./calendar/components/calendar/calendar.component').then(m => m.CalendarComponent)
  },
  { path: '', redirectTo: 'calendar', pathMatch: 'full' }
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),provideAnimations()]
};

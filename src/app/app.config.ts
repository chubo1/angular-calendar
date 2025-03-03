import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'calendar',
    loadComponent: () => import('./calendar/components/calendar/calendar.component').then(m => m.CalendarComponent)
  },
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),provideAnimations()]
};

import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA,MatDialogModule  } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports:[MatDialogModule,MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete Appointment</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete "{{ data.title }}"?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
        <button mat-button (click)="onConfirm()"> delete</button>
    </mat-dialog-actions>
  `
})
export class DeleteAppointmentComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteAppointmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }
}

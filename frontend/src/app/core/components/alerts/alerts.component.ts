import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 w-80">
      <div *ngFor="let alert of alerts; let i = index" 
           class="mb-4 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-0 opacity-100"
           [ngClass]="{
             'bg-success-100 text-success-800 border-l-4 border-success-500': alert.type === 'success',
             'bg-error-100 text-error-800 border-l-4 border-error-500': alert.type === 'error',
             'bg-warning-100 text-warning-800 border-l-4 border-warning-500': alert.type === 'warning',
             'bg-primary-100 text-primary-800 border-l-4 border-primary-500': alert.type === 'info'
           }">
        <div class="flex justify-between items-start">
          <div class="flex-1">{{ alert.message }}</div>
          <button class="ml-3 text-gray-500 hover:text-gray-800" (click)="removeAlert(i)">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class AlertsComponent implements OnInit, OnDestroy {
  alerts: Alert[] = [];
  private subscription = new Subscription();

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.subscription = this.alertService.alerts$.subscribe(alert => {
      if (!alert.message) {
        // Clear all alerts when an empty alert is received
        this.alerts = [];
        return;
      }

      this.alerts.push(alert);

      if (alert.autoClose) {
        setTimeout(() => {
          this.removeAlert(this.alerts.indexOf(alert));
        }, alert.duration || 5000);
      }
    });
  }

  removeAlert(index: number): void {
    if (index >= 0 && index < this.alerts.length) {
      this.alerts.splice(index, 1);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
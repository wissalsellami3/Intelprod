import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  type: AlertType;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<Alert>();
  public alerts$: Observable<Alert> = this.alertSubject.asObservable();

  constructor() {}

  success(message: string, autoClose = true, duration = 5000): void {
    this.alert({ type: 'success', message, autoClose, duration });
  }

  error(message: string, autoClose = true, duration = 5000): void {
    this.alert({ type: 'error', message, autoClose, duration });
  }

  warning(message: string, autoClose = true, duration = 5000): void {
    this.alert({ type: 'warning', message, autoClose, duration });
  }

  info(message: string, autoClose = true, duration = 5000): void {
    this.alert({ type: 'info', message, autoClose, duration });
  }

  private alert(alert: Alert): void {
    this.alertSubject.next(alert);
  }

  clear(): void {
    this.alertSubject.next({} as Alert);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sensor, ApiResponse, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private apiUrl = `${environment.apiUrl}/sensors`;

  constructor(private http: HttpClient) {}

  getSensors(page = 0, size = 10, sort = 'id,desc', filter?: string): Observable<PaginatedResponse<Sensor>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    
    if (filter) {
      params = params.set('filter', filter);
    }
    
    return this.http.get<PaginatedResponse<Sensor>>(this.apiUrl, { params });
  }

  getSensorById(id: number): Observable<ApiResponse<Sensor>> {
    return this.http.get<ApiResponse<Sensor>>(`${this.apiUrl}/${id}`);
  }

  createSensor(sensor: Partial<Sensor>): Observable<ApiResponse<Sensor>> {
    return this.http.post<ApiResponse<Sensor>>(this.apiUrl, sensor);
  }

  updateSensor(id: number, sensor: Partial<Sensor>): Observable<ApiResponse<Sensor>> {
    return this.http.put<ApiResponse<Sensor>>(`${this.apiUrl}/${id}`, sensor);
  }

  deleteSensor(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }
}
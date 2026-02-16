import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cap, CapDetection, ApiResponse, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CapService {
  private apiUrl = `${environment.apiUrl}/caps`;
  private detectUrl = `${environment.apiUrl}/caps/detect`;

  constructor(private http: HttpClient) {}

  getCaps(page = 0, size = 10, sort = 'id,desc', filter?: string): Observable<PaginatedResponse<Cap>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    
    if (filter) {
      params = params.set('filter', filter);
    }
    
    return this.http.get<PaginatedResponse<Cap>>(this.apiUrl, { params });
  }

  getCapById(id: number): Observable<ApiResponse<Cap>> {
    return this.http.get<ApiResponse<Cap>>(`${this.apiUrl}/${id}`);
  }

  createCap(cap: Partial<Cap>): Observable<ApiResponse<Cap>> {
    return this.http.post<ApiResponse<Cap>>(this.apiUrl, cap);
  }

  updateCap(id: number, cap: Partial<Cap>): Observable<ApiResponse<Cap>> {
    return this.http.put<ApiResponse<Cap>>(`${this.apiUrl}/${id}`, cap);
  }

  deleteCap(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  detectCap(formData: FormData): Observable<ApiResponse<CapDetection>> {
    return this.http.post<ApiResponse<CapDetection>>(this.detectUrl, formData);
  }

  getDetectionHistory(page = 0, size = 10): Observable<PaginatedResponse<CapDetection>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<PaginatedResponse<CapDetection>>(`${this.detectUrl}/history`, { params });
  }

  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }
}
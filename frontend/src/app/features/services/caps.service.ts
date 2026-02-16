import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";

export interface Prediction {
  class: string;
  confidence: number;
}

export interface CapRecord {
  id: string;
  predictions: Prediction[];
}

@Injectable({
  providedIn: "root",
})
export class CapsService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  detectCap(id: string, file: File): Observable<CapRecord> {
    const fd = new FormData();
    fd.append("id", id);
    fd.append("file", file);
    return this.http.post<CapRecord>(`${this.base}/api/detect-cap`, fd);
  }

  listCaps(): Observable<CapRecord[]> {
    return this.http.get<CapRecord[]>(`${this.base}/caps`);
  }

  getCap(id: string): Observable<CapRecord> {
    return this.http.get<CapRecord>(`${this.base}/caps/${id}`);
  }

  updateCap(id: string, predictions: any[]): Observable<CapRecord> {
    return this.http.put<CapRecord>(`${this.base}/caps/${id}`, {
      predictions,
    });
  }

  deleteCap(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/caps/${id}`);
  }
}

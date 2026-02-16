import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { Machine, ApiResponse, PaginatedResponse } from "../models";

@Injectable({
  providedIn: "root",
})
export class MachineService {
  private apiUrl = `${environment.apiUrl}/machines`;

  constructor(private http: HttpClient) {}

  /** ---------- 1) LISTE SANS PAGINATION ---------- */
  getAllMachines(sort = "id,desc", filter?: string): Observable<Machine[]> {
    let params = new HttpParams().set("sort", sort);
    if (filter) params = params.set("filter", filter);

    // L’API renvoie directement un tableau (pas de wrapper PaginatedResponse)
    return this.http.get<Machine[]>(this.apiUrl, { params });
  }

  /** ---------- 2) LISTE PAGINÉE (garde l’ancienne méthode) ---------- */
  getMachines(
    page = 0,
    size = 10,
    sort = "id,desc",
    filter?: string
  ): Observable<PaginatedResponse<Machine>> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString())
      .set("sort", sort);

    if (filter) params = params.set("filter", filter);

    return this.http.get<PaginatedResponse<Machine>>(this.apiUrl, { params });
  }

  /** ---------- CRUD & métriques ---------- */
  getMachineById(id: string): Observable<ApiResponse<Machine>> {
    return this.http.get<ApiResponse<Machine>>(`${this.apiUrl}/${id}`);
  }

  createMachine(data: Partial<Machine>): Observable<ApiResponse<Machine>> {
    return this.http.post<ApiResponse<Machine>>(this.apiUrl, data);
  }

  updateMachine(
    id: string,
    data: Partial<Machine>
  ): Observable<ApiResponse<Machine>> {
    return this.http.put<ApiResponse<Machine>>(`${this.apiUrl}/${id}`, data);
  }

  deleteMachine(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }
}

export { Machine };

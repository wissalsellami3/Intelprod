import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, BehaviorSubject, tap } from "rxjs";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  email: string;
  full_name: string;
  phone: string; // ✅ Ajouté
  role: "USER" | "ADMIN";
}

export interface User {
  email: string;
  full_name: string;
  phone?: string;
  role: "USER" | "ADMIN";
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly TOKEN_KEY = "auth_token";
  private readonly USER_KEY = "current_user";

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  /** -------- LOGIN -------- */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => this.storeAuthData(response))
      );
  }

  /** -------- REGISTER -------- */
  register(data: {
    full_name: string;
    email: string;
    password: string;
    phone: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: "USER", // optionnel si backend le définit par défaut
      });
  }

  /** -------- LOGOUT -------- */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(["/auth/login"]);
  }

  /** -------- TOKEN -------- */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** -------- STATUS -------- */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === "ADMIN";
  }

  /** -------- PROFILE UPDATE -------- */
  updateProfile(full_name: string): void {
    const user = this.currentUserSubject.value;
    if (!user) return;
    const updated: User = { ...user, full_name };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }

  /** -------- HEADERS -------- */
  getAuthHeaders(): { headers: HttpHeaders } {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : "",
      }),
    };
  }

  /** -------- STORAGE -------- */
  private storeAuthData(response: AuthResponse): void {
    const user: User = {
      email: response.email,
      full_name: response.full_name,
      phone: response.phone,
      role: response.role,
    };
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }
}

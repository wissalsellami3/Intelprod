import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from "@angular/common/http";
import { AuthService, User } from "../../core/services/auth.service";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: "./profile.component.html",
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  currentUser: User | null = null;
  base = `${environment.apiUrl}`; // ex: http://localhost:8000

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ["", Validators.required],
      email: [{ value: "", disabled: true }],
      role: [{ value: "", disabled: true }],
      avatar_url: [""],
    });

    this.auth.currentUser$.subscribe((u) => {
      if (u) {
        this.currentUser = u;
        this.form.patchValue({
          name: u.full_name,
          email: u.email,
          role: u.role,
        });
        this.fetchProfile();
      }
    });
  }

  private get headers() {
    const t = this.auth.getToken();
    return {
      headers: new HttpHeaders({ Authorization: t ? `Bearer ${t}` : "" }),
    };
  }

  fetchProfile() {
    this.http.get<any>(`${this.base}/me`, this.headers).subscribe({
      next: (p) =>
        this.form.patchValue({
          name: p.name,
          avatar_url: p.avatar_url || "",
        }),
      error: () => alert("Erreur chargement profil"),
    });
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    const payload = {
      name: this.form.value.name,
      avatar_url: this.form.value.avatar_url,
    };
    this.http.put<any>(`${this.base}/me`, payload, this.headers).subscribe({
      next: (up) => {
        this.auth.updateProfile(up.name);
        alert("Profil mis à jour");
        this.loading = false;
      },
      error: () => {
        alert("Erreur mise à jour");
        this.loading = false;
      },
    });
  }
}

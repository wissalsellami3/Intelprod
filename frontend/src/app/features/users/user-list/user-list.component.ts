import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { environment } from "../../../../environments/environment";
import { AuthService } from "../../../core/services/auth.service";
import { AlertService } from "../../../core/services/alert.service";

/* ────────── Modèle local ────────── */
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "ADMIN" | "USER";
}

@Component({
  selector: "app-user-list",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./user-list.component.html",
})
export class UserListComponent implements OnInit {
  /* Liste */
  users: User[] = [];
  isLoading = false;

  /* Modales */
  showEdit = false;
  showAdd = false;

  /* Utilisateur sélectionné pour édition */
  selectedUser: User | null = null;

  /* Forms */
  editForm: FormGroup = this.fb.group({
    full_name: ["", Validators.required],
    role: ["USER", Validators.required],
    password: [""],
  });

  addForm: FormGroup = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    full_name: ["", Validators.required],
    role: ["USER", Validators.required],
    password: ["", Validators.required],
  });

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private alert: AlertService,
    private fb: FormBuilder
  ) {}

  /* ────────── Lifecycle ────────── */
  ngOnInit(): void {
    this.fetchUsers();
  }

  /* ────────── CRUD ────────── */
  private headers() {
    return { Authorization: `Bearer ${this.auth.getToken()}` };
  }

  fetchUsers(): void {
    this.isLoading = true;
    this.http
      .get<User[]>(`${environment.apiUrl}/admin/users`, {
        headers: this.headers(),
      })
      .subscribe({
        next: (data) => {
          this.users = data;
          this.isLoading = false;
        },
        error: () => {
          this.alert.error("Failed to fetch users");
          this.isLoading = false;
        },
      });
  }

  /* ========== Ajout ========== */
  openAddModal(): void {
    this.addForm.reset({ role: "USER" });
    this.showAdd = true;
  }
  closeAdd(): void {
    this.showAdd = false;
  }
  submitAdd(): void {
    if (this.addForm.invalid) return;

    this.http
      .post<User>(`${environment.apiUrl}/auth/register`, this.addForm.value, {
        headers: this.headers(),
      })
      .subscribe({
        next: (created) => {
          this.alert.success("User created");
          this.users.push(created);
          this.closeAdd();
        },
        error: () => this.alert.error("Creation failed"),
      });
  }

  /* ========== Edition ========== */
  openEditModal(user: User): void {
    this.selectedUser = user;
    this.editForm.patchValue({
      full_name: user.full_name,
      role: user.role,
      password: "",
    });
    this.showEdit = true;
  }
  closeEdit(): void {
    this.showEdit = false;
    this.selectedUser = null;
  }
  submitEdit(): void {
    if (!this.selectedUser) return;

    const payload: any = {
      full_name: this.editForm.value.full_name,
      role: this.editForm.value.role,
    };
    if (this.editForm.value.password)
      payload.password = this.editForm.value.password;

    this.http
      .put<User>(
        `${environment.apiUrl}/admin/users/${this.selectedUser.id}`,
        payload,
        { headers: this.headers() }
      )
      .subscribe({
        next: (updated) => {
          this.alert.success("User updated");
          this.users = this.users.map((u) =>
            u.id === updated.id ? updated : u
          );
          this.closeEdit();
        },
        error: () => this.alert.error("Update failed"),
      });
  }

  /* ========== Suppression ========== */
  deleteUser(userId: string): void {
    if (!confirm("Are you sure you want to delete this user?")) return;

    this.http
      .delete(`${environment.apiUrl}/admin/users/${userId}`, {
        headers: this.headers(),
      })
      .subscribe({
        next: () => {
          this.alert.success("User deleted");
          this.users = this.users.filter((u) => u.id !== userId);
        },
        error: () => this.alert.error("Delete failed"),
      });
  }
}

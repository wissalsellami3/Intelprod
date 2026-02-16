import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { AlertService } from "../../../core/services/alert.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div class="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div class="p-10">
          <!-- ✅ Logo -->
          <div class="flex justify-center mb-6">
            <img src="assets/Logo.png" alt="Logo"class="w-36 h-36"
/>
          </div>

          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">Welcome Back</h1>
            <p class="text-gray-600 dark:text-gray-400">Please log in to continue</p>
          </div>

          <div *ngIf="authError" class="bg-red-100 text-red-700 text-sm p-3 rounded mb-4 border border-red-300">
            {{ authError }}
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label for="email" class="form-label">Email</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-input"
                placeholder="your.email@example.com"
                [ngClass]="{
                  'border-error-500 focus:ring-error-500': isFieldInvalid('email')
                }"
              />
              <div *ngIf="isFieldInvalid('email')" class="form-error">
                <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="loginForm.get('email')?.errors?.['email']">Email format is invalid</span>
              </div>
            </div>

            <div>
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                id="password"
                formControlName="password"
                class="form-input"
                placeholder="••••••••"
                [ngClass]="{
                  'border-error-500 focus:ring-error-500': isFieldInvalid('password')
                }"
              />
              <div *ngIf="isFieldInvalid('password')" class="form-error">
                <span *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</span>
                <span *ngIf="loginForm.get('password')?.errors?.['pattern']">
                  Password must be at least 8 characters and include a lowercase, uppercase, number and special character.
                </span>
              </div>
            </div>

            <div>
              <button type="submit" class="btn btn-primary w-full" [disabled]="loginForm.invalid || isLoading">
                <span *ngIf="isLoading">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
                <span *ngIf="!isLoading">Log In</span>
              </button>
            </div>
          </form>

          <div class="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
            Don't have an account?
            <a routerLink="/auth/signup" class="text-primary-600 hover:underline">Register</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  authError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: [
        "",
        [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/),
        ],
      ],
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.authError = null;

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.alertService.success("Login successful");
        this.router.navigate(["/dashboard"]);
      },
      error: (error) => {
        this.isLoading = false;
        const msg = error.error?.message || "Login failed. Please check your credentials.";
        this.authError = msg;
        this.alertService.error(msg);
      },
    });
  }
}

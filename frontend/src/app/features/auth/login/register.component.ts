import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div class="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div class="p-10">
          <!-- ✅ Logo + Titre -->
          <div class="flex flex-col items-center justify-center mb-8">
            <img src="assets/Logo.png" alt="Logo" class="w-36 h-36 mb-4" />
            <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">Create Account</h1>
            <p class="text-gray-600 dark:text-gray-400">IntelProd Platform</p>
          </div>

          <!-- ✅ Formulaire -->
          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label class="form-label" for="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                formControlName="full_name"
                class="form-input"
                placeholder="John Doe"
              />
              <div *ngIf="isInvalid('full_name')" class="form-error">Name is required</div>
            </div>

            <div>
              <label class="form-label" for="email">Email</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-input"
                placeholder="your.email@example.com"
              />
              <div *ngIf="isInvalid('email')" class="form-error">
                <span *ngIf="signupForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="signupForm.get('email')?.errors?.['email']">Invalid email format</span>
              </div>
            </div>

            <div>
              <label class="form-label" for="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                formControlName="phone"
                class="form-input"
                placeholder="+216 12 345 678"
              />
              <div *ngIf="isInvalid('phone')" class="form-error">Phone number is required</div>
            </div>

            <div>
              <label class="form-label" for="password">Password</label>
              <input
                type="password"
                id="password"
                formControlName="password"
                class="form-input"
                placeholder="••••••••"
              />
              <div *ngIf="isInvalid('password')" class="form-error">
                <span *ngIf="signupForm.get('password')?.errors?.['required']">Password is required</span>
                <span *ngIf="signupForm.get('password')?.errors?.['pattern']">
                  Password must be at least 8 characters and include a lowercase, uppercase, number and special character.
                </span>
              </div>
            </div>

            <div>
              <button type="submit" class="btn btn-primary w-full" [disabled]="signupForm.invalid || isLoading">
                <span *ngIf="isLoading" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
                <span *ngIf="!isLoading">Sign Up</span>
              </button>
            </div>
          </form>

          <div class="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
            Already have an account?
            <a routerLink="/auth/login" class="text-primary-600 hover:underline cursor-pointer">Login</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
        ]
      ]
    });
  }

  isInvalid(control: string): boolean {
    const field = this.signupForm.get(control);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  onSubmit(): void {
    if (this.signupForm.invalid) return;

    this.isLoading = true;
    const { full_name, email, phone, password } = this.signupForm.value;

    this.authService
      .register({ full_name, email, phone, password })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.success('Account created successfully');
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.error(err.error?.message || 'Registration failed');
        }
      });
  }
}

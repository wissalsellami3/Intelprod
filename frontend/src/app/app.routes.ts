import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { adminGuard } from "./core/guards/admin.guard";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./core/components/layout/layout.component").then(
        (m) => m.LayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/profile/profile.component").then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: "sensors",
        loadComponent: () =>
          import("./features/sensors/sensor-list/sensor-list.component").then(
            (m) => m.SensorListComponent
          ),
      },
      {
        path: "sensors/new",
        loadComponent: () =>
          import("./features/sensors/sensor-form/sensor-form.component").then(
            (m) => m.SensorFormComponent
          ),
      },
      {
        path: "sensors/edit/:id",
        loadComponent: () =>
          import("./features/sensors/sensor-form/sensor-form.component").then(
            (m) => m.SensorFormComponent
          ),
      },
      {
        path: "machines",
        loadComponent: () =>
          import(
            "./features/machines/machine-list/machine-list.component"
          ).then((m) => m.MachineListComponent),
      },
      {
        path: "machines/new",
        loadComponent: () =>
          import(
            "./features/machines/machine-form/machine-form.component"
          ).then((m) => m.MachineFormComponent),
      },
      {
        path: "machines/edit/:id",
        loadComponent: () =>
          import(
            "./features/machines/machine-form/machine-form.component"
          ).then((m) => m.MachineFormComponent),
      },
      {
        path: "caps",
        loadComponent: () =>
          import("./features/caps/cap-list/cap-list.component").then(
            (m) => m.CapListComponent
          ),
      },
      {
        path: "caps/new",
        loadComponent: () =>
          import("./features/caps/cap-form/cap-form.component").then(
            (m) => m.CapFormComponent
          ),
      },
      {
        path: "caps/edit/:id",
        loadComponent: () =>
          import("./features/caps/cap-form/cap-form.component").then(
            (m) => m.CapFormComponent
          ),
      },
      {
        path: "detect-cap",
        loadComponent: () =>
          import("./features/caps/detect-cap/detect-cap.component").then(
            (m) => m.CapDetectComponent
          ),
      },
      {
        path: "users",
        loadComponent: () =>
          import("./features/users/user-list/user-list.component").then(
            (m) => m.UserListComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: "users/new",
        loadComponent: () =>
          import("./features/users/user-form/user-form.component").then(
            (m) => m.UserFormComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: "users/edit/:id",
        loadComponent: () =>
          import("./features/users/user-form/user-form.component").then(
            (m) => m.UserFormComponent
          ),
        canActivate: [adminGuard],
      },
    ],
  },
  {
    path: "auth",
    children: [
      {
        path: "login",
        loadComponent: () =>
          import("./features/auth/login/login.component").then(
            (m) => m.LoginComponent
          ),
      },
      {
        path: "signup",
        loadComponent: () =>
          import("./features/auth/login/register.component").then(
            (m) => m.SignupComponent
          ),
      },
    ],
  },
  {
    path: "**",
    redirectTo: "dashboard",
  },
];

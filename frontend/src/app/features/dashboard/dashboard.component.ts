import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { NgChartsModule } from "ng2-charts";
import { ChartConfiguration, ChartData } from "chart.js";
import { forkJoin, of } from "rxjs";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, HttpClientModule, NgChartsModule],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {
  totalUsers = 0;
  totalSensors = 0;
  totalMachines = 0;
  totalCaps = 0;

  isAdmin = false; // ✅ ajouté

  public lineChartOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: false },
    },
    plugins: { legend: { display: true } },
  };

  public pieChartOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "right" } },
  };

  public temperatureChartData: ChartData<"line"> = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      { data: [25, 29, 28, 26, 27, 30, 29], label: "Machine 1", tension: 0.2 },
      { data: [27, 31, 30, 28, 29, 32, 31], label: "Machine 2", tension: 0.2 },
    ],
  };

  public capsChartData: ChartData<"pie"> = {
    labels: ["OK", "Defective"],
    datasets: [{ data: [80, 20] }],
  };

  recentActivities = [
    {
      time: "2025-06-22 09:45",
      event: "Machine 1 temp alert",
      status: "warning",
      statusText: "Warning",
    },
    {
      time: "2025-06-22 09:30",
      event: "Batch #4561 inspected",
      status: "success",
      statusText: "Success",
    },
    {
      time: "2025-06-22 09:15",
      event: "New sensor deployed: Temp-S23",
      status: "info",
      statusText: "Info",
    },
    {
      time: "2025-06-22 09:00",
      event: "Machine 3 maintenance required",
      status: "error",
      statusText: "Alert",
    },
    {
      time: "2025-06-21 17:45",
      event: "Shift end report generated",
      status: "info",
      statusText: "Info",
    },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const base = environment.apiUrl;
    const userStr = localStorage.getItem("current_user");

    // ✅ Vérifie le rôle
    if (userStr) {
      const user = JSON.parse(userStr);
      this.isAdmin = user.role === "ADMIN";
    }

    forkJoin({
      users: this.isAdmin
        ? this.http.get<any[]>(`${base}/admin/users`)
        : of([]),
      sensors: this.http.get<any[]>(`${base}/sensors`),
      machines: this.http.get<any[]>(`${base}/machines`),
      caps: this.http.get<any[]>(`${base}/caps`),
    }).subscribe({
      next: ({ users, sensors, machines, caps }) => {
        this.totalUsers = users.length;
        this.totalSensors = sensors.length;
        this.totalMachines = machines.length;
        this.totalCaps = caps.length;
      },
      error: (err) => console.error("Failed to load counts", err),
    });
  }
}

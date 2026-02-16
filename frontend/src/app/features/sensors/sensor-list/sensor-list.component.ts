/* ─────────────────────────────────────────
   src/app/features/sensors/sensor-list/sensor-list.component.ts
────────────────────────────────────────── */
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { environment } from "../../../../environments/environment";
import { AuthService } from "../../../core/services/auth.service";
import { AlertService } from "../../../core/services/alert.service";

/* ───── Types locaux ───── */
export type SensorType =
  | "TEMPERATURE"
  | "HUMIDITY"
  | "VIBRATION"
  | "LUMINOSITY";

export interface Sensor {
  id: string;
  name: string;
  sensor_type: SensorType;
}

@Component({
  selector: "app-sensor-list",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./sensor-list.component.html",
})
export class SensorListComponent implements OnInit {
  /* État */
  sensors: Sensor[] = [];
  isLoading = false;

  /* Modales */
  showAdd = false;
  showEdit = false;
  selectedSensor: Sensor | null = null;

  /* Forms */
  addForm: FormGroup = this.fb.group({
    name: ["", Validators.required],
    sensor_type: ["TEMPERATURE", Validators.required],
  });

  editForm: FormGroup = this.fb.group({
    name: ["", Validators.required],
    sensor_type: ["TEMPERATURE", Validators.required],
  });

  /* Liste des types pour le <select> */
  readonly sensorTypes: SensorType[] = [
    "TEMPERATURE",
    "HUMIDITY",
    "VIBRATION",
    "LUMINOSITY",
  ];

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private alert: AlertService,
    private fb: FormBuilder
  ) {}

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.fetchSensors();
  }

  /* ── Helpers ── */
  private headers() {
    return { Authorization: `Bearer ${this.auth.getToken()}` };
  }

  /* ── CRUD ── */

  /* 🔎 Read */
  fetchSensors(): void {
    this.isLoading = true;
    this.http
      .get<Sensor[]>(`${environment.apiUrl}/sensors`, {
        headers: this.headers(),
      })
      .subscribe({
        next: (data) => {
          this.sensors = data;
          this.isLoading = false;
        },
        error: () => {
          this.alert.error("Failed to fetch sensors");
          this.isLoading = false;
        },
      });
  }

  /* ➕ Create */
  openAdd(): void {
    this.addForm.reset({ sensor_type: "TEMPERATURE" });
    this.showAdd = true;
  }
  closeAdd(): void {
    this.showAdd = false;
  }
  submitAdd(): void {
    if (this.addForm.invalid) return;

    this.http
      .post<Sensor>(`${environment.apiUrl}/sensors`, this.addForm.value, {
        headers: this.headers(),
      })
      .subscribe({
        next: (created) => {
          this.alert.success("Sensor created");
          this.sensors.push(created);
          this.closeAdd();
        },
        error: () => this.alert.error("Creation failed"),
      });
  }

  /* ✏️ Update */
  openEdit(sensor: Sensor): void {
    this.selectedSensor = sensor;
    this.editForm.patchValue({
      name: sensor.name,
      sensor_type: sensor.sensor_type,
    });
    this.showEdit = true;
  }
  closeEdit(): void {
    this.showEdit = false;
    this.selectedSensor = null;
  }
  submitEdit(): void {
    if (!this.selectedSensor || this.editForm.invalid) return;

    this.http
      .put<Sensor>(
        `${environment.apiUrl}/sensors/${this.selectedSensor.id}`,
        this.editForm.value,
        { headers: this.headers() }
      )
      .subscribe({
        next: (updated) => {
          this.alert.success("Sensor updated");
          this.sensors = this.sensors.map((s) =>
            s.id === updated.id ? updated : s
          );
          this.closeEdit();
        },
        error: () => this.alert.error("Update failed"),
      });
  }

  /* 🗑️ Delete */
  deleteSensor(id: string): void {
    if (!confirm("Delete this sensor?")) return;

    this.http
      .delete(`${environment.apiUrl}/sensors/${id}`, {
        headers: this.headers(),
      })
      .subscribe({
        next: () => {
          this.alert.success("Sensor deleted");
          this.sensors = this.sensors.filter((s) => s.id !== id);
        },
        error: () => this.alert.error("Delete failed"),
      });
  }
}

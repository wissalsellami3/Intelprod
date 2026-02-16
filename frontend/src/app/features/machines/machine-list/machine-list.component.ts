import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { MachineService } from "../../../core/services/machine.service";
import { Machine } from "../../../core/models";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-machine-list",
  standalone: true,
  templateUrl: "./machine-list.component.html",
  imports: [CommonModule, ReactiveFormsModule],
})
export class MachineListComponent implements OnInit {
  list: Machine[] = [];
  isLoading = true;

  /* modales & formulaires */
  showAdd = false;
  showEdit = false;
  addForm!: FormGroup;
  editForm!: FormGroup;

  statuses: Machine["status"][] = ["RUNNING", "STOPPED", "MAINTENANCE"];
  selectedMachineId: string | null = null; // ← string au lieu de number

  constructor(
    private fb: FormBuilder,
    private machineService: MachineService,
    public auth: AuthService
  ) {}

  /* ---------------- lifecycle ---------------- */
  ngOnInit(): void {
    this.loadMachines();

    this.addForm = this.fb.group({
      name: [""],
      description: [""],
      status: ["RUNNING"],
    });

    this.editForm = this.fb.group({
      name: [""],
      description: [""],
      status: ["RUNNING"],
    });
  }

  /* ---------------- helpers ------------------ */
  loadMachines(): void {
    this.isLoading = true;

    /* -> appel de la méthode sans pagination */
    this.machineService.getAllMachines("name,asc").subscribe({
      next: (machines) => {
        this.list = machines;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  /* ---------------- add ----------------------- */
  openAdd(): void {
    this.addForm.reset({ status: "RUNNING" });
    this.showAdd = true;
  }
  closeAdd(): void {
    this.showAdd = false;
  }
  submitAdd(): void {
    if (this.addForm.valid) {
      this.machineService.createMachine(this.addForm.value).subscribe(() => {
        this.loadMachines();
        this.closeAdd();
      });
    }
  }

  /* ---------------- edit ---------------------- */
  openEdit(machine: Machine): void {
    this.selectedMachineId = machine.id; // id = string
    this.editForm.patchValue(machine);
    this.showEdit = true;
  }
  closeEdit(): void {
    this.showEdit = false;
    this.selectedMachineId = null;
  }
  submitEdit(): void {
    if (this.editForm.valid && this.selectedMachineId) {
      this.machineService
        .updateMachine(this.selectedMachineId, this.editForm.value)
        .subscribe(() => {
          this.loadMachines();
          this.closeEdit();
        });
    }
  }

  /* ---------------- delete -------------------- */
  del(id: string): void {
    this.machineService.deleteMachine(id).subscribe(() => this.loadMachines());
  }
}

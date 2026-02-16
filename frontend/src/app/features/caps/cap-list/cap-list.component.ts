import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CapsService, CapRecord } from "../../services/caps.service";

@Component({
  selector: "app-cap-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./cap-list.component.html",
})
export class CapListComponent implements OnInit {
  caps: CapRecord[] = [];
  loading = false;

  constructor(private capsService: CapsService) {}

  ngOnInit(): void {
    this.loadCaps();
  }

  loadCaps(): void {
    this.loading = true;
    this.capsService.listCaps().subscribe({
      next: (data) => {
        this.caps = data;
        this.loading = false;
      },
      error: () => {
        alert("Erreur de chargement");
        this.loading = false;
      }
    });
  }

  deleteCap(id: string): void {
    if (!confirm(`Supprimer ${id} ?`)) return;
    this.capsService.deleteCap(id).subscribe(() => this.loadCaps());
  }
}

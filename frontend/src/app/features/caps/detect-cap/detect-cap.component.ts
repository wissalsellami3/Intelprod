import { Component, ElementRef, ViewChild, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";

@Component({
  selector: "app-cap-detect",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./cap-detect.component.html",
})
export class CapDetectComponent implements AfterViewInit {
  api = environment.apiUrl;
  mode: "upload" | "realtime" = "upload";
  idNumber = "";
  result: any = null;
  loading = false;
  saving = false;
  cameraOn = false;

  @ViewChild("video") videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild("canvas") canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("file") fileInput!: ElementRef<HTMLInputElement>;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {}

  get fullId(): string {
    return `cap-${this.idNumber}`;
  }

  openCamera() {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      this.videoRef.nativeElement.srcObject = stream;
      this.cameraOn = true;
    }).catch((err) => alert("Erreur caméra : " + err.message));
  }

  stopCamera() {
    const stream = this.videoRef.nativeElement.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    this.cameraOn = false;
  }

  async startAnalyse() {
    if (!this.idNumber.trim()) return alert("Veuillez entrer un ID");
    this.loading = true;

    let file: File | null = null;

    if (this.mode === "upload") {
      file = this.fileInput.nativeElement.files?.[0] ?? null;
      if (!file) {
        this.loading = false;
        return alert("Sélectionnez une image.");
      }
    } else {
      if (!this.cameraOn) {
        this.loading = false;
        return alert("Ouvrez la caméra d'abord.");
      }
      file = await this.captureFrame();
    }

    const formData = new FormData();
    formData.append("file", file!);
    formData.append("id", this.fullId);

    this.http.post<any>(`${this.api}/caps/detect-cap-workflow`, formData).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
      },
      error: (err) => {
        alert(err.error?.detail || "Erreur de détection");
        this.loading = false;
      }
    });
  }

  saveResult() {
    if (!this.result?.predictions?.length) {
      return alert("Aucune prédiction à sauvegarder.");
    }

    this.saving = true;

    const payload = {
      cap_id: this.fullId,
      predictions: this.result.predictions,
      timestamp: new Date().toISOString()
    };

    this.http.post(`${this.api}/caps/save-from-client`, payload).subscribe({
      next: () => {
        alert("Résultat sauvegardé avec succès !");
        this.saving = false;
      },
      error: (err) => {
        alert("Erreur de sauvegarde : " + (err.error?.detail || err.message));
        this.saving = false;
      }
    });
  }

  private captureFrame(): Promise<File> {
    return new Promise((resolve) => {
      const video = this.videoRef.nativeElement;
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        resolve(new File([blob!], "capture.jpg", { type: "image/jpeg" }));
      }, "image/jpeg");
    });
  }
}

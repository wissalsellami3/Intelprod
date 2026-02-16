export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "USER";
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Sensor {
  id: number;
  name: string;
  type: "TEMPERATURE" | "HUMIDITY" | "VIBRATION" | "LIGHT";
  location: string;
  machineId: number;
  value: number;
  unit: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  lastReading: string;
}

export interface Machine {
  id: string; // ✅ ObjectId de MongoDB → string
  name: string;
  model: string;
  description: string;
  status: "RUNNING" | "STOPPED" | "MAINTENANCE"; // ✅ typage clair
  serialNumber: string;
  installationDate: string;

  temperature: number;
  lastMaintenance: string;
}

export interface Cap {
  id: number;
  batchNumber: string;
  productionDate: string;
  machineId: number;
  isDefective: boolean;
  defectType?: string;
  inspectionDate: string;
}

export interface CapDetection {
  id: number;
  imageUrl: string;
  detectedAt: string;
  isDefective: boolean;
  defectType?: string;
  confidence: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

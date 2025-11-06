import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces
export interface Usuario {
  idusuario: number;
  nombres: string;
  apellidos: string;
}

export interface Paciente {
  idpaciente: number;
  nombres: string;
  apellidos: string;
  nombreencargado: string;
  telefonoencargado: string;
}

export interface Cita {
  idagenda: number;
  fkusuario: number;
  fkpaciente: number;
  fechaatencion: Date;
  horaatencion: string;
  comentario: string | null;
  transporte: number;
  fechatransporte: Date | null;
  horariotransporte: string | null;
  direccion: string | null;
  estado: number;
  usuario: Usuario;
  paciente: Paciente;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Cita[];
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RepoAgendaService {
  private apiUrl = `${environment.apiUrl}/repoAgenda`;

  constructor(private http: HttpClient) {}

  consultaPorTerapeuta(terapeuta: string, fecha: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/consultaPorTerapeuta/${terapeuta}/${fecha}`);
  }

  consultaPorPacienteMes(paciente: string, mes: string, anio: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/consultaPaciente/${paciente}/mes/${mes}/anio/${anio}`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces en el mismo archivo del servicio
export interface Paciente {
  nombres: string;
  apellidos: string;
  cui: string;
  fechanacimiento: Date;
  genero: string;
  tipodiscapacidad: string | null;
  telefonopersonal: string;
  nombrecontactoemergencia: string;
  telefonoemergencia: string;
  municipio: string;
  aldea: string;
  direccion: string;
  estado: number;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Paciente[];
}

@Injectable({
  providedIn: 'root'
})
export class RepoPacienteService {
  private apiUrl = `${environment.apiUrl}/repoPaciente`;

  constructor(private http: HttpClient) {}

  consultaPorGenero(genero: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/consultaPorGenero/${genero}`);
  }

  consultaPorEdad(tipoEdad: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/consultaPorEdad/${tipoEdad}`);
  }
}
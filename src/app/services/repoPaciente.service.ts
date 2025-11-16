import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

export interface FiltrosExportacion {
  genero?: string;
  edad?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RepoPacienteService {
  private apiUrl = `${environment.apiUrl}/repoPaciente`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private buildParams(filtros: FiltrosExportacion): HttpParams {
    let params = new HttpParams();
    
    if (filtros.genero && filtros.genero !== 'T') {
      params = params.set('genero', filtros.genero);
    }
    
    if (filtros.edad && filtros.edad !== 'T') {
      params = params.set('edad', filtros.edad);
    }
    
    return params;
  }

  consultaPorGenero(genero: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/consultaPorGenero/${genero}`);
  }

  consultaPorEdad(tipoEdad: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/consultaPorEdad/${tipoEdad}`);
  }

  // ==========================================
  // MÉTODOS DE EXPORTACIÓN
  // ==========================================

  /**
   * Descarga el reporte de pacientes en formato Excel
   */
  descargarExcel(filtros: FiltrosExportacion = {}): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/exportar/excel`, filtros, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * Descarga el reporte de pacientes en formato PDF
   */
  descargarPDF(filtros: FiltrosExportacion = {}): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/exportar/pdf`, filtros, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * Método auxiliar para descargar archivos
   */
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Genera el nombre del archivo basado en filtros y fecha actual
   */
  generarNombreArchivo(extension: 'xlsx' | 'pdf', filtros: FiltrosExportacion): string {
    const fecha = new Date().toISOString().split('T')[0];
    let nombreBase = `reporte_pacientes_${fecha}`;
    
    if (filtros.genero && filtros.genero !== 'T') {
      nombreBase += `_${filtros.genero === 'M' ? 'masculino' : 'femenino'}`;
    }
    
    if (filtros.edad && filtros.edad !== 'T') {
      nombreBase += `_${filtros.edad === 'mayor' ? 'mayores' : 'menores'}`;
    }
    
    return `${nombreBase}.${extension}`;
  }
}
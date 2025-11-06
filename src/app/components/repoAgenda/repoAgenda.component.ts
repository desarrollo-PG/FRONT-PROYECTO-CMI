import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepoAgendaService, Cita } from '../../services/repoAgenda.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ArchivoService } from '../../services/archivo.service';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { AlertaService } from '../../services/alerta.service';
import { Paciente, ServicioPaciente } from '../../services/paciente.service';

@Component({
  selector: 'app-repo-agenda',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent
  ],
  templateUrl: './repoAgenda.component.html',
  styleUrls: ['./repoAgenda.component.scss']
})
export class RepoAgendaComponent implements OnInit {
  userInfo: any = null;
  sidebarExpanded: boolean = false;
  selectedMedico: string = '';
  usuario: Usuario[] = [];

  // Control de tabs
  tabActivo: string = 'terapeuta'; // 'terapeuta' o 'paciente'

  // Datos de citas
  citas: Cita[] = [];
  
  // Filtros para consulta por terapeuta
  filtroTerapeuta: string = 'T';
  filtroFecha: string = '';
  
  // Filtros para consulta por paciente
  filtroPaciente: string = 'T';
  filtroMes: string = '';
  filtroAnio: string = '';

  // Listas para selects (deberías cargarlas desde el backend)
  terapeutas: any[] = [];
  pacientes: any[] = [];
  meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];
  anios: string[] = [];

  // Estados
  cargando: boolean = false;
  error: string = '';
  mostrarSinDatos: boolean = false;

  constructor(
    private repoAgendaService: RepoAgendaService,
    private archivoService: ArchivoService,
    private UsuarioService: UsuarioService,
    private alerta: AlertaService,
    private PacienteService: ServicioPaciente
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.inicializarFechas();
    this.generarAnios();
    this.cargarTerapeutas();
    this.cargarPacientes();
  }

    cargarTerapeutas(): void {
        this.UsuarioService.obtenerUsuariosPorRol('6')
            .pipe(
                catchError(err => {
                console.error('Error al cargar terapeutas:', err);
                return of({ success: false, data: [], message: 'Error al cargar terapeutas' });
                })
            )
            .subscribe({
                next: (response) => {
                if (response.success && response.data) {
                    // Mapear los usuarios a la estructura que necesita el select
                    this.terapeutas = response.data.map(usuario => ({
                    id: usuario.idusuario,
                    nombre: `${usuario.nombres} ${usuario.apellidos}`
                    }));
                    console.log('Terapeutas cargados:', this.terapeutas);
                } else {
                    console.warn('No se encontraron terapeutas');
                    this.terapeutas = [];
                }
                },
                error: (err) => {
                console.error('Error inesperado al cargar terapeutas:', err);
                this.terapeutas = [];
            }
        });
    }

    cargarPacientes(): void {
        this.PacienteService.obtenerListadoPacientes()
        .pipe(
            catchError(err => {
            console.error('Error al cargar pacientes:', err);
            return of([]); // Retorna array vacío en caso de error
            })
        )
        .subscribe({
            next: (pacientesData) => {
            if (pacientesData && Array.isArray(pacientesData) && pacientesData.length > 0) {
                // Mapear los pacientes a la estructura que necesita el select
                this.pacientes = pacientesData.map(paciente => ({
                id: paciente.idpaciente,
                nombre: `${paciente.nombres} ${paciente.apellidos}`
                }));
                console.log('Pacientes cargados:', this.pacientes);
            } else {
                console.warn('No se encontraron pacientes');
                this.pacientes = [];
            }
            },
            error: (err) => {
            console.error('Error inesperado al cargar pacientes:', err);
            this.pacientes = [];
            }
        });
    }

  loadUserInfo(): void {
    try {
      const usuarioData = localStorage.getItem('usuario');
      
      if (usuarioData) {
        const usuario = JSON.parse(usuarioData);        
        
        this.userInfo = {
          name: `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim(),
          avatar: usuario.rutafotoperfil ? this.archivoService.obtenerUrlPublica(usuario.rutafotoperfil) : null
          // role: usuario.fkrol || usuario.role || ''
        };
      } 
    } catch (error) {
      console.error('Error al cargar información del usuario:', error);
    }
  }

  inicializarFechas(): void {
    const hoy = new Date();
    this.filtroFecha = this.formatearFecha(hoy);
    this.filtroMes = (hoy.getMonth() + 1).toString();
    this.filtroAnio = hoy.getFullYear().toString();
  }

  generarAnios(): void {
    const anioActual = new Date().getFullYear();
    for (let i = anioActual; i >= anioActual - 5; i--) {
      this.anios.push(i.toString());
    }
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  cambiarTab(tab: string): void {
    this.tabActivo = tab;
    this.limpiarResultados();
  }

  consultarPorTerapeuta(): void {
    if (!this.filtroFecha) {
      this.error = 'La fecha es obligatoria';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.mostrarSinDatos = false;

    this.repoAgendaService.consultaPorTerapeuta(this.filtroTerapeuta, this.filtroFecha)
      .pipe(
        catchError(err => {
          if (err.status === 404 && err.error?.message) {
            return of({ success: false, message: err.error.message, data: [] });
          }
          throw err;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.length > 0) {
            this.citas = response.data;
            this.mostrarSinDatos = false;
          } else {
            this.mostrarSinDatos = true;
            this.citas = [];
          }
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'Error al consultar las citas. Por favor, intente nuevamente.';
          this.cargando = false;
          console.error('Error:', err);
        }
      });
  }

  consultarPorPacienteMes(): void {
    if (!this.filtroMes || !this.filtroAnio) {
      this.error = 'El mes y el año son obligatorios';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.mostrarSinDatos = false;

    this.repoAgendaService.consultaPorPacienteMes(this.filtroPaciente, this.filtroMes, this.filtroAnio)
      .pipe(
        catchError(err => {
          if (err.status === 404 && err.error?.message) {
            return of({ success: false, message: err.error.message, data: [] });
          }
          throw err;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.length > 0) {
            this.citas = response.data;
            this.mostrarSinDatos = false;
          } else {
            this.mostrarSinDatos = true;
            this.citas = [];
          }
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'Error al consultar las citas. Por favor, intente nuevamente.';
          this.cargando = false;
          console.error('Error:', err);
        }
      });
  }

  limpiarFiltrosTerapeuta(): void {
    this.filtroTerapeuta = 'T';
    this.inicializarFechas();
    this.limpiarResultados();
  }

  limpiarFiltrosPaciente(): void {
    this.filtroPaciente = 'T';
    this.inicializarFechas();
    this.limpiarResultados();
  }

  limpiarResultados(): void {
    this.citas = [];
    this.error = '';
    this.mostrarSinDatos = false;
  }

  formatearFechaTabla(fecha: Date): string {
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getNombreMes(numeroMes: string): string {
    const mes = this.meses.find(m => m.value === numeroMes);
    return mes ? mes.label : '';
  }

  imprimirReporte(): void {
    window.print();
  }
}
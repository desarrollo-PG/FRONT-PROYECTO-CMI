import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // <-- AGREGAR ESTA LÍNEA
import { RepoPacienteService, Paciente } from '../../services/repoPaciente.service';
import { ArchivoService } from '../../services/archivo.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-repo-pacientes',
  standalone: true,  // <-- Asegúrate que esto esté en true
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent
  ],
  templateUrl: './repoPaciente.component.html',
  styleUrls: ['./repoPaciente.component.scss']
})
export class RepoPacientesComponent implements OnInit {
  pacientes: Paciente[] = [];
  pacientesFiltrados: Paciente[] = [];
  sidebarExpanded: boolean = false;
  userInfo: any = {};
  filtroGenero: string = 'T';
  filtroEdad: string = 'T';
  
  cargando: boolean = false;
  error: string = '';
  mostrarSinDatos: boolean = false;

  opcionesGenero = [
    { value: 'T', label: 'Todos' },
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' }
  ];

  opcionesEdad = [
    { value: 'T', label: 'Todos' },
    { value: 'mayor', label: 'Mayores de edad' },
    { value: 'menor', label: 'Menores de edad' }
  ];

  constructor(
    private repoPacienteService: RepoPacienteService,
    private archivoService: ArchivoService,
  ) {}

  ngOnInit(): void {
    this.cargarPacientes();
    this.loadUserInfo();
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

  cargarPacientes(): void {
    this.cargando = true;
    this.error = '';
    this.mostrarSinDatos = false;

    this.repoPacienteService.consultaPorGenero('T').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pacientes = response.data;
          this.aplicarFiltros();
        } else {
          this.mostrarSinDatos = true;
          this.pacientes = [];
          this.pacientesFiltrados = [];
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los pacientes. Por favor, intente nuevamente.';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  aplicarFiltros(): void {
    this.cargando = true;
    this.error = '';
    this.mostrarSinDatos = false;

    if (this.filtroGenero === 'T' && this.filtroEdad === 'T') {
      this.repoPacienteService.consultaPorGenero('T').subscribe({
        next: (response) => {
          this.procesarRespuesta(response);
        },
        error: (err) => {
          this.manejarError(err);
        }
      });
      return;
    }

    if (this.filtroGenero !== 'T' && this.filtroEdad === 'T') {
      this.repoPacienteService.consultaPorGenero(this.filtroGenero).subscribe({
        next: (response) => {
          this.procesarRespuesta(response);
        },
        error: (err) => {
          this.manejarError(err);
        }
      });
      return;
    }

    if (this.filtroGenero === 'T' && this.filtroEdad !== 'T') {
      this.repoPacienteService.consultaPorEdad(this.filtroEdad).subscribe({
        next: (response) => {
          this.procesarRespuesta(response);
        },
        error: (err) => {
          this.manejarError(err);
        }
      });
      return;
    }

    this.repoPacienteService.consultaPorGenero(this.filtroGenero).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const pacientesPorGenero = response.data;
          this.filtrarPorEdadLocal(pacientesPorGenero);
        } else {
          this.mostrarSinDatos = true;
          this.pacientesFiltrados = [];
        }
        this.cargando = false;
      },
      error: (err) => {
        this.manejarError(err);
      }
    });
  }

  filtrarPorEdadLocal(pacientes: Paciente[]): void {
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - 18);

    if (this.filtroEdad === 'mayor') {
      this.pacientesFiltrados = pacientes.filter(p => 
        new Date(p.fechanacimiento) <= fechaLimite
      );
    } else if (this.filtroEdad === 'menor') {
      this.pacientesFiltrados = pacientes.filter(p => 
        new Date(p.fechanacimiento) > fechaLimite
      );
    } else {
      this.pacientesFiltrados = pacientes;
    }

    if (this.pacientesFiltrados.length === 0) {
      this.mostrarSinDatos = true;
    }
  }

  procesarRespuesta(response: any): void {
    if (response.success && response.data) {
      this.pacientesFiltrados = response.data;
      this.mostrarSinDatos = false;
    } else {
      this.mostrarSinDatos = true;
      this.pacientesFiltrados = [];
    }
    this.cargando = false;
  }

  manejarError(err: any): void {
    this.error = 'Error al aplicar filtros. Por favor, intente nuevamente.';
    this.cargando = false;
    console.error('Error:', err);
  }

  limpiarFiltros(): void {
    this.filtroGenero = 'T';
    this.filtroEdad = 'T';
    this.cargarPacientes();
  }

  calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  exportarExcel(): void {
    console.log('Exportar a Excel');
  }

  imprimirReporte(): void {
    window.print();
  }
}
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';

// FullCalendar imports
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Date utilities
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArchivoService } from '../../services/archivo.service';

// Interfaces
export interface Cita {
  idagenda: number;
  fkusuario: number;
  fkpaciente: number;
  fechaatencion: string;
  horaatencion: string;
  comentario?: string;
  transporte?: number;
  fechatransporte?: string;
  horariotransporte?: string;
  direccionTransporte?: string;
  nombreEncargado?: string;
  contactoEncargado?: string;
  usuario: {
    nombres: string;
    apellidos: string;
    profesion?: string;
  };
  paciente: {
    nombres: string;
    apellidos: string;
    cui: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FullCalendarModule,
    SidebarComponent
  ],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit, AfterViewInit {
  
  // ============================================
  // VARIABLES DE CONTROL DE VISTAS (SEPARADAS)
  // ============================================
  
  // Para el componente (mostrar lista, formulario, etc.)
  currentView: 'list' | 'form' | 'detail' = 'list';
  
  // Para el calendario de FullCalendar (NUEVA VARIABLE)
  calendarView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' = 'dayGridMonth';
  
  // ============================================
  // CONFIGURACIÓN DEL CALENDARIO
  // ============================================
  
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: false, // Desactivar toolbar de FullCalendar
    locale: 'es',
    firstDay: 1, // Lunes como primer día
    height: 'auto',
    
    // Configuración de eventos
    events: [],
    selectable: true,
    selectMirror: true,
    dayMaxEvents: 3,
    
    // Callbacks
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    datesSet: this.handleDatesSet.bind(this),
    
    // Personalización
    titleFormat: { year: 'numeric', month: 'long' },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    
    // Configuración de días
    weekends: true,
    editable: false, // Deshabilitar edición por drag
    
    // Mostrar números de semana
    weekNumbers: false,
    
    // Configuración de slots de tiempo
    slotMinTime: '08:00:00',
    slotMaxTime: '18:00:00',
    slotDuration: '01:00:00'
  };

  // ============================================
  // VARIABLES DE ESTADO
  // ============================================
  
  currentEvents: any[] = [];
  showModal = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';
  selectedDate: string = '';
  selectedCita: Cita | null = null;
  selectedMedico: string = '';
  loading = false;
  searchTerm: string = '';
  fechaActual: string = '';
  tituloCalendario: string = '';
  sidebarExpanded: boolean = false;
  userInfo: any = {};

  // ============================================
  // DATOS PARA FORMULARIOS
  // ============================================
  
  medicos: any[] = [
    { id: 1, nombres: 'Juan', apellidos: 'Pérez' },
    { id: 2, nombres: 'María', apellidos: 'García' },
    { id: 3, nombres: 'Carlos', apellidos: 'López' }
  ];

  pacientes: any[] = [
    { id: 1, nombres: 'Ana', apellidos: 'Martínez', cui: '1234567890123' },
    { id: 2, nombres: 'Luis', apellidos: 'Rodríguez', cui: '9876543210987' },
    { id: 3, nombres: 'Carmen', apellidos: 'Silva', cui: '5555555555555' }
  ];

  slotsDisponibles: any[] = [
    { hora: '08:00' },
    { hora: '09:00' },
    { hora: '10:00' },
    { hora: '11:00' },
    { hora: '14:00' },
    { hora: '15:00' },
    { hora: '16:00' },
    { hora: '17:00' }
  ];

  // ============================================
  // FORMULARIO REACTIVO
  // ============================================
  
  citaForm!: FormGroup;

  // ============================================
  // DATOS DE EJEMPLO
  // ============================================
  
  citasEjemplo: Cita[] = [
    {
      idagenda: 1,
      fkusuario: 1,
      fkpaciente: 1,
      fechaatencion: '2025-09-30',
      horaatencion: '09:00',
      comentario: 'Consulta de control',
      nombreEncargado: 'Pedro Martínez',
      contactoEncargado: '+502 1234-5678',
      usuario: { nombres: 'Juan', apellidos: 'Pérez', profesion: 'Medicina General' },
      paciente: { nombres: 'Ana', apellidos: 'Martínez', cui: '1234567890123' }
    },
    {
      idagenda: 2,
      fkusuario: 2,
      fkpaciente: 2,
      fechaatencion: '2025-09-30',
      horaatencion: '14:00',
      comentario: 'Primera consulta',
      nombreEncargado: 'Carmen Rodríguez',
      contactoEncargado: '+502 9876-5432',
      usuario: { nombres: 'María', apellidos: 'García', profesion: 'Pediatría' },
      paciente: { nombres: 'Luis', apellidos: 'Rodríguez', cui: '9876543210987' }
    },
    {
      idagenda: 3,
      fkusuario: 3,
      fkpaciente: 3,
      fechaatencion: '2025-10-01',
      horaatencion: '10:00',
      comentario: 'Revisión mensual',
      nombreEncargado: 'José Silva',
      contactoEncargado: '+502 5555-5555',
      usuario: { nombres: 'Carlos', apellidos: 'López', profesion: 'Cardiología' },
      paciente: { nombres: 'Carmen', apellidos: 'Silva', cui: '5555555555555' }
    }
  ];

  // ============================================
  // CONSTRUCTOR
  // ============================================

  constructor(
    private archivoService: ArchivoService,
    private fb: FormBuilder
  ) {
    this.initForm();
    this.fechaActual = new Date().toLocaleDateString('es-ES');
    this.tituloCalendario = format(new Date(), 'MMMM yyyy', { locale: es });
  }

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  ngOnInit(): void {
    this.cargarCitas();
    this.loadUserInfo();
  }

  ngAfterViewInit(): void {
    // Esperar a que el DOM esté completamente renderizado
    setTimeout(() => {
      this.detectSidebarState();
      
      // Resize inicial para asegurar que el calendario se muestre correctamente
      setTimeout(() => {
        this.resizeCalendar();
      }, 500);
    }, 100);
  }

  // ============================================
  // MÉTODOS DE INICIALIZACIÓN
  // ============================================

  loadUserInfo(): void {
    try {
      const usuarioData = localStorage.getItem('usuario');
      
      if (usuarioData) {
        const usuario = JSON.parse(usuarioData);        
        
        this.userInfo = {
          name: `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim(),
          avatar: usuario.rutafotoperfil ? this.archivoService.obtenerUrlPublica(usuario.rutafotoperfil) : null
        };
      } 
    } catch (error) {
      console.error('Error al cargar información del usuario:', error);
    }
  }

  initForm(): void {
    this.citaForm = this.fb.group({
      fkpaciente: ['', Validators.required],
      nombreEncargado: [{ value: '', disabled: true }, Validators.required],
      contactoEncargado: [{ value: '', disabled: true }, Validators.required],
      fkusuario: ['', Validators.required],
      fechaatencion: ['', Validators.required],
      horaatencion: ['', Validators.required],
      comentario: [''],
      transporte: [false],
      horariotransporte: [''],
      direccionTransporte: ['']
    });

    // Listener para auto-llenar datos del paciente
    this.citaForm.get('fkpaciente')?.valueChanges.subscribe(pacienteId => {
      if (pacienteId) {
        const paciente = this.pacientes.find(p => p.id == pacienteId);
        if (paciente) {
          // Simular datos del encargado (en proyecto real vendrían del backend)
          this.citaForm.patchValue({
            nombreEncargado: `Encargado de ${paciente.nombres}`,
            contactoEncargado: `+502 1234-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
          });
        }
      }
    });

    // Listener para fecha - actualizar slots disponibles
    this.citaForm.get('fechaatencion')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        this.actualizarSlotsDisponibles(fecha);
      }
    });
  }

  // ============================================
  // MÉTODOS DEL SIDEBAR
  // ============================================

  detectSidebarState(): void {
    const checkSidebar = () => {
      const sidebar = document.querySelector('.sidebar-container') || 
                    document.querySelector('.sidebar') || 
                    document.querySelector('[class*="sidebar"]');
      
      if (sidebar) {
        const isExpanded = sidebar.classList.contains('expanded') || 
                          sidebar.classList.contains('open') ||
                          sidebar.classList.contains('sidebar-expanded');
        
        if (this.sidebarExpanded !== isExpanded) {
          this.sidebarExpanded = isExpanded;
          console.log('Sidebar state changed:', isExpanded);
          
          setTimeout(() => {
            this.resizeCalendar();
          }, 400);
        }
      }
    };

    setTimeout(checkSidebar, 100);
    
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'class' || mutation.attributeName === 'style') {
            const target = mutation.target as Element;
            if (target.classList.contains('sidebar-container') || 
                target.classList.contains('sidebar') ||
                target.className.includes('sidebar')) {
              shouldCheck = true;
            }
          }
        }
      });
      
      if (shouldCheck) {
        checkSidebar();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      subtree: true
    });

    window.addEventListener('resize', () => {
      setTimeout(() => this.resizeCalendar(), 100);
    });
  }

  private resizeCalendar(): void {
    try {
      const fullCalendarElement = document.querySelector('full-calendar') as any;
      if (fullCalendarElement && fullCalendarElement.getApi) {
        const calendarApi = fullCalendarElement.getApi();
        console.log('Resizing calendar via API...');
        calendarApi.updateSize();
        return;
      }

      const calendarComponent = document.querySelector('full-calendar ng-component') as any;
      if (calendarComponent && calendarComponent.calendar) {
        console.log('Resizing calendar via component...');
        calendarComponent.calendar.updateSize();
        return;
      }

      window.dispatchEvent(new Event('resize'));
      console.log('Forced window resize event');

    } catch (error) {
      console.error('Error resizing calendar:', error);
      window.dispatchEvent(new Event('resize'));
    }
  }

  // ============================================
  // MÉTODOS DE CARGA DE DATOS
  // ============================================

  async cargarCitas(): Promise<void> {
    this.loading = true;
    try {
      // Simular llamada al backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const citas = this.selectedMedico 
        ? this.citasEjemplo.filter(c => c.fkusuario.toString() === this.selectedMedico)
        : this.citasEjemplo;
      
      // Convertir citas a eventos de FullCalendar
      this.calendarOptions.events = citas.map(cita => ({
        id: cita.idagenda.toString(),
        title: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
        start: `${cita.fechaatencion}T${cita.horaatencion}:00`,
        backgroundColor: this.getColorPorMedico(cita.fkusuario),
        borderColor: this.getColorPorMedico(cita.fkusuario),
        textColor: '#ffffff',
        extendedProps: {
          medico: `Dr. ${cita.usuario.nombres} ${cita.usuario.apellidos}`,
          paciente: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
          comentario: cita.comentario,
          horaatencion: cita.horaatencion,
          citaCompleta: cita
        }
      }));
      
      // Forzar actualización del calendario
      this.calendarOptions = { ...this.calendarOptions };
      
      setTimeout(() => this.resizeCalendar(), 100);
    } catch (error) {
      console.error('Error cargando citas:', error);
    } finally {
      this.loading = false;
    }
  }

  // ============================================
  // MÉTODOS DEL CALENDARIO
  // ============================================

  handleDateSelect(selectInfo: DateSelectArg): void {
    this.selectedDate = selectInfo.startStr;
    this.modalMode = 'create';
    this.selectedCita = null;
    this.citaForm.patchValue({
      fechaatencion: selectInfo.startStr
    });
    this.showModal = true;
  }

  handleEventClick(clickInfo: EventClickArg): void {
    const citaId = parseInt(clickInfo.event.id);
    this.modalMode = 'view';
    this.selectedCita = clickInfo.event.extendedProps['citaCompleta'];
    this.showModal = true;
  }

  handleEvents(events: any[]): void {
    this.currentEvents = events;
  }

  handleDatesSet(dateInfo: any): void {
    this.tituloCalendario = format(dateInfo.start, 'MMMM yyyy', { locale: es });
    setTimeout(() => this.resizeCalendar(), 100);
  }

  // ============================================
  // MÉTODOS DE NAVEGACIÓN DEL CALENDARIO
  // ============================================

  cambiarVista(vista: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'): void {
    this.calendarView = vista;
    const calendarApi = (document.querySelector('full-calendar') as any)?.getApi();
    if (calendarApi) {
      calendarApi.changeView(vista);
      setTimeout(() => this.resizeCalendar(), 100);
    }
  }

  navegarMes(direccion: 'prev' | 'next'): void {
    const calendarApi = (document.querySelector('full-calendar') as any)?.getApi();
    if (calendarApi) {
      if (direccion === 'prev') {
        calendarApi.prev();
      } else {
        calendarApi.next();
      }
      setTimeout(() => this.resizeCalendar(), 100);
    }
  }

  irAHoy(): void {
    const calendarApi = (document.querySelector('full-calendar') as any)?.getApi();
    if (calendarApi) {
      calendarApi.today();
      setTimeout(() => this.resizeCalendar(), 100);
    }
  }

  // ============================================
  // MÉTODOS DEL MODAL
  // ============================================

  abrirModalNuevaCita(): void {
    this.selectedDate = format(new Date(), 'yyyy-MM-dd');
    this.modalMode = 'create';
    this.selectedCita = null;
    this.citaForm.reset();
    this.citaForm.patchValue({
      fechaatencion: this.selectedDate,
      transporte: false
    });
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.selectedCita = null;
    this.citaForm.reset();
  }

  editarCita(): void {
    this.modalMode = 'edit';
    if (this.selectedCita) {
      this.citaForm.patchValue({
        fkpaciente: this.selectedCita.fkpaciente,
        nombreEncargado: this.selectedCita.nombreEncargado || '',
        contactoEncargado: this.selectedCita.contactoEncargado || '',
        fkusuario: this.selectedCita.fkusuario,
        fechaatencion: this.selectedCita.fechaatencion,
        horaatencion: this.selectedCita.horaatencion,
        comentario: this.selectedCita.comentario || '',
        transporte: this.selectedCita.transporte === 1,
        horariotransporte: this.selectedCita.horariotransporte || '',
        direccionTransporte: this.selectedCita.direccionTransporte || ''
      });
    }
  }

  async guardarCita(): Promise<void> {
    if (this.citaForm.invalid) {
      console.log('Formulario inválido');
      return;
    }

    this.loading = true;
    try {
      const formData = this.citaForm.value;
      console.log('Guardando cita:', formData);
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En proyecto real: await this.agendaService.saveCita(formData).toPromise();
      
      await this.cargarCitas();
      this.cerrarModal();
    } catch (error) {
      console.error('Error guardando cita:', error);
    } finally {
      this.loading = false;
    }
  }

  async eliminarCita(): Promise<void> {
    if (!this.selectedCita) return;
    
    if (confirm('¿Está seguro de eliminar esta cita?')) {
      this.loading = true;
      try {
        console.log('Eliminando cita:', this.selectedCita.idagenda);
        
        // Simular eliminación
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // En proyecto real: await this.agendaService.deleteCita(this.selectedCita.idagenda).toPromise();
        
        await this.cargarCitas();
        this.cerrarModal();
      } catch (error) {
        console.error('Error eliminando cita:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  // ============================================
  // MÉTODOS DE FILTRADO Y BÚSQUEDA
  // ============================================

  async filtrarPorMedico(): Promise<void> {
    await this.cargarCitas();
  }

  buscarCitas(): void {
    console.log('Buscando:', this.searchTerm);
    // Implementar búsqueda de citas
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  getColorPorMedico(medicoId: number): string {
    const colores = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colores[medicoId % colores.length];
  }

  private actualizarSlotsDisponibles(fecha: string): void {
    // Aquí implementarías la lógica para obtener slots disponibles por fecha
    // En proyecto real consultarías al backend
    console.log('Actualizando slots para fecha:', fecha);
  }

  // ============================================
  // MÉTODOS DE DEBUG (PUEDES REMOVERLOS)
  // ============================================

  public forceCalendarResize(): void {
    this.resizeCalendar();
  }

  public debugCalendarSize(): void {
    const calendarWrapper = document.querySelector('.calendar-wrapper') as HTMLElement;
    const fullCalendar = document.querySelector('full-calendar') as HTMLElement;
    
    console.log('Calendar wrapper dimensions:', {
      width: calendarWrapper?.clientWidth,
      offsetWidth: calendarWrapper?.offsetWidth,
      scrollWidth: calendarWrapper?.scrollWidth
    });
    
    console.log('FullCalendar dimensions:', {
      width: fullCalendar?.clientWidth,
      offsetWidth: fullCalendar?.offsetWidth,
      scrollWidth: fullCalendar?.scrollWidth
    });
    
    console.log('Sidebar expanded:', this.sidebarExpanded);
  }
}
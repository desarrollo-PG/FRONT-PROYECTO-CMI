// src/app/app.routes.ts
import type { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { cambioClaveGuard } from './guards/cambioClave.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
  },
  {
  path: 'cambiar-clave-temporal',
  loadComponent: () => import('./components/cambiar-clave-temporal/cambiar-clave-temporal.component').then(m => m.CambiarClaveTemporalComponent),
  canActivate: [cambioClaveGuard] 
  },
  {
    path: 'bienvenida',
    loadComponent: () =>
      import('./components/bienvenida/pantallaBienvenida.component').then(m => m.PantallaBienvenidaComponent),
    canActivate: [authGuard],
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./components/menu/menu.component').then(m => m.MenuComponent),
    canActivate: [authGuard],
  },
  { 
    path: 'usuario', 
    loadComponent: () => import('./components/usuario/usuario.component').then(c => c.UsuarioComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,2,5] } //administración, sistemas
  },
  {
    path: 'pacientes',
    loadComponent: () =>
      import('./components/paciente/paciente-list.component').then(m => m.PacienteListaComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,2,5,6,14] } //administracion, medico-general, sistemas,fisioterapeuta
  },
  {
    path: 'expedientes',
    loadComponent: () =>
      import('./components/expediente/expediente').then(m => m.ExpedienteListaComponent), 
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,2,5,6,14] } //administracion, medico-general, sistemas, fisioterapeuta
  },
  {
    path: 'historial/:id',
    loadComponent: () =>
      import('./components/historialMedico/historialMedico').then(m => m.HistorialMedicoComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,2,5,6,14] } //administracion, medico-general, sistemas, fisioterapeuta
  },
  { 
    path: 'agenda', 
    loadComponent: () => import('./components/agenda/agenda.component').then(m => m.AgendaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,2,4,5,6,14] } //administracion, medico-general, sistemas, fisioterapeuta
  },
  { 
     path: 'perfil', 
     loadComponent: () => import('./components/perfil/perfil.component').then(m => m.PerfilComponent),
     canActivate: [authGuard, roleGuard],
     data: { roles: [1,2,5,6] } //administracion, medico-general, sistemas, fisioterapeuta
   },
  {
    path: 'administracion',
    loadComponent: () =>
      import('./components/gestionclinica/gestionclinica').then(m => m.GestionClinicaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,5] } //administración, sistemas
  },
  {
    path: 'educacion-inclusiva',
    loadComponent: () =>
      import('./components/gestionclinica/gestionclinica').then(m => m.GestionClinicaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,5] } //administración, sistemas
  },
  {
    path: 'fisioterapia',
    loadComponent: () =>
      import('./components/gestionclinica/gestionclinica').then(m => m.GestionClinicaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,4,5,6,14] } //administración, sistemas, fisioterapeuta
  },
  {
    path: 'medicina-general',
    loadComponent: () =>
      import('./components/gestionclinica/gestionclinica').then(m => m.GestionClinicaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,2,5] } //administracion, medico-general, sistemas
  },
  {
    path: 'nutricion',
    loadComponent: () =>
      import('./components/gestionclinica/gestionclinica').then(m => m.GestionClinicaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,5] } //administración, sistemas
  },
  {
    path: 'psicologia',
    loadComponent: () =>
      import('./components/gestionclinica/gestionclinica').then(m => m.GestionClinicaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,5] } //administración, sistemas
  },
  {
    path: 'reporteria',
    loadComponent: () =>
      import('./components/reporteria/reporteria.component').then(m => m.ReporteriaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] } 
  },
  {
    path: 'repoPaciente',
    loadComponent: () =>
      import('./components/repoPaciente/repoPaciente.component').then(m=> m.RepoPacientesComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,4,5,14] }
  },
  {
    path: 'repoAgenda',
    loadComponent: () =>
      import('./components/repoAgenda/repoAgenda.component').then(m => m.RepoAgendaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [1,4,5,14] }
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];
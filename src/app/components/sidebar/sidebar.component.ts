// sidebar.component.ts
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HasRoleDirective } from '../../directives/has-role.directive';

export interface MenuItem {
  label: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  roles?: number[];
}

@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [CommonModule, HasRoleDirective],
})
export class SidebarComponent {
  @Input() userInfo: { name: string; avatar?: string } = { name: 'Usuario' };
  @Input() menuItems: MenuItem[] = [];
  @Input() footerText: string = '';

  @Output() menuItemClick = new EventEmitter<MenuItem>();

  mobileMenuOpen: boolean = false;

  defaultMenuItems: MenuItem[] = [
    {
      label: 'Gestión de usuarios',
      icon: 'fas fa-users',
      roles: [1, 5],
      children: [
        { label: 'Usuarios', route: '/usuario', roles: [1, 5] },
        { label: 'Perfiles', route: '/perfil', roles: [] }
      ]
    },
    {
      label: 'Gestión de Pacientes',
      icon: 'fas fa-hospital-user',
      roles: [1, 2, 5, 6],
      children: [
        { label: 'Pacientes', route: '/pacientes', roles: [1, 2, 5, 6, 14] },
        { label: 'Expedientes', route: '/expedientes', roles: [1, 5, 6] },
        { label: 'Referidos', route: '/referidos', roles: [] }
        // { label: 'Inventario', route: '/inventario', roles: [] }
      ]
    },
    {
      label: 'Gestión Clinica',
      icon: 'fas fa-hospital',
      roles: [1, 2, 5, 6],
      children: [
        { label: 'Agenda', route: '/agenda', roles: [1, 2, 5, 6] }
        // { label: 'Administración', route: '/administracion', roles: [] },
        // { label: 'Educación Inclusiva', route: '/educacion-inclusiva', roles: [] },
        // { label: 'Fisioterapia', route: '/fisioterapia', roles: [] },
        // { label: 'Medicina General', route: '/medicina-general', roles: [] },
        // { label: 'Nutrición', route: '/nutricion', roles: [] },
        // { label: 'Psicología', route: '/psicologia', roles: [] }
      ]
    },
    {
      label: 'Reportes',
      icon: 'fas fa-chart-bar',
      roles: [1,5],
      children: [
        { label: 'Pacientes', route: '/repoPaciente', roles: [1,5] },
        { label: 'Agenda', route: '/repoAgenda', roles: [1,5] }
      ]
    },
    {
      label: 'Cerrar Sesión',
      icon: 'fas fa-sign-out-alt',
      roles: [1, 2, 5, 6],
      route: '/logout'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  get currentMenuItems(): MenuItem[] {
    return this.menuItems.length > 0 ? this.menuItems : this.defaultMenuItems;
  }

  onMenuItemClick(item: MenuItem, event?: Event) {
    // Prevenir que el click se propague al document
    if (event) {
      event.stopPropagation();
    }

    // Caso especial: Cerrar Sesión
    if (item.label === 'Cerrar Sesión' || item.route === '/logout') {
      this.authService.logout();
      this.mobileMenuOpen = false;
      return;
    }

    if (item.children && item.children.length > 0) {
      // Toggle el menú expandido
      item.expanded = !item.expanded;
      // Cerrar otros menús
      this.closeOtherMenus(item);
    } else if (item.route) {
      this.router.navigate([item.route]);
      this.mobileMenuOpen = false;
      this.closeAllMenus();
    }
    this.menuItemClick.emit(item);
  }

  onSubMenuItemClick(item: MenuItem, event?: Event) {
    // Prevenir que el click se propague
    if (event) {
      event.stopPropagation();
    }

    if (item.route) {
      this.router.navigate([item.route]);
      this.closeAllMenus();
      this.mobileMenuOpen = false;
      this.menuItemClick.emit(item);
    } else {
      this.menuItemClick.emit(item);
    }
  }

  onUserNameClick() {
    this.router.navigate(['/fisioterapia']);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeOtherMenus(currentItem: MenuItem) {
    this.currentMenuItems.forEach(item => {
      if (item !== currentItem) {
        item.expanded = false;
      }
    });
  }

  closeAllMenus() {
    this.currentMenuItems.forEach(item => {
      item.expanded = false;
    });
  }

  // Cerrar dropdowns al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Solo cerrar si el click NO fue en un menú o dropdown
    if (!target.closest('.navbar-horizontal')) {
      this.closeAllMenus();
    }
  }
}
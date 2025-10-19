
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { AuthService } from '../app/services/auth.service';
import { Router } from '@angular/router';
import { AlertaService } from '../app/services/alerta.service';

interface BackendResponse {
  success: boolean;
  cambiarClave?: boolean;
  message?: string;
  data?: any;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);
  const alerta = inject(AlertaService);
  
  const token = localStorage.getItem('token');
  
  if (token) {
    
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(authReq).pipe(
      tap({
        next: (event) => {
          // Verificar si es una respuesta HTTP
          if (event instanceof HttpResponse) {
            const body = event.body as BackendResponse; 
            
            if (body && body.cambiarClave === true && body.success === false) {
              authService.manejarCambioObligatorio();
            }
          }
        },
        error: (error) => {
          if (error.status === 401) {
            authService.logout();
          }

          if (error.status === 403) {
            alerta.alertaError('Sin permisos');
          }
        }
      })
    );
    
  } else {
    // Sin token, pasar la petición normal
    return next(req);
  }
};
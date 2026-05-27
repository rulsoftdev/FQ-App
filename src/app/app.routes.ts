import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { CreadorMision } from './features/creador-mision/creador-mision';
import { JuegoContainer } from './features/juego-container/juego-container'; // Tu pantalla actual de juego

export const routes: Routes = [
  { 
    path: 'dashboard', 
    component: Dashboard,
    title: 'Feten Quest - Taberna'
  },
  { 
    path: 'crear-mision', 
    component: CreadorMision,
    title: 'Feten Quest - Forjar Misión'
  },
  { 
    path: 'juego', 
    component: JuegoContainer,
    title: 'Feten Quest - En la Mazmorra'
  },
  
  // Enrutamiento por defecto: Si no hay ruta o se escribre algo mal, al menú principal
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];

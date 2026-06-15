import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { CreadorMision } from './features/creador-mision/creador-mision';
import { JuegoContainer } from './features/juego-container/juego-container'; // Tu pantalla actual de juego

export const routes: Routes = [
  { 
    path: 'la-taberna', 
    component: Dashboard,
    title: 'Feten Quest - Taberna'
  },
  { 
    path: 'forjar-aventura', 
    component: CreadorMision,
    title: 'Feten Quest - Forjar Misión'
  },
  { 
    path: 'la-mazmorra', 
    component: JuegoContainer,
    title: 'Feten Quest - En la Mazmorra'
  },
  
  // Enrutamiento por defecto: Si no hay ruta o se escribre algo mal, al menú principal
  { path: '', redirectTo: '/la-taberna', pathMatch: 'full' },
  { path: '**', redirectTo: '/la-taberna' }
];

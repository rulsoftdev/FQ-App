import { Component, computed, inject } from '@angular/core';
import { FormBuilder, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { AtrezoFijo, MisionCustom, SalaEspecialFija } from '../../core/models/mision-custom.interface';
import { Router, RouterLink } from '@angular/router';
import { MisionService } from '../../core/services/mision.service';
import { EncuentrosService } from '../../core/services/encuentros.service';
import { convertirAStringFormateado, convertirAStringFormateadoConCantidad } from '../../core/utils';
import { Mision } from '../../core/models/fetenquest.interface';
import { ModoJuego, UiService } from '../../core/services/ui.service';
import { DeckService } from '../../core/services/deck.service';
import { PersistenceService } from '../../core/services/persistence.service';

@Component({
  selector: 'app-crear-mision',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './creador-mision.html',
  styleUrl: './creador-mision.scss',
})
export class CreadorMision {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private uiService = inject(UiService);
  private deckService = inject(DeckService);
  private misionService = inject(MisionService);
  private encuentrosService = inject(EncuentrosService);
  private persistenceService = inject(PersistenceService);
  
  public pasoActual = 1;

  // Maestros de datos para los listados de selección
  public listadoTablasEncuentros = computed(() => {
    const encuentrosGenerales = this.encuentrosService.encuentros()
      .filter(e => e.tipoLista === 'GENERAL')
      .map(e => e.familia);

    // El Set se encarga de eliminar los duplicados perfectamente
    return [...new Set(encuentrosGenerales)];
  });

  public listadoTiposAtrezos = computed(() => {
    const tiposAtrezos = this.deckService.getMazoFull('M-ATR')
      .filter(c => c.tipo !== 'Cofre' && c.tipo !== 'Sin Atrezo')
      .map(e => e.tipo);
      
    return [...new Set(tiposAtrezos)];
  });
  
  public listadoTiposSalasEsp = computed(() => {
    const tiposSalasEsp = this.deckService.getMazoFull('M-ESP')
      .filter(c => c.tipo !== 'Sala Especial')
      .map(e => e.tipo);
      
    return [...new Set(tiposSalasEsp)];
  });

  public listadoIdsSalasEspecialesEspecificas = computed(() => {
    const listadoIdsSalasEspeciales = this.deckService.getMazoFull('M-ESP')
      .filter(c => c.tipo === 'Sala Especial');
      
    return [...new Set(listadoIdsSalasEspeciales)];
  });

  // Formulario Reactivo Estructurado
  public wizardForm = this.fb.group({
    // PASO 1: Datos Básicos e Inicialización
    paso1: this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      introduccion: ['', [Validators.required]],
      peligroInicial: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
      dadoTrampa: ['1D12', [Validators.required]],
      tablaEncuentros: ['', [Validators.required]],
      errante: ['', [Validators.required]],
      erranteSuperior: ['', [Validators.required]]
    }),

    // PASO 2: Configuración de Mazos Físicos y Atrezos
    paso2: this.fb.group({
      tipoMision: 'TABLERO',
      salasNormales: [6],
      salasEspeciales: [2],
      mazmorraSalasNormales: [6],
      mazmorraSalasEspeciales: [2],
      mazmorraPasillos: [3],

      incluyeEscalera: [false],
      incluyeSalaObjetivo: [true],
      incluyeJefe: [false],

    }),

    // PASO 3: Configuración Avanzada de Salas Especiales (Sustituye a la condición de victoria)
    paso3: this.fb.group({
      sinAtrezo: [10],
      atrezoAzar: [8],
      atrezoCofre: [1],
      tiposAtrezoFijos: this.fb.array([]),       
      tiposAtrezoExcluido: [[] as string[]], 
    }),

    paso4: this.fb.group({
      modoSeleccion: ['POR_TIPOS', [Validators.required]], // 'POR_TIPOS' o 'POR_IDS'
      tiposSalasEsp: this.fb.array([]),
      idsSalasEspeciales: [[] as string[]],
      salasEspecialesAzar: 0
    })
  });

  // --- Getters de FormArrays ---
  get tiposAtrezoFijos(): FormArray {
    return this.wizardForm.get('paso3.tiposAtrezoFijos') as FormArray;
  }

  get tiposSalasEsp(): FormArray {
    return this.wizardForm.get('paso4.tiposSalasEsp') as FormArray;
  }

  // --- Métodos de Atrezo Fijo ---
  public anyadirAtrezoFijo() {
    const grupo = this.fb.group({
      tipo: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    this.tiposAtrezoFijos.push(grupo);
  }

  public eliminarAtrezoFijo(index: number) {
    this.tiposAtrezoFijos.removeAt(index);
  }

  // --- Métodos de Salas Especiales por Tipo ---
  public anyadirSalaEspecialFija() {
    const grupo = this.fb.group({
      tipo: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    this.tiposSalasEsp.push(grupo);
  }

  public eliminarSalaEspecialFija(index: number) {
    this.tiposSalasEsp.removeAt(index);
  }

  /**
   * Verifica si el paso actual cumple con todas las validaciones necesarias
   */
  public esPasoValido(): boolean {
    const pasoGroupName = `paso${this.pasoActual}`;
    const grupoActual = this.wizardForm.get(pasoGroupName);

    // Si el grupo del paso base de Angular no es válido, frenamos
    if (!grupoActual || grupoActual.invalid) {
      return false;
    }

    // LÓGICA DE VALIDACIÓN AVANZADA CRUZADA PARA EL PASO 4
    if (this.pasoActual === 4) {
      const rawValues = this.wizardForm.value;
      const paso2 = rawValues.paso2!;
      const paso4 = rawValues.paso4!;

      // 1. Averiguamos cuántas salas especiales totales prometió el usuario en el Paso 2
      const totalSalasEsperadas = paso2.tipoMision === 'TABLERO'
        ? (Number(paso2.salasEspeciales) || 0)
        : (Number(paso2.mazmorraSalasEspeciales) || 0);

      // 2. Calculamos cuántas salas está configurando en el Paso 4 según el modo de selección
      let totalSalasConfiguradas = 0;

      if (paso4.modoSeleccion === 'POR_TIPOS') {
        const salasEspArray = paso4.tiposSalasEsp || [];
        // Sumamos todas las cantidades especificadas en el FormArray dinámico
        totalSalasConfiguradas = salasEspArray.reduce((acc: number, item: any) => acc + (Number(item?.cantidad) || 0), 0);
      } else {
        // Si es POR IDs, contamos cuántos elementos seleccionó en el multi-select
        const idsSeleccionados = paso4.idsSalasEspeciales || [];
        totalSalasConfiguradas = idsSeleccionados.length;
      }

      totalSalasConfiguradas += paso4.salasEspecialesAzar || 0;
      // El paso 4 solo será válido si las cantidades coinciden con exactitud matemática
      return totalSalasConfiguradas >= totalSalasEsperadas;
    }

    return true;
  }

  /**
   * Devuelve la suma total de salas especiales configuradas en el Paso 4
   */
  get totalSalasConfiguradasPaso4(): number {
    const paso4 = this.wizardForm.get('paso4')?.value;
    if (!paso4) return 0;

    let cantidadSalas = 0;
    if (paso4.modoSeleccion === 'POR_TIPOS') {
      const salasArray = paso4.tiposSalasEsp || [];
      // Sumamos el campo 'cantidad' de cada fila del FormArray
      cantidadSalas = salasArray.reduce((acc: number, item: any) => acc + (Number(item?.cantidad) || 0), 0);
    } else {
      // Si es por IDs, la cantidad es simplemente el número de elementos seleccionados
      cantidadSalas = paso4.idsSalasEspeciales?.length || 0;
    }
    return cantidadSalas + (Number(paso4.salasEspecialesAzar) || 0);
  }

  /**
   * Devuelve el objetivo de salas especiales que se definió en el Paso 2
   */
  get objetivoSalasEspeciales(): number {
    const paso2 = this.wizardForm.get('paso2')?.value;
    if (!paso2) return 0;

    return paso2.tipoMision === 'TABLERO'
      ? (Number(paso2.salasEspeciales) || 0)
      : (Number(paso2.mazmorraSalasEspeciales) || 0);
  }

  // --- Navegación del Wizard ---
  public avanzarPaso() {
    if (this.esPasoValido() && this.pasoActual < 4) {
      this.pasoActual++;
    }
    console.log("VALORES: ", this.wizardForm.value);
  }

  public retrocederPaso() {
    if (this.pasoActual > 1) this.pasoActual--;
  }

  // --- Mapeo y Persistencia Final ---
  public finalizarMisionCustom() {
    console.log("VALORES: ", this.wizardForm.value);
    if (this.wizardForm.valid) {
      const rawValues = this.wizardForm.value;
      const modoSalas = rawValues.paso4!.modoSeleccion;
      const modoJuego = rawValues.paso2!.tipoMision;
      // Convertimos los arrays dinámicos a tu formato string: "1-Cripta, 2-Mesa"
      const atrezoFijoString = convertirAStringFormateadoConCantidad(rawValues.paso3!.tiposAtrezoFijos);
      const salasEspecialesString = modoSalas === 'POR_TIPOS' 
        ? convertirAStringFormateadoConCantidad(rawValues.paso4!.tiposSalasEsp) 
        : '';
      const atrezoExcluidoString = rawValues.paso3!.tiposAtrezoExcluido?.join(', ') || '';
      
      const misionEstructurada: Mision = {
        id: 'CUSTOM_SANDBOX',
        nombre: rawValues.paso1!.nombre!,
        lore: rawValues.paso1!.introduccion!,
        imagen: '/misiones/CUSTOM_SANDBOX.png',
        dificultad: 1,
        nivelPeligroInicial: rawValues.paso1!.peligroInicial!,
        dadoTrampa: rawValues.paso1!.dadoTrampa as '1D4' | '1D6' | '1D8' | '1D10' | '1D12',
        tablaEncuentros: rawValues.paso1!.tablaEncuentros!,
        monstruoErrante: rawValues.paso1!.errante!,
        monstruoErranteSuperior: rawValues.paso1!.erranteSuperior!,
        configuracion: {
          salasNormales: rawValues.paso2!.salasNormales!,
          salasEspeciales: rawValues.paso2!.salasEspeciales!,
          mazmorraSalasNormales: rawValues.paso2!.mazmorraSalasNormales!,
          mazmorraSalasEspeciales: rawValues.paso2!.mazmorraSalasEspeciales!,
          mazmorraPasillos: rawValues.paso2!.mazmorraPasillos!,
          incluyeEscalera: rawValues.paso2!.incluyeEscalera!,
          incluyeSalaObjetivo: rawValues.paso2!.incluyeSalaObjetivo!,
          incluyeJefe: rawValues.paso2!.incluyeJefe!,
          atrezoSinAtrezo: rawValues.paso3!.sinAtrezo!,
          atrezoAzar: rawValues.paso3!.atrezoAzar!,
          atrezoCofre: rawValues.paso3!.atrezoCofre!,
          tiposAtrezoFijos: atrezoFijoString,
          tiposAtrezoExcluido: atrezoExcluidoString,
          tiposSalasEsp: salasEspecialesString,
          idsSalasEspeciales: rawValues.paso4!.idsSalasEspeciales || [],
          salasEspecialesAzar: rawValues.paso4!.salasEspecialesAzar || 0
        }
      };

      //console.log('Guardando Misión en LocalStorage con Salas Especiales...', misionEstructurada);
      //localStorage.setItem('FQ_CUSTOM_MISSION', JSON.stringify(misionEstructurada));

      this.persistenceService.clearSave();
      this.uiService.cambiaVista('VIEW_HEROES');
      this.uiService.setModoVisualizacion(modoJuego as ModoJuego);
      this.misionService.misionActual.set(misionEstructurada);
      this.misionService.inicializarPartida(misionEstructurada);
      this.misionService.configurarMision(misionEstructurada);

      this.router.navigate(['/juego']);
    }
  }
}
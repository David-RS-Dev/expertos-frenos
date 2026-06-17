/* ==========================================================================
   1. ESTADO GLOBAL DE LA APLICACIÓN
   ========================================================================== */
let datosCatalogo = null;
let datosTarifas = null;

// Objeto para almacenar las elecciones del cliente a lo largo del flujo
const cotizacionCliente = {
    marca: "",
    modelo: "",
    tipoVehiculo: "", // "Auto pequeno", "Sedan mediano", etc.
    servicio: ""      // "calidad_pastillas", "servicio_integral", "mano_de_obra"
};

/* ==========================================================================
   2. INICIALIZACIÓN Y CARGA DE DATOS (JSON SEPARADOS)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Carga paralela de ambos archivos JSON usando promesas para mayor velocidad en Vercel
    Promise.all([
        fetch('data/catalogo.json').then(res => {
            if (!res.ok) throw new Error('No se pudo cargar catalogo.json');
            return res.json();
        }),
        fetch('data/tarifas.json').then(res => {
            if (!res.ok) throw new Error('No se pudo cargar tarifas.json');
            return res.json();
        })
    ])
    .then(([catalogo, tarifas]) => {
        datosCatalogo = catalogo;
        datosTarifas = tarifas;
        console.log("🚀 Base de datos y matriz de tarifas cargadas con éxito.");
        inicializarBuscadorPredictivo();
    })
    .catch(error => {
        console.error("❌ Error crítico en la inicialización de datos:", error);
        alert("Hubo un inconveniente al cargar el catálogo técnico. Por favor, refresca la página.");
    });
});

/* ==========================================================================
   3. ALGORITMO DE BÚSQUEDA PREDICTIVA BILATERAL (Escribir y Borrar)
   ========================================================================== */
function inicializarBuscadorPredictivo() {
    const searchInput = document.getElementById("search-input");
    const resultsList = document.getElementById("predictive-results");
    const clearBtn = document.getElementById("clear-search-btn");

    searchInput.addEventListener("input", (e) => {
        const textoBusqueda = e.target.value.toLowerCase().trim();

        // Si el usuario borra todo el texto, reseteamos el estado visual
        if (textoBusqueda === "") {
            resultsList.innerHTML = "";
            resultsList.classList.add("hidden");
            clearBtn.classList.add("hidden");
            document.getElementById("contingency-block").classList.add("hidden");
            return;
        }

        clearBtn.classList.remove("hidden");
        resultsList.innerHTML = ""; // Limpiamos coincidencias previas de la pantalla

        let coincidenciasEncontradas = 0;

        // Recorremos las marcas del JSON
        for (const marca in datosCatalogo) {
            const marcaMinuscula = marca.toLowerCase();
            
            // Evaluamos todos los modelos dentro de esta marca
            for (const modelo in datosCatalogo[marca]) {
                const modeloMinuscula = modelo.toLowerCase();
                const cadenaCombinada = `${marcaMinuscula} ${modeloMinuscula}`;

                // El algoritmo evalúa si lo escrito coincide con la marca, el modelo o la combinación de ambos
                if (marcaMinuscula.includes(textoBusqueda) || 
                    modeloMinuscula.includes(textoBusqueda) || 
                    cadenaCombinada.includes(textoBusqueda)) {
                    
                    coincidenciasEncontradas++;
                    
                    // Creamos el elemento interactivo en la lista desplegable
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <strong>${marca} ${modelo}</strong>
                        <span class="badge-tipo">${traducirCategoriaUI(datosCatalogo[marca][modelo].tipo)}</span>
                    `;
                    
                    // Al hacer clic, se selecciona el auto de forma automática
                    li.addEventListener("click", () => {
                        seleccionarVehiculoOficial(marca, modelo, datosCatalogo[marca][modelo].tipo);
                    });

                    resultsList.appendChild(li);
                }
            }
        }

        // Si hay resultados, quitamos el 'hidden'. Si está vacío (no existe el auto), activamos contingencia visual
        if (coincidenciasEncontradas > 0) {
            resultsList.classList.remove("hidden");
            document.getElementById("contingency-block").classList.add("hidden");
        } else {
            resultsList.classList.add("hidden");
            activarContingencia(); // Abre automáticamente las siluetas si el cliente digita algo inexistente
        }
    });

    // Botón de limpieza rápida (X) en el buscador
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchInput.focus();
        resultsList.innerHTML = "";
        resultsList.classList.add("hidden");
        clearBtn.classList.add("hidden");
        document.getElementById("contingency-block").classList.add("hidden");
    });
}

// Función auxiliar para mostrar un texto más amigable en los Badges del buscador móvil
function traducirCategoriaUI(tipoClave) {
    const traducciones = {
        "Auto pequeno": "Auto Pequeño",
        "Sedan mediano": "Sedán",
        "SUV/ Camioneta mediana": "SUV Mediana",
        "SUV grande/ Pickup": "Camioneta/Pickup",
        "Vehiculo premium": "Premium"
    };
    return traducciones[tipoClave] || tipoClave;
}

/* ==========================================================================
   4. CONTROL DE SELECCIÓN Y FLUJO DE CONTINGENCIA
   ========================================================================== */
function seleccionarVehiculoOficial(marca, modelo, tipoClave) {
    cotizacionCliente.marca = marca;
    cotizacionCliente.modelo = modelo;
    cotizacionCliente.tipoVehiculo = tipoClave;

    // Actualizamos la barra de estado superior interactiva
    document.getElementById("summary-vehiculo").textContent = `${marca} ${modelo}`;
    
    // Ocultamos la lista desplegable y avanzamos al paso de Servicios
    document.getElementById("predictive-results").classList.add("hidden");
    irAPaso(2);
}

function activarContingencia() {
    const contingencyBlock = document.getElementById("contingency-block");
    contingencyBlock.classList.remove("hidden");
    // Desplazamos suavemente la pantalla del celular hacia las siluetas
    contingencyBlock.scrollIntoView({ behavior: 'smooth' });
}

function seleccionarPorSilueta(tipoClave) {
    // Quitamos la selección previa visual de todas las tarjetas de siluetas
    document.querySelectorAll(".silhouette-card").forEach(card => card.classList.remove("selected"));
    
    // Resaltamos visualmente la silueta pulsada
    const botonPresionado = event.currentTarget;
    botonPresionado.classList.add("selected");

    cotizacionCliente.tipoVehiculo = tipoClave;
}

function confirmarVehiculoManual() {
    const customName = document.getElementById("custom-car-name").value.trim();
    
    if (!cotizacionCliente.tipoVehiculo) {
        alert("Por favor, selecciona una de las siluetas visuales para calcular tu tarifa.");
        return;
    }

    // Si el cliente no escribió nada, asignamos un nombre genérico por la carrocería elegida
    if (customName === "") {
        cotizacionCliente.marca = "Auto";
        cotizacionCliente.modelo = traducirCategoriaUI(cotizacionCliente.tipoVehiculo);
    } else {
        cotizacionCliente.marca = customName;
        cotizacionCliente.modelo = "";
    }

    document.getElementById("summary-vehiculo").textContent = cotizacionCliente.marca;
    irAPaso(2);
}

/* ==========================================================================
   5. SELECCIÓN DE SERVICIO Y LÓGICA DE TARIFAS (PASO 2 Y 3)
   ========================================================================== */
function seleccionarServicio(servicioClave) {
    cotizacionCliente.servicio = servicioClave;
    
    // Actualizamos el resumen en la barra superior interactiva
    const etiquetasServicio = {
        "calidad_pastillas": "Pastillas Nuevas",
        "servicio_integral": "S. Integral",
        "mano_de_obra": "Mano de Obra"
    };
    document.getElementById("summary-servicio").textContent = etiquetasServicio[servicioClave];

    // Procesamos matemáticamente los precios antes de mostrar la pantalla final
    calcularYDesplegarPrecios();
    irAPaso(3);
}

function calcularYDesplegarPrecios() {
    const tipo = cotizacionCliente.tipoVehiculo;
    const servicio = cotizacionCliente.servicio;

    const tierContainer = document.getElementById("tier-pricing-container");
    const dualContainer = document.getElementById("dual-pricing-container");
    const subtitulo = document.getElementById("prices-subtitle");

    subtitulo.textContent = `Precios calculados para tu ${cotizacionCliente.marca} ${cotizacionCliente.modelo}`;

    // CASO A: SERVICIO DE MANO DE OBRA (Estructura de Tarjetas Duales)
    if (servicio === "mano_de_obra") {
        tierContainer.classList.add("hidden");
        dualContainer.classList.remove("hidden");

        const costosManoObra = datosTarifas[tipo]["mano_de_obra"];
        document.getElementById("price-dual-pastillas").textContent = costosManoObra.solo_pastillas;
        document.getElementById("price-dual-discos").textContent = costosManoObra.cambio_discos;
    } 
    // CASO B: PASTILLAS O SERVICIO INTEGRAL (Estructura Terna Good-Better-Best)
    else {
        dualContainer.classList.add("hidden");
        tierContainer.classList.remove("hidden");

        const bloqueTarifas = datosTarifas[tipo][servicio];
        const tarjetaUrbana = document.getElementById("tier-URBANO");
        const msgRestriccion = document.getElementById("restriction-urbano-msg");

        // EVALUACIÓN DE LA RESTRICCIÓN PREMIUM (Valores en null en tarifas.json)
        if (bloqueTarifas.URBANO === null) {
            tarjetaUrbana.classList.add("restricted");
            msgRestriccion.classList.remove("hidden");
        } else {
            tarjetaUrbana.classList.remove("restricted");
            msgRestriccion.classList.add("hidden");
            document.getElementById("price-urbano-val").textContent = bloqueTarifas.URBANO;
        }

        // Inyección directa de las opciones Estándar y Premium
        document.getElementById("price-estandar-val").textContent = bloqueTarifas.ESTANDAR;
        document.getElementById("price-premium-val").textContent = bloqueTarifas.PREMIUM;
    }
}

/* ==========================================================================
   6. NAVEGACIÓN ENTRE PASOS (WIZARD CONTROL OPTIMIZADO)
   ========================================================================== */
function irAPaso(numeroPaso, esNavegacionHistorial = false) {
    // Si intenta ir a pasos avanzados sin datos, detenemos la ejecución
    if (numeroPaso === 2 && !cotizacionCliente.tipoVehiculo) return;
    if (numeroPaso === 3 && !cotizacionCliente.servicio) return;

    // Control de visibilidad de las secciones mediante clases CSS
    document.querySelectorAll(".wizard-step").forEach((step, index) => {
        if (index === (numeroPaso - 1)) {
            step.classList.add("active");
        } else {
            step.classList.remove("active");
        }
    });

    // Control de iluminación y estados activos de la barra de progreso interactiva
    document.querySelectorAll(".step-indicator").forEach((indicator, index) => {
        if (index <= (numeroPaso - 1)) {
            indicator.classList.add("active");
        } else {
            indicator.classList.remove("active");
        }
    });

    // Si el usuario regresa al Paso 1 por la barra superior, limpiamos textos para evitar inconsistencias
    if (numeroPaso === 1) {
        document.getElementById("summary-vehiculo").textContent = "Vehículo";
        document.getElementById("summary-servicio").textContent = "Servicio";
        cotizacionCliente.servicio = "";
    }

    // === NUEVO: Sincronizar la pila del historial con los clics normales del Wizard ===
    if (!esNavegacionHistorial) {
        history.pushState({ step: numeroPaso }, "", "");
    }
}

/* ==========================================================================
   7. INTERACCIONES DE COMPONENTES DE ASISTENCIA (MODALES)
   ========================================================================== */
function mostrarModalMatricula() {
    document.getElementById("matricula-modal").classList.remove("hidden");
    // ESCUDO: Añadimos un estado específico para que 'Atrás' solo cierre el modal
    history.pushState({ modalAbierto: true }, "", "");
}

function cerrarModalMatricula() {
    document.getElementById("matricula-modal").classList.add("hidden");
    // Si el usuario cerró el modal manualmente, limpiamos el estado del historial
    if (history.state && history.state.modalAbierto) {
        history.back();
    }
}

/* ==========================================================================
   8. CIERRE DE LA OPERACIÓN COMERCIAL
   ========================================================================== */
function finalizarCotizacion(nivelElegido) {
    alert(`¡Excelente elección! Has seleccionado la alternativa: ${nivelElegido}.\n\nPresenta esta pantalla en la recepción del taller para validar tu cotización.`);
}

/* ==========================================================================
   9. INTERACTIVIDAD DE LA GUÍA DE MATRÍCULA (ZOOM OPTIMIZADO)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const imagenMatricula = document.getElementById('img-guia-matricula');

    if (imagenMatricula) {
        imagenMatricula.addEventListener('click', function() {
            this.classList.toggle('zoomed');
        });
    }
});

/* ==========================================================================
   10. CONTROL DEL BOTÓN "ATRÁS" NATIVO + DOBLE PRESIÓN PARA SALIR
   ========================================================================== */
let esperandoSegundoRetroceso = false;
let timerRetroceso = null;
let saliendoDeApp = false; // Bandera anti-bucle

window.addEventListener('popstate', (event) => {
    // Anti-bucle: ignoramos popstates mientras estamos en proceso de salida
    if (saliendoDeApp) return;
    
    const state = event.state;
    const modal = document.getElementById("matricula-modal");
    
    // PRIORIDAD 1: Si el modal está abierto, el botón Atrás debe cerrarlo
    if (modal && !modal.classList.contains("hidden")) {
        modal.classList.add("hidden");
        // Restauramos el estado del paso actual
        history.pushState({ step: 1 }, "", "");
        return; 
    }

    // PRIORIDAD 2: Si estamos esperando el segundo retroceso, FORZAMOS LA SALIDA
    // Esta es la corrección clave: ignoramos el estado que recibimos y salimos
    if (esperandoSegundoRetroceso) {
        clearTimeout(timerRetroceso);
        esperandoSegundoRetroceso = false;
        saliendoDeApp = true;
        
        // Forzamos al navegador a continuar hacia atrás (cerrará la pestaña o irá a Instagram/WhatsApp)
        window.history.back();
        
        // Reset de la bandera después de 100ms para evitar bucles
        setTimeout(() => { saliendoDeApp = false; }, 100);
        return;
    }

    // PRIORIDAD 3: Navegación normal entre pasos del Wizard
    if (state && state.step) {
        irAPaso(state.step, true);
    } 
    // PRIORIDAD 4: El estado es null (el usuario está en el Paso 1 e intenta salir)
    else {
        const pasoActualVisual = document.querySelector(".wizard-step.active");
        
        if (pasoActualVisual && pasoActualVisual.id === "step-1") {
            // 🟡 PRIMER INTENTO DE SALIDA
            esperandoSegundoRetroceso = true;
            mostrarToast("Presiona atrás de nuevo para salir");
            
            // Empujamos un estado para mantener al usuario en la app visualmente
            history.pushState({ step: 1, guard: true }, "", "");
            
            // Si no presiona atrás en 2 segundos, reseteamos la bandera
            timerRetroceso = setTimeout(() => {
                esperandoSegundoRetroceso = false;
            }, 2000);
        }
    }
});

// Inicializar la aplicación con un colchón en el historial
document.addEventListener("DOMContentLoaded", () => {
    if (!history.state) {
        window.history.replaceState({ step: 1 }, "", "");
    }
});

// Función auxiliar para mostrar el Toast
function mostrarToast(mensaje) {
    const toast = document.getElementById("toast-exit");
    if(toast) {
        toast.querySelector("span").textContent = mensaje;
        toast.classList.remove("hidden");
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 2000);
    }
}
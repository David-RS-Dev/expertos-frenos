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
        "calidad_pastillas": "Solo Pastillas",
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
   6. NAVEGACIÓN ENTRE PASOS (WIZARD CONTROL)
   ========================================================================== */
function irAPaso(numeroPaso) {
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
}

/* ==========================================================================
   7. INTERACCIONES DE COMPONENTES DE ASISTENCIA (MODALES)
   ========================================================================== */
function mostrarModalMatricula() {
    document.getElementById("matricula-modal").classList.remove("hidden");
}

function cerrarModalMatricula() {
    document.getElementById("matricula-modal").classList.add("hidden");
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
            // Alterna la clase 'zoomed' de forma nativa.
            // El archivo CSS se encarga de aplicar las dimensiones y habilitar las barras de scroll.
            this.classList.toggle('zoomed');
        });
    }
});

/* ==========================================================================
10. CONTROL DEL BOTÓN "ATRÁS" NATIVO + DOBLE PRESIÓN PARA SALIR
========================================================================== */
let esperandoSegundoRetroceso = false;
let timerRetroceso = null;

// 1. El "Cerebro" que escucha el botón Atrás físico del celular o el gesto de retroceso
window.addEventListener('popstate', (event) => {
    const state = event.state;
    const modal = document.getElementById("matricula-modal");
    
    // PRIORIDAD 1: Si el modal está abierto visualmente, el botón Atrás debe cerrarlo
    if (modal && !modal.classList.contains("hidden")) {
        // Usamos tu función nativa para mantener limpia la lógica
        cerrarModalMatricula(); 
        
        // Restauramos el estado del paso actual para que el navegador no intente salirse
        const pasoActual = (state && state.step) ? state.step : 1;
        history.pushState({ step: pasoActual }, "", "");
        return; 
    }

    // PRIORIDAD 2: Navegación normal entre pasos del Wizard (Si hay un estado de paso guardado)
    if (state && state.step) {
        cambiarPasoUI(state.step);
    } 
    // PRIORIDAD 3: El estado es "null". Significa que el historial de la app se vació.
    // Esto solo ocurre si el usuario está en el Paso 1 y presionó Atrás para intentar salir.
    else {
        const pasoActualVisual = document.querySelector(".wizard-step.active");
        
        // Doble validación por seguridad
        if (pasoActualVisual && pasoActualVisual.id === "step-1") {
            
            if (!esperandoSegundoRetroceso) {
                // 🟡 PRIMER INTENTO DE SALIDA: Mostramos aviso y "frenamos" al navegador
                esperandoSegundoRetroceso = true;
                mostrarToast("Presiona atrás de nuevo para salir");
                
                // Empujamos un estado "falso" para que la pila del historial no se vacíe aún
                history.pushState({ step: 1, guard: true }, "", "");
                
                // Si no presiona atrás en 2 segundos, reseteamos la bandera
                timerRetroceso = setTimeout(() => {
                    esperandoSegundoRetroceso = false;
                }, 2000);
                
            } else {
                // 🟢 SEGUNDO INTENTO DE SALIDA (Dentro de los 2 segundos)
                clearTimeout(timerRetroceso);
                esperandoSegundoRetroceso = false;
                
                // No hacemos pushState. La pila del historial se vacía definitivamente
                // y el navegador procederá a cerrar la pestaña o volver a la app anterior (Instagram, WhatsApp, etc.)
            }
        }
    }
});

// 2. Inicializar el estado al cargar la aplicación por primera vez
document.addEventListener("DOMContentLoaded", () => {
    window.history.replaceState({ step: 1 }, "", "");
});

// 3. Función auxiliar para mostrar el Toast (Mensaje flotante)
function mostrarToast(mensaje) {
    const toast = document.getElementById("toast-exit");
    if(toast) {
        toast.querySelector("span").textContent = mensaje;
        toast.classList.remove("hidden");
        
        // Aseguramos que se oculte automáticamente después de 2 segundos
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 2000);
    }
}
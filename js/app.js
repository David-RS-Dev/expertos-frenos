/* ==========================================================================
1. ESTADO GLOBAL DE LA APLICACIÓN
========================================================================== */
let datosCatalogo = null;
let datosTarifas = null;

const cotizacionCliente = {
    marca: "",
    modelo: "",
    tipoVehiculo: "",
    servicio: ""
};

/* ==========================================================================
2. INICIALIZACIÓN Y CARGA DE DATOS (JSON SEPARADOS)
========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
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
        inicializarBotonWhatsApp(); // 🟢 NUEVO: Configuramos el botón dinámico
    })
    .catch(error => {
        console.error("❌ Error crítico en la inicialización de datos:", error);
        alert("Hubo un inconveniente al cargar el catálogo técnico. Por favor, refresca la página.");
    });
});

/* ==========================================================================
3. ALGORITMO DE BÚSQUEDA PREDICTIVA BILATERAL
========================================================================== */
function inicializarBuscadorPredictivo() {
    const searchInput = document.getElementById("search-input");
    const resultsList = document.getElementById("predictive-results");
    const clearBtn = document.getElementById("clear-search-btn");

    searchInput.addEventListener("input", (e) => {
        const textoBusqueda = e.target.value.toLowerCase().trim();

        if (textoBusqueda === "") {
            resultsList.innerHTML = "";
            resultsList.classList.add("hidden");
            clearBtn.classList.add("hidden");
            document.getElementById("contingency-block").classList.add("hidden");
            return;
        }

        clearBtn.classList.remove("hidden");
        resultsList.innerHTML = "";

        let coincidenciasEncontradas = 0;

        for (const marca in datosCatalogo) {
            const marcaMinuscula = marca.toLowerCase();
            for (const modelo in datosCatalogo[marca]) {
                const modeloMinuscula = modelo.toLowerCase();
                const cadenaCombinada = `${marcaMinuscula} ${modeloMinuscula}`;

                if (marcaMinuscula.includes(textoBusqueda) ||
                    modeloMinuscula.includes(textoBusqueda) ||
                    cadenaCombinada.includes(textoBusqueda)) {
                    coincidenciasEncontradas++;

                    const li = document.createElement("li");
                    li.innerHTML = `
                        <strong>${marca} ${modelo}</strong>
                        <span class="badge-tipo">${traducirCategoriaUI(datosCatalogo[marca][modelo].tipo)}</span>
                    `;

                    li.addEventListener("click", () => {
                        seleccionarVehiculoOficial(marca, modelo, datosCatalogo[marca][modelo].tipo);
                    });
                    resultsList.appendChild(li);
                }
            }
        }

        if (coincidenciasEncontradas > 0) {
            resultsList.classList.remove("hidden");
            document.getElementById("contingency-block").classList.add("hidden");
        } else {
            resultsList.classList.add("hidden");
            activarContingencia();
        }
    });

    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchInput.focus();
        resultsList.innerHTML = "";
        resultsList.classList.add("hidden");
        clearBtn.classList.add("hidden");
        document.getElementById("contingency-block").classList.add("hidden");
    });
}

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

    document.getElementById("summary-vehiculo").textContent = `${marca} ${modelo}`;
    document.getElementById("predictive-results").classList.add("hidden");
    irAPaso(2);
    actualizarBarraEstado();
}

function activarContingencia() {
    const contingencyBlock = document.getElementById("contingency-block");
    contingencyBlock.classList.remove("hidden");
    contingencyBlock.scrollIntoView({ behavior: 'smooth' });
}

function seleccionarPorSilueta(tipoClave) {
    document.querySelectorAll(".silhouette-card").forEach(card => card.classList.remove("selected"));
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

    if (customName === "") {
        cotizacionCliente.marca = "Auto";
        cotizacionCliente.modelo = traducirCategoriaUI(cotizacionCliente.tipoVehiculo);
    } else {
        cotizacionCliente.marca = customName;
        cotizacionCliente.modelo = "";
    }

    document.getElementById("summary-vehiculo").textContent = cotizacionCliente.marca;
    actualizarBarraEstado();
    irAPaso(2);
}

/* ==========================================================================
5. SELECCIÓN DE SERVICIO Y LÓGICA DE TARIFAS
========================================================================== */
function seleccionarServicio(servicioClave) {
    cotizacionCliente.servicio = servicioClave;

    const etiquetasServicio = {
        "calidad_pastillas": "Pastillas Nuevas",
        "servicio_integral": "S. Integral",
        "mano_de_obra": "Mano de Obra"
    };
    document.getElementById("summary-servicio").textContent = etiquetasServicio[servicioClave];

    calcularYDesplegarPrecios();
    actualizarBarraEstado();
    irAPaso(3);
}

function calcularYDesplegarPrecios() {
    const tipo = cotizacionCliente.tipoVehiculo;
    const servicio = cotizacionCliente.servicio;
    const tierContainer = document.getElementById("tier-pricing-container");
    const dualContainer = document.getElementById("dual-pricing-container");

    const contextTitle = document.getElementById("context-service-title");
    const contextDesc = document.getElementById("context-service-desc");

    const nombreVehiculo = cotizacionCliente.modelo ?
        `${cotizacionCliente.marca} ${cotizacionCliente.modelo}` :
        cotizacionCliente.marca;
    document.getElementById("prices-subtitle").textContent = `Precios para ${nombreVehiculo}`;

    const serviciosInfo = {
        "calidad_pastillas": {
            titulo: "Pastillas Nuevas",
            freeInstall: "Incluye Instalación GRATIS",
            descripcion: "Instalación de pastillas de freno nuevas en el eje delantero o posterior."
        },
        "servicio_integral": {
            titulo: "Servicio Integral",
            freeInstall: "Incluye Instalación GRATIS",
            descripcion: "Pastillas nuevas + Rectificación técnica del par de discos delanteros para evitar vibraciones."
        },
        "mano_de_obra": {
            titulo: "Solo Mano de Obra",
            freeInstall: "",
            descripcion: "Si ya compraste tus propias pastillas o discos y buscas únicamente instalación calificada."
        }
    };

    const servicioActual = serviciosInfo[servicio];
    if (servicioActual) {
        contextTitle.textContent = servicioActual.titulo;
        contextDesc.textContent = servicioActual.descripcion;

        const freeInstallEl = document.querySelector(".context-free-install");
        if (servicioActual.freeInstall) {
            freeInstallEl.textContent = servicioActual.freeInstall;
            freeInstallEl.style.display = "block";
        } else {
            freeInstallEl.style.display = "none";
        }
    }

    if (servicio === "mano_de_obra") {
        tierContainer.classList.add("hidden");
        dualContainer.classList.remove("hidden");
        const costosManoObra = datosTarifas[tipo]["mano_de_obra"];
        document.getElementById("price-dual-pastillas").textContent = costosManoObra.solo_pastillas;
        document.getElementById("price-dual-discos").textContent = costosManoObra.cambio_discos;
    } else {
        dualContainer.classList.add("hidden");
        tierContainer.classList.remove("hidden");
        const bloqueTarifas = datosTarifas[tipo][servicio];
        const tarjetaUrbana = document.getElementById("tier-URBANO");
        const msgRestriccion = document.getElementById("restriction-urbano-msg");

        if (bloqueTarifas.URBANO === null) {
            tarjetaUrbana.classList.add("restricted");
            msgRestriccion.classList.remove("hidden");
        } else {
            tarjetaUrbana.classList.remove("restricted");
            msgRestriccion.classList.add("hidden");
            document.getElementById("price-urbano-val").textContent = bloqueTarifas.URBANO;
        }

        document.getElementById("price-estandar-val").textContent = bloqueTarifas.ESTANDAR;
        document.getElementById("price-premium-val").textContent = bloqueTarifas.PREMIUM;
    }
}

/* ==========================================================================
6. NAVEGACIÓN ENTRE PASOS (WIZARD CONTROL)
========================================================================== */
function irAPaso(numeroPaso, esNavegacionHistorial = false) {
    if (numeroPaso === 2 && !cotizacionCliente.tipoVehiculo) return;
    if (numeroPaso === 3 && !cotizacionCliente.servicio) return;

    document.querySelectorAll(".wizard-step").forEach((step, index) => {
        if (index === (numeroPaso - 1)) step.classList.add("active");
        else step.classList.remove("active");
    });

    document.querySelectorAll(".step-indicator").forEach((indicator, index) => {
        if (index <= (numeroPaso - 1)) indicator.classList.add("active");
        else indicator.classList.remove("active");
    });

    if (numeroPaso === 1) {
        document.getElementById("summary-vehiculo").textContent = "Vehículo";
        document.getElementById("summary-servicio").textContent = "Servicio";
        cotizacionCliente.servicio = "";
    }

    if (!esNavegacionHistorial) {
        history.pushState({ step: numeroPaso }, "", "");
    }
}

/* ==========================================================================
7. INTERACCIONES DE COMPONENTES DE ASISTENCIA (MODALES)
========================================================================== */
function mostrarModalMatricula() {
    document.getElementById("matricula-modal").classList.remove("hidden");
    history.pushState({ modalAbierto: true }, "", "");
}

function cerrarModalMatricula() {
    document.getElementById("matricula-modal").classList.add("hidden");
    if (history.state && history.state.modalAbierto) {
        history.back();
    }
}

/* ==========================================================================
8. CIERRE DE LA OPERACIÓN COMERCIAL
========================================================================== */
function finalizarCotizacion(nivelElegido) {
    alert(`¡Excelente elección! Has seleccionado la alternativa: ${nivelElegido}.\nPresenta esta pantalla en la recepción del taller para validar tu cotización.`);
}

/* ==========================================================================
9. INTERACTIVIDAD DE LA GUÍA DE MATRÍCULA (ZOOM)
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
let saliendoDeApp = false;

window.addEventListener('popstate', (event) => {
    if (saliendoDeApp) return;

    const state = event.state;
    const modal = document.getElementById("matricula-modal");

    if (modal && !modal.classList.contains("hidden")) {
        modal.classList.add("hidden");
        history.pushState({ step: 1 }, "", "");
        return;
    }

    if (esperandoSegundoRetroceso) {
        clearTimeout(timerRetroceso);
        esperandoSegundoRetroceso = false;
        saliendoDeApp = true;
        window.history.back();
        setTimeout(() => { saliendoDeApp = false; }, 100);
        return;
    }

    if (state && state.step) {
        irAPaso(state.step, true);
    } else {
        const pasoActualVisual = document.querySelector(".wizard-step.active");
        if (pasoActualVisual && pasoActualVisual.id === "step-1") {
            esperandoSegundoRetroceso = true;
            mostrarToast("Presiona atrás de nuevo para salir");
            history.pushState({ step: 1, guard: true }, "", "");
            timerRetroceso = setTimeout(() => {
                esperandoSegundoRetroceso = false;
            }, 2000);
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    if (!history.state) {
        window.history.replaceState({ step: 1 }, "", "");
    }
});

function mostrarToast(mensaje) {
    const toast = document.getElementById("toast-exit");
    if(toast) {
        toast.querySelector("span").textContent = mensaje;
        toast.classList.remove("hidden");
        setTimeout(() => { toast.classList.add("hidden"); }, 2000);
    }
}

/* ==========================================================================
11. ACTUALIZACIÓN Y NAVEGACIÓN DE LA BARRA DE ESTADO
========================================================================== */
function actualizarBarraEstado() {
    const barra = document.getElementById('barra-estado-wizard');
    const txtVehiculo = document.getElementById('txt-resumen-vehiculo');
    const txtServicio = document.getElementById('txt-resumen-servicio');
    const btnServicio = document.getElementById('btn-regresar-servicio');

    if (cotizacionCliente.tipoVehiculo) {
        const nombreVehiculo = cotizacionCliente.modelo ?
            `${cotizacionCliente.marca} ${cotizacionCliente.modelo}` :
            cotizacionCliente.marca;
        txtVehiculo.textContent = nombreVehiculo;
        barra.classList.remove('hidden');
    } else {
        barra.classList.add('hidden');
        return;
    }

    if (cotizacionCliente.servicio) {
        const nombresComerciales = {
            'calidad_pastillas': 'Pastillas Nuevas',
            'servicio_integral': 'Servicio Integral',
            'mano_de_obra': 'Solo Mano de Obra'
        };
        txtServicio.textContent = nombresComerciales[cotizacionCliente.servicio] || cotizacionCliente.servicio;
        btnServicio.style.opacity = "1";
    } else {
        txtServicio.textContent = 'Eligiendo...';
        btnServicio.style.opacity = "0.5";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btnVehiculo = document.getElementById('btn-regresar-vehiculo');
    const btnServicio = document.getElementById('btn-regresar-servicio');
    if(btnVehiculo) {
        btnVehiculo.addEventListener('click', () => irAPaso(1));
    }
    if(btnServicio) {
        btnServicio.addEventListener('click', () => {
            if(cotizacionCliente.tipoVehiculo) irAPaso(2);
        });
    }
});

/* ==========================================================================
12. 🟢 BOTÓN FLOTANTE DE WHATSAPP - CONFIGURACIÓN DINÁMICA
========================================================================== */
function inicializarBotonWhatsApp() {
    const btnWhatsApp = document.getElementById("whatsapp-float-btn");
    if (!btnWhatsApp) return;

    // ⚠️ PERSONALIZA AQUÍ TU NÚMERO (formato internacional sin + ni espacios)
    // Ejemplo Ecuador: 5939XXXXXXXX (593 = país, 9 = celular)
    const NUMERO_WHATSAPP = "5939XXXXXXXX";

    // Construimos el mensaje predefinido dinámicamente según el estado del cliente
    const mensajeBase = "¡Hola! 👋 Estoy en la Web App de *Expertos en Frenos* y me gustaría recibir asesoría.";

    btnWhatsApp.addEventListener("click", (e) => {
        e.preventDefault();

        // Si el cliente ya completó la cotización, enriquecemos el mensaje con sus datos
        let mensajeFinal = mensajeBase;

        if (cotizacionCliente.tipoVehiculo) {
            const nombreVehiculo = cotizacionCliente.modelo ?
                `${cotizacionCliente.marca} ${cotizacionCliente.modelo}` :
                cotizacionCliente.marca;

            mensajeFinal += `\n\n🚗 *Mi vehículo:* ${nombreVehiculo}`;
        }

        if (cotizacionCliente.servicio) {
            const nombresServicio = {
                'calidad_pastillas': 'Pastillas Nuevas',
                'servicio_integral': 'Servicio Integral',
                'mano_de_obra': 'Solo Mano de Obra'
            };
            mensajeFinal += `\n🔧 *Servicio de interés:* ${nombresServicio[cotizacionCliente.servicio]}`;
        }

        mensajeFinal += "\n\n¿Me pueden confirmar disponibilidad y agendar una cita?";

        // Codificamos el mensaje para la URL
        const urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensajeFinal)}`;

        // Abrimos WhatsApp (en móvil abrirá la app nativa; en desktop, WhatsApp Web)
        window.open(urlWhatsApp, '_blank');
    });
}
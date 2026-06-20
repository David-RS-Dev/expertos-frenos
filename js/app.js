// ARCHIVO: js/app.js
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
        inicializarBotonWhatsApp(); 
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
    actualizarEnlaceWhatsApp();
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
    actualizarEnlaceWhatsApp();
}

/* ==========================================================================
5. SELECCIÓN DE SERVICIO Y LÓGICA DE TARIFAS
========================================================================== */
function seleccionarServicio(servicioClave) {
    cotizacionCliente.servicio = servicioClave;
    
    const etiquetasServicio = {
        "calidad_pastillas": "Pastillas Nuevas",
        "servicio_integral": "S. Integral",
        "mano_de_obra": "Mano de Obra",
        "rectificacion": "Rectificación"
    };
    
    document.getElementById("summary-servicio").textContent = etiquetasServicio[servicioClave];
    calcularYDesplegarPrecios();
    actualizarBarraEstado();
    irAPaso(3);
    actualizarEnlaceWhatsApp();
}

function calcularYDesplegarPrecios() {
    const tipo = cotizacionCliente.tipoVehiculo;
    const servicio = cotizacionCliente.servicio;
    const tierContainer = document.getElementById("tier-pricing-container");
    const dualContainer = document.getElementById("dual-pricing-container");
    const singleContainer = document.getElementById("single-pricing-container");
    const contextTitle = document.getElementById("context-service-title");
    const contextDesc = document.getElementById("context-service-desc");
    const contextCard = document.getElementById("service-context-card");

    if (servicio === "calidad_pastillas" || servicio === "servicio_integral") {
        contextCard.classList.add("hidden");
    } else {
        contextCard.classList.remove("hidden");
    }
    
    const textosTarjetas = {
        "calidad_pastillas": {
            estandar: {
                titulo: "Pastillas Nuevas ⇀ Calidad Estándar",
                descripcion: "Cumple especificaciones originales de fábrica. Gran durabilidad."
            },
            premium: {
                titulo: "Pastillas Nuevas ⇀ Calidad Premium",
                descripcion: "Máximo rendimiento, compuesto aleación libre de ruidos y frenado de emergencia superior."
            },
            exclusiva: {
                titulo: "Pastillas Nuevas ⇀ Oferta Exclusiva Web",
                descripcion: "Precio especial y único para clientes que agendan desde nuestra App."
            }
        },
        "servicio_integral": {
            estandar: {
                titulo: "Pastillas Nuevas + Rectificación",
                descripcion: "Incluye pastillas de calidad original y rectificación técnica de discos para eliminar vibraciones."
            },
            premium: {
                titulo: "Pastillas Premium + Rectificación",
                descripcion: "Pastillas de alta gama con rectificación técnica de discos. Máxima durabilidad."
            },
            exclusiva: {
                titulo: "Pack Web: Integral Completo",
                descripcion: "Oferta especial: Pastillas Nuevas + rectificación técnica de discos."
            }
        },
        "mano_de_obra": {
            estandar: {
                titulo: "Instalación Básica",
                descripcion: "Mano de obra especializada para instalación de pastillas en un eje (delantero o posterior)."
            },
            premium: {
                titulo: "Instalación Completa",
                descripcion: "Cambio de discos y pastillas en ambos ejes con revisión completa del sistema de frenos."
            },
            exclusiva: {
                titulo: "No disponible",
                descripcion: "Este servicio no aplica para mano de obra únicamente."
            }
        }
    };

// Mapeo de iconos por servicio
const iconosServicio = {
    "calidad_pastillas": "no_crash",
    "servicio_integral": "car_repair",
    "mano_de_obra": "engineering",
    "rectificacion": "car_gear"
};

const iconoActual = iconosServicio[servicio] || "no_crash";

// Aplicar textos e iconos según el servicio seleccionado
if (servicio && textosTarjetas[servicio]) {
        const textos = textosTarjetas[servicio];
        
        // Actualizar icono de las 3 tarjetas
        document.querySelectorAll(".tier-icon").forEach(icon => {
            icon.textContent = iconoActual;
        });
        
        // Actualizar tarjeta Estándar
        document.querySelector("#tier-ESTANDAR .tier-title-text").textContent = textos.estandar.titulo;
        document.querySelector("#tier-ESTANDAR .tier-desc").textContent = textos.estandar.descripcion;
        
        // Actualizar tarjeta Premium
        document.querySelector("#tier-PREMIUM .tier-title-text").textContent = textos.premium.titulo;
        document.querySelector("#tier-PREMIUM .tier-desc").textContent = textos.premium.descripcion;
        
        // Actualizar tarjeta Oferta Exclusiva
        if (textos.exclusiva) {
            document.querySelector("#tier-EXCLUSIVA .tier-title-text").textContent = textos.exclusiva.titulo;
            document.querySelector("#tier-EXCLUSIVA .tier-desc").textContent = textos.exclusiva.descripcion;
        }
    }

    const nombreVehiculo = cotizacionCliente.modelo ? 
        `${cotizacionCliente.marca} ${cotizacionCliente.modelo}` : 
        cotizacionCliente.marca;
        
    const nombresServicio = {
    "calidad_pastillas": "Pastillas Nuevas",
    "servicio_integral": "Servicio Integral",
    "mano_de_obra": "Solo Mano de Obra",
    "rectificacion": "Solo Rectificación"
    };

    const nombreServicio = nombresServicio[servicio] || servicio;
    document.getElementById("prices-subtitle").textContent = `${nombreVehiculo}  ➥  ${nombreServicio}`;

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
        },
        "rectificacion": {
            titulo: "Solo Rectificación",
            freeInstall: "",
            descripcion: "Rectificación técnica de discos para eliminar vibraciones, ruidos y prolongar la vida útil de tus pastillas."
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

    // 🟢 REESTRUCTURACIÓN PARA MANEJAR LOS 3 TIPOS DE CONTENEDORES
    tierContainer.classList.add("hidden");
    dualContainer.classList.add("hidden");
    singleContainer.classList.add("hidden");

    if (servicio === "mano_de_obra") {
        dualContainer.classList.remove("hidden");
        const costosManoObra = datosTarifas[tipo]["mano_de_obra"];
        document.getElementById("price-dual-pastillas").textContent = costosManoObra.solo_pastillas;
        document.getElementById("price-dual-discos").textContent = costosManoObra.cambio_discos;
        
    } else if (servicio === "rectificacion") {
        // 🟢 LÓGICA PARA RECTIFICACIÓN
        singleContainer.classList.remove("hidden");
        const precioRect = datosTarifas[tipo]["rectificacion"];
        document.getElementById("price-single-rectificacion").textContent = precioRect;
        
    } else {
        tierContainer.classList.remove("hidden");
        const bloqueTarifas = datosTarifas[tipo][servicio];
        
        const tarjetaExclusiva = document.getElementById("tier-EXCLUSIVA");
        const msgRestriccion = document.getElementById("restriction-exclusiva-msg");
        
        if (bloqueTarifas.EXCLUSIVA_WEB === null) {
            tarjetaExclusiva.classList.add("restricted");
            msgRestriccion.classList.remove("hidden");
        } else {
            tarjetaExclusiva.classList.remove("restricted");
            msgRestriccion.classList.add("hidden");
            document.getElementById("price-exclusiva-val").textContent = bloqueTarifas.EXCLUSIVA_WEB;
            const originalSpan = document.getElementById("precio-original-exclusiva");
            if (originalSpan) originalSpan.textContent = `$${bloqueTarifas.ESTANDAR}`;
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
8. CIERRE DE LA OPERACIÓN COMERCIAL (ENVÍO DIRECTO A WHATSAPP)
========================================================================== */
function finalizarCotizacion(nivelElegido) {
    const tipo = cotizacionCliente.tipoVehiculo;
    const servicio = cotizacionCliente.servicio;
    let precioSeleccionado = 0;

    if (servicio === "mano_de_obra") {
        if (nivelElegido.includes("Solo Pastillas")) {
            precioSeleccionado = datosTarifas[tipo]["mano_de_obra"].solo_pastillas;
        } else if (nivelElegido.includes("Instalación Completa")) {
            precioSeleccionado = datosTarifas[tipo]["mano_de_obra"].cambio_discos;
        }
    } else if (servicio === "rectificacion") {
        // 🟢 AGREGADO
        precioSeleccionado = datosTarifas[tipo]["rectificacion"];
    } else {
        const mapaNiveles = {
            "Estándar": "ESTANDAR",
            "Premium": "PREMIUM",
            "Oferta Web": "EXCLUSIVA_WEB"
        };
        const claveNivel = mapaNiveles[nivelElegido];
        precioSeleccionado = datosTarifas[tipo][servicio][claveNivel];
    }

    const nombreVehiculo = cotizacionCliente.modelo ? 
        `${cotizacionCliente.marca} ${cotizacionCliente.modelo}` : 
        cotizacionCliente.marca;

    const nombresServicio = {
        'calidad_pastillas': 'Pastillas Nuevas',
        'servicio_integral': 'Servicio Integral',
        'mano_de_obra': 'Solo Mano de Obra',
        'rectificacion': 'Solo Rectificación' // 🟢 AGREGADO
    };

    let mensaje = `¡Hola! 👋 He generado una cotización en la Web App y quiero agendar mi cita.`;
    mensaje += `\n🚗 *Vehículo:* ${nombreVehiculo}`;
    mensaje += `\n🔧 *Servicio:* ${nombresServicio[servicio]}`;
    
    // 🟢 AJUSTE MENOR: Si es rectificación, no tiene "Nivel" (Estándar/Premium), así que lo adaptamos
    if (servicio === "rectificacion") {
        mensaje += `\n💵 *Precio referencial:* $${precioSeleccionado} + IVA`;
    } else {
        mensaje += `\n⭐ *Nivel elegido:* ${nivelElegido}`;
        mensaje += `\n💵 *Precio referencial:* $${precioSeleccionado} + IVA`;
    }
    
    mensaje += `\n¿Tienen disponibilidad para atenderme?`;

    const urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    const link = document.createElement('a');
    link.href = urlWhatsApp;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            'mano_de_obra': 'Solo Mano de Obra',
            'rectificacion': 'Solo Rectificación'
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
const NUMERO_WHATSAPP = "593962059311"; 

function inicializarBotonWhatsApp() {
    actualizarEnlaceWhatsApp();
}

function actualizarEnlaceWhatsApp() {
    const btnWhatsApp = document.getElementById("whatsapp-float-btn");
    if (!btnWhatsApp) return;

    let mensajeFinal = "¡Hola! 👋 Estoy en la Web App de *Expertos en Frenos* y me gustaría recibir asesoría.";
    
    if (cotizacionCliente.tipoVehiculo) {
        const nombreVehiculo = cotizacionCliente.modelo ? 
            `${cotizacionCliente.marca} ${cotizacionCliente.modelo}` : 
            cotizacionCliente.marca;
        mensajeFinal += `\n🚗 *Mi vehículo:* ${nombreVehiculo}`;
    }

    if (cotizacionCliente.servicio) {
        const nombresServicio = {
            'calidad_pastillas': 'Pastillas Nuevas',
            'servicio_integral': 'Servicio Integral',
            'mano_de_obra': 'Solo Mano de Obra',
            'rectificacion': 'Solo Rectificación'
        };
        mensajeFinal += `\n🔧 *Servicio de interés:* ${nombresServicio[cotizacionCliente.servicio]}`;
    }
    
    mensajeFinal += `\n¿Me pueden confirmar disponibilidad y agendar una cita?`;

    const urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensajeFinal)}`;
    btnWhatsApp.href = urlWhatsApp;
}
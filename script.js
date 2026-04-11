// ==========================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vShUP7tNJU4WgCtbCh0okTb6VDwm7T1ixUY7IYheSPifL7t0XGSHo5D73ZQ1DoroPtKu67_JkZnFTJI/pub?gid=1721041411&single=true&output=csv';

let inventarioGlobal = []; // Guardamos los datos acá para poder buscarlos después
let miGraficoTorta = null;

// Elementos del DOM
const btnDashboard = document.getElementById('btn-dashboard');
const btnInventario = document.getElementById('btn-inventario');
const vistaDashboard = document.getElementById('vista-dashboard');
const vistaInventario = document.getElementById('vista-inventario');
const searchInput = document.getElementById('searchInput');

// ==========================================
// 2. INICIALIZACIÓN Y ANIMACIONES DE CARGA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Coreografía inicial con GSAP
  const tl = gsap.timeline();

  tl.from(".gsap-header", { y: -50, opacity: 0, duration: 0.6, ease: "power3.out" })
    .from(".gsap-bento", { 
      y: 30, 
      opacity: 0, 
      duration: 0.6, 
      stagger: 0.1, // Hace que entren una tras otra
      ease: "back.out(1.2)" 
    }, "-=0.3")
    .from(".gsap-nav", { y: 50, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.4");

  // Iniciar la carga de datos
  cargarDatosGoogleSheets();
});

// ==========================================
// 3. LECTURA DE DATOS (GOOGLE SHEETS)
// ==========================================
function cargarDatosGoogleSheets() {
  Papa.parse(GOOGLE_SHEET_CSV_URL, {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      // Limpiamos filas vacías
      inventarioGlobal = results.data.filter(row => row.nombre_comercial);
      
      // Procesar y mostrar la info
      procesarMetricasFinancieras(inventarioGlobal);
      renderizarListaInventario(inventarioGlobal);
    },
    error: function(error) {
      console.error("Error al cargar los datos:", error);
      document.getElementById('product-list').innerHTML = `
        <div class="bg-red-100 p-4 rounded-2xl text-red-600 text-center text-sm font-bold">
          Error de conexión. Verificá que el link de Google Sheets sea público.
        </div>`;
    }
  });
}

// ==========================================
// 4. LÓGICA FINANCIERA Y RENDERIZADO
// ==========================================
function procesarMetricasFinancieras(data) {
  let capitalTotal = 0;
  let gananciaTotal = 0;
  let mermasTotal = 0;
  let conteoVigente = 0, conteoProximo = 0, conteoVencido = 0;

  data.forEach(item => {
    let stock = Number(item.stock_actual) || 0;
    let costoUnitario = Number(item.precio_costo) || 0;
    let precioVenta = Number(item.precio_venta) || (costoUnitario * 1.4);
    
    // Normalizar estado
    let estadoCrudo = (item.estado_vencimiento || "VIGENTE").toString().toUpperCase();
    let estadoLimpio = "VIGENTE";
    if (estadoCrudo.includes("VENCIDO")) estadoLimpio = "VENCIDO";
    else if (estadoCrudo.includes("PRÓXIMO") || estadoCrudo.includes("PROXIMO")) estadoLimpio = "PRÓXIMO";

    // Cálculos
    let valorCostoFila = costoUnitario * stock;
    let valorVentaFila = precioVenta * stock;

    if (estadoLimpio === "VENCIDO") {
      mermasTotal += valorCostoFila; // Es pérdida
      conteoVencido += stock;
    } else {
      capitalTotal += valorCostoFila;
      gananciaTotal += (valorVentaFila - valorCostoFila);
      
      if (estadoLimpio === "VIGENTE") conteoVigente += stock;
      else conteoProximo += stock;
    }
  });

  // Animar los números del Dashboard con GSAP
  animarNumero("#val-capital", capitalTotal);
  animarNumero("#val-ganancia", gananciaTotal);
  animarNumero("#val-mermas", mermasTotal, true); // true para que le ponga el signo menos

  actualizarGraficoTorta(conteoVigente, conteoProximo, conteoVencido);
}

// Función auxiliar para animar los números como un cuentakilómetros
function animarNumero(selector, valorFinal, esNegativo = false) {
  const formatoPesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  
  gsap.to(selector, {
    innerHTML: valorFinal,
    duration: 1.5,
    snap: { innerHTML: 1 },
    ease: "power2.out",
    onUpdate: function() {
      let numeroActual = this.targets()[0].innerHTML;
      let texto = formatoPesos.format(numeroActual);
      document.querySelector(selector).innerHTML = esNegativo ? `-${texto}` : texto;
    }
  });
}

// ==========================================
// 5. RENDERIZADO DE LA LISTA DE INVENTARIO
// ==========================================
function renderizarListaInventario(data) {
  const container = document.getElementById('product-list');
  container.innerHTML = ''; // Borra el skeleton loader

  if (data.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">No se encontraron productos.</p>';
    return;
  }

  data.forEach((item, index) => {
    let nombre = item.nombre_comercial || "Desconocido";
    let categoria = item.categoria || "S/C";
    let stock = Number(item.stock_actual) || 0;
    let precio = Number(item.precio_venta) || (Number(item.precio_costo) * 1.4);
    
    let estadoCrudo = (item.estado_vencimiento || "VIGENTE").toString().toUpperCase();
    let estadoLimpio = "VIGENTE";
    if (estadoCrudo.includes("VENCIDO")) estadoLimpio = "VENCIDO";
    else if (estadoCrudo.includes("PRÓXIMO") || estadoCrudo.includes("PROXIMO")) estadoLimpio = "PRÓXIMO";

    // Configuramos colores según el estado
    let bgIcono, colorTexto, badgeColor;
    if (estadoLimpio === "VIGENTE") {
      bgIcono = "bg-teal-100"; colorTexto = "text-teal-600"; badgeColor = "bg-teal-100 text-teal-700 border-teal-200";
    } else if (estadoLimpio === "PRÓXIMO") {
      bgIcono = "bg-amber-100"; colorTexto = "text-amber-600"; badgeColor = "bg-amber-100 text-amber-700 border-amber-200";
    } else {
      bgIcono = "bg-red-100"; colorTexto = "text-red-600"; badgeColor = "bg-red-100 text-red-700 border-red-200";
    }

    const formatoPesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    const card = document.createElement('div');
    card.className = "gsap-item bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-glass border border-white flex items-center gap-4";
    if (estadoLimpio === "VENCIDO") card.style.opacity = "0.6";

    card.innerHTML = `
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${bgIcono}">
        <svg class="w-6 h-6 ${colorTexto}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-dark truncate ${estadoLimpio === 'VENCIDO' ? 'line-through text-gray-400' : ''}">${nombre}</h4>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-[10px] uppercase font-bold text-gray-500">${categoria}</span>
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}">${estadoLimpio}</span>
        </div>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="font-black text-dark ${estadoLimpio === 'VENCIDO' ? 'line-through text-gray-400' : ''}">${formatoPesos.format(precio)}</p>
        <p class="text-[10px] font-bold text-gray-400 mt-1">Stock: ${stock}</p>
      </div>
    `;
    container.appendChild(card);
  });

  // Animar entrada de la lista
  gsap.from(".gsap-item", {
    opacity: 0,
    y: 20,
    duration: 0.4,
    stagger: 0.05,
    ease: "power2.out"
  });
}

// ==========================================
// 6. BUSCADOR (Filtro en tiempo real)
// ==========================================
searchInput.addEventListener('input', (e) => {
  const termino = e.target.value.toLowerCase();
  const resultados = inventarioGlobal.filter(item => {
    return (item.nombre_comercial && item.nombre_comercial.toLowerCase().includes(termino)) || 
           (item.categoria && item.categoria.toLowerCase().includes(termino));
  });
  renderizarListaInventario(resultados);
});

// ==========================================
// 7. GRÁFICO (Chart.js)
// ==========================================
function actualizarGraficoTorta(vigente, proximo, vencido) {
  const ctx = document.getElementById('donutChart');
  if (miGraficoTorta) miGraficoTorta.destroy();

  miGraficoTorta = new Chart(ctx, { 
    type: 'doughnut', 
    data: { 
      labels: ['Vigente', 'Próximo', 'Vencido'], 
      datasets: [{ 
        data: [vigente, proximo, vencido], 
        backgroundColor: ['#00a3a3', '#d97706', '#dc2626'], // Teal, Amber, Red
        borderWidth: 0,
        hoverOffset: 5
      }] 
    }, 
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      cutout: '75%', 
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 10,
          cornerRadius: 12
        }
      },
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1500,
        easing: 'easeOutQuart'
      }
    } 
  });
}

// ==========================================
// 8. LÓGICA DE NAVEGACIÓN SPA (Routing y UI de Botones)
// ==========================================
function activarBotonNav(btnActivo, btnInactivo) {
  // Activar
  btnActivo.classList.remove('text-gray-400', 'bg-transparent');
  btnActivo.classList.add('bg-teal-500', 'text-white');
  btnActivo.querySelector('span').classList.remove('w-0', 'opacity-0');
  btnActivo.querySelector('span').classList.add('w-16', 'opacity-100', 'ml-2');

  // Desactivar
  btnInactivo.classList.remove('bg-teal-500', 'text-white');
  btnInactivo.classList.add('text-gray-400', 'bg-transparent');
  btnInactivo.querySelector('span').classList.add('w-0', 'opacity-0');
  btnInactivo.querySelector('span').classList.remove('w-16', 'opacity-100', 'ml-2');
}

btnDashboard.addEventListener('click', () => {
  if (!vistaDashboard.classList.contains('hidden')) return; // Ya estamos acá
  
  activarBotonNav(btnDashboard, btnInventario);
  
  // Transición suave
  gsap.to(vistaInventario, { opacity: 0, y: 10, duration: 0.2, onComplete: () => {
    vistaInventario.classList.add('hidden');
    vistaDashboard.classList.remove('hidden');
    gsap.fromTo(vistaDashboard, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
  }});
});

btnInventario.addEventListener('click', () => {
  if (!vistaInventario.classList.contains('hidden')) return; // Ya estamos acá
  
  activarBotonNav(btnInventario, btnDashboard);
  
  // Transición suave
  gsap.to(vistaDashboard, { opacity: 0, y: -10, duration: 0.2, onComplete: () => {
    vistaDashboard.classList.add('hidden');
    vistaInventario.classList.remove('hidden');
    gsap.fromTo(vistaInventario, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 });
    
    // Re-animar la lista al entrar
    gsap.from(".gsap-item", { opacity: 0, y: 20, duration: 0.4, stagger: 0.05, clearProps: "all" });
  }});
});
                                                

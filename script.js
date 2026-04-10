// 1. Datos simulados (Mockaroo / Supabase en el futuro)
const mockData = [
  { id: 1, nombre: "Ibuprofeno 600mg", categoria: "Medicamentos", stock: 150, costo: 1000, estado: "VIGENTE" },
  { id: 2, nombre: "Protector Solar FPS50", categoria: "Dermocosmética", stock: 30, costo: 2500, estado: "PRÓXIMO" },
  { id: 3, nombre: "Jarabe Antitusivo", categoria: "Medicamentos", stock: 10, costo: 640, estado: "VENCIDO" },
  { id: 4, nombre: "Amoxicilina 500mg", categoria: "Medicamentos", stock: 80, costo: 1200, estado: "VIGENTE" }
];

const MARKUP = 1.40; // 40% de margen de ganancia

// 2. Funciones de Formateo y Renderizado
function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

function renderDashboardMetrics(data) {
  let capital = 0;
  let ganancia = 0;
  let mermas = 0;

  data.forEach(item => {
    const valorCosto = item.costo * item.stock;
    const valorVenta = valorCosto * MARKUP;
    
    if (item.estado === "VENCIDO") {
      mermas += valorCosto;
    } else {
      capital += valorCosto;
      ganancia += (valorVenta - valorCosto);
    }
  });

  // Animaciones de contadores con GSAP
  gsap.to("#metric-capital", { innerHTML: capital, duration: 1.5, snap: { innerHTML: 1 }, onUpdate: function() { document.getElementById("metric-capital").innerHTML = formatCurrency(this.targets()[0].innerHTML); } });
  gsap.to("#metric-ganancia", { innerHTML: ganancia, duration: 1.5, snap: { innerHTML: 1 }, onUpdate: function() { document.getElementById("metric-ganancia").innerHTML = formatCurrency(this.targets()[0].innerHTML); } });
  gsap.to("#metric-mermas", { innerHTML: mermas, duration: 1.5, snap: { innerHTML: 1 }, onUpdate: function() { document.getElementById("metric-mermas").innerHTML = "-" + formatCurrency(this.targets()[0].innerHTML); } });
}

function renderProductList(data) {
  const container = document.getElementById('product-list');
  container.innerHTML = ''; // Limpiar lista

  data.forEach(item => {
    let badgeColor = item.estado === 'VIGENTE' ? 'bg-green-100 text-green-800' : 
                     item.estado === 'PRÓXIMO' ? 'bg-amber-100 text-amber-800' : 
                     'bg-red-100 text-red-800';

    let borderColor = item.estado === 'VIGENTE' ? 'border-green-500' : 
                      item.estado === 'PRÓXIMO' ? 'border-amber-500' : 
                      'border-red-500';

    const card = document.createElement('div');
    card.className = `bg-white p-4 rounded-xl shadow-sm product-card border-l-4 ${borderColor}`;
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div>
          <h3 class="font-bold text-gray-800 leading-tight">${item.nombre}</h3>
          <p class="text-xs text-gray-500">${item.categoria}</p>
        </div>
        <span class="px-2 py-1 text-[10px] font-bold rounded-md ${badgeColor}">${item.estado}</span>
      </div>
      <div class="flex justify-between items-end mt-3 border-t border-gray-100 pt-2">
        <div>
          <p class="text-xs text-gray-400">Stock: <span class="font-bold text-gray-700">${item.stock} u.</span></p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-400">PVP (+40%)</p>
          <p class="font-bold text-teal-700">${formatCurrency(item.costo * MARKUP)}</p>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// 3. Gráfico Chart.js
function initChart(data) {
  const ctx = document.getElementById('riskChart').getContext('2d');
  const conteo = { VIGENTE: 0, PRÓXIMO: 0, VENCIDO: 0 };
  
  data.forEach(item => conteo[item.estado] += item.stock);

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Vigente', 'Próximo a Vencer', 'Vencido'],
      datasets: [{
        data: [conteo.VIGENTE, conteo.PRÓXIMO, conteo.VENCIDO],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'], // Colores Tailwind
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } },
      cutout: '70%'
    }
  });
}

// 4. Lógica de Navegación (SPA Routing)
function setupNavigation() {
  const btnDashboard = document.getElementById('btn-dashboard');
  const btnInventario = document.getElementById('btn-inventario');
  const vistaDashboard = document.getElementById('vista-dashboard');
  const vistaInventario = document.getElementById('vista-inventario');

  function cambiarVista(vistaActiva) {
    if (vistaActiva === 'dashboard') {
      vistaDashboard.classList.remove('hidden');
      vistaInventario.classList.add('hidden');
      
      btnDashboard.classList.replace('text-gray-400', 'text-teal-600');
      btnInventario.classList.replace('text-teal-600', 'text-gray-400');
    } 
    else if (vistaActiva === 'inventario') {
      vistaInventario.classList.remove('hidden');
      vistaDashboard.classList.add('hidden');
      
      btnInventario.classList.replace('text-gray-400', 'text-teal-600');
      btnDashboard.classList.replace('text-teal-600', 'text-gray-400');
      
      // Animamos la lista de productos al entrar a esta vista
      gsap.from(".product-card", { opacity: 0, y: 20, duration: 0.4, stagger: 0.1, ease: "power1.out", clearProps: "all" });
    }
  }

  btnDashboard.addEventListener('click', () => cambiarVista('dashboard'));
  btnInventario.addEventListener('click', () => cambiarVista('inventario'));
}

// 5. Inicialización al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  // Animaciones iniciales GSAP para el dashboard
  gsap.from(".gsap-header", { y: -50, opacity: 0, duration: 0.8, ease: "power2.out" });
  gsap.from(".metric-card", { opacity: 0, scale: 0.9, duration: 0.6, stagger: 0.1, delay: 0.3 });
  gsap.from(".chart-container", { opacity: 0, x: -20, duration: 0.6, delay: 0.5 });

  // Ejecutar funciones
  renderDashboardMetrics(mockData);
  renderProductList(mockData);
  initChart(mockData);
  setupNavigation();
});

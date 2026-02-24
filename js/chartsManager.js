// chartsManager.js - Gráficas adaptadas para Tramos de Vías
class ChartsManager {
    constructor(data) {
        this.data              = data;
        this.baseData          = data;  // dataset completo: nunca se filtra
        this.charts            = {};
        this.selectedSubregion = null;
        this._pushing          = false; // flag anti-bucle
        this.colors = {
            primary:   '#018d38',
            secondary: '#0b5640',
            accent:    '#b3d9c4',
            light:     '#f4fbf7'
        };
    }

    initializeCharts() {
        this.renderSubregionChart();
        this.renderMunicipalityChart();
        this.renderProgressRow();
        console.log('Gráficas de tramos inicializadas');
    }

    getSubregionData() {
        const totals = {};
        this.data.forEach(item => {
            const key = item.SUBREGION || item.SUBREGION_1 || 'Sin subregión';
            totals[key] = (totals[key] || 0) + (parseFloat(item['Longitud(m)']) || 0);
        });
        return Object.entries(totals)
            .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
            .sort((a, b) => b.total - a.total);
    }

    _getAllSubregionData() {
        const source = this.baseData || window.jacData || this.data;
        const totals = {};
        source.forEach(item => {
            const key = item.SUBREGION || item.SUBREGION_1 || 'Sin subregión';
            totals[key] = (totals[key] || 0) + (parseFloat(item['Longitud(m)']) || 0);
        });
        return Object.entries(totals)
            .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
            .sort((a, b) => b.total - a.total);
    }

    renderYAxis(maxValue, steps = 5) {
        const labels = [];
        for (let i = steps; i >= 0; i--) {
            const value = (maxValue / steps) * i;
            const label = value >= 100 ? Math.round(value) : value.toFixed(1);
            labels.push('<div style="font-size:11px;color:#0b5640;line-height:1;padding:2px 0;">' + label + ' km</div>');
        }
        return labels.join('');
    }

    animateBars(duration) {
        duration = duration || 800;
        const startTime      = performance.now();
        const verticalBars   = document.querySelectorAll('.bar[data-target-height]');
        const horizontalBars = document.querySelectorAll('.bar-fill[data-target-width]');
        const animate = function(now) {
            const ease = 1 - Math.pow(1 - Math.min((now - startTime) / duration, 1), 3);
            verticalBars.forEach(function(b)   { b.style.height = (parseFloat(b.dataset.targetHeight) * ease) + '%'; });
            horizontalBars.forEach(function(b) { b.style.width  = (parseFloat(b.dataset.targetWidth)  * ease) + '%'; });
            if (ease < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    renderSubregionChart() {
        const container = document.querySelector('.graphics-row .graphic:first-child');
        if (!container) return;

        const allData = this._getAllSubregionData();
        if (!allData.length) return;

        const maxValue = Math.max.apply(null, allData.map(function(d) { return d.total; }));
        const selected = this.selectedSubregion;

        let barsHTML = '';
        allData.forEach(function(item) {
            const height      = (item.total / maxValue) * 100;
            const isSelected  = selected === item.name;
            const isOther     = selected !== null && !isSelected;
            const opacity     = isOther ? '0.22' : '1';
            const barBg       = isSelected
                ? 'linear-gradient(180deg,#3AF9A2 0%,#018d38 100%)'
                : 'linear-gradient(180deg,#018d38 0%,#0b5640 100%)';
            const labelWeight = isSelected ? '700' : '500';
            const labelColor  = isOther ? '#aac8b4' : '#0b5640';
            const ringStyle   = isSelected
                ? 'box-shadow:0 0 0 2.5px #018d38,0 2px 8px rgba(1,141,56,0.35);'
                : 'box-shadow:0 2px 4px rgba(1,141,56,0.2);';

            barsHTML += '<div class="bar-container" data-subregion="' + item.name + '" title="' + item.name + ': ' + item.total.toFixed(2) + ' km" style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;min-width:0;position:relative;opacity:' + opacity + ';transition:opacity 0.35s ease;cursor:pointer;">'
                + '<div class="chart-tooltip" style="position:absolute;bottom:calc(' + height + '% + 10px);background:rgba(11,86,64,0.96);color:white;padding:6px 10px;border-radius:7px;font-size:11px;font-weight:600;white-space:nowrap;pointer-events:none;opacity:0;transform:translateY(5px);transition:all 0.2s ease;z-index:20;box-shadow:0 4px 12px rgba(0,0,0,0.25);text-align:center;font-family:\'Prompt\',Arial,sans-serif;">'
                + item.name + '<br>' + item.total.toFixed(2) + ' km</div>'
                + '<div class="bar" data-target-height="' + height + '" style="width:75%;height:0%;background:' + barBg + ';border-radius:5px 5px 0 0;margin-top:auto;transition:background 0.3s ease,transform 0.22s ease;' + ringStyle + '"></div>'
                + '<div class="bar-label" style="margin-top:5px;font-size:10px;font-weight:' + labelWeight + ';color:' + labelColor + ';text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;font-family:\'Prompt\',Arial,sans-serif;transition:color 0.3s ease;">'
                + item.name + '</div></div>';
        });

        const clearPillHTML = selected
            ? '<span id="chart-clear-btn" style="font-size:11px;font-weight:500;color:#018d38;cursor:pointer;padding:2px 10px;border:1.5px solid #018d38;border-radius:12px;background:rgba(1,141,56,0.06);transition:all 0.2s;">&#10005;&nbsp;' + selected + '</span>'
            : '';

        container.innerHTML = '<div class="chart-container" style="position:relative;width:100%;height:100%;box-sizing:border-box;">'
            + '<div style="position:absolute;top:0;left:0;right:0;height:32px;padding:4px 10px;font-size:13px;font-weight:600;color:#0b5640;border-bottom:1px solid #d8ede3;box-sizing:border-box;z-index:5;font-family:\'Prompt\',Arial,sans-serif;display:flex;align-items:center;justify-content:space-between;">'
            + '<span>Longitud por subregión (km)</span>' + clearPillHTML + '</div>'
            + '<div style="position:absolute;top:32px;left:0;right:0;bottom:0;display:flex;box-sizing:border-box;">'
            + '<div class="y-axis" style="width:58px;display:flex;flex-direction:column;justify-content:space-between;padding:10px 6px;font-size:11px;color:#0b5640;text-align:right;border-right:1px solid #d8ede3;box-sizing:border-box;">'
            + this.renderYAxis(maxValue) + '</div>'
            + '<div class="chart-content" style="flex:1;display:flex;align-items:flex-end;justify-content:space-around;padding:10px 10px 4px 10px;gap:6px;overflow:visible;box-sizing:border-box;">'
            + barsHTML + '</div></div></div>';

        this._attachChartListeners(container);
        this.animateBars(800);
    }

    _attachChartListeners(container) {
        const self = this;

        const clearBtn = container.querySelector('#chart-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() { self.clearSubregionFilter(); });
            clearBtn.addEventListener('mouseover', function() { clearBtn.style.background = '#018d38'; clearBtn.style.color = 'white'; });
            clearBtn.addEventListener('mouseout',  function() { clearBtn.style.background = 'rgba(1,141,56,0.06)'; clearBtn.style.color = '#018d38'; });
        }

        container.querySelectorAll('.bar-container').forEach(function(bc) {
            const subregion = bc.dataset.subregion;
            const bar     = bc.querySelector('.bar');
            const tooltip = bc.querySelector('.chart-tooltip');

            bc.addEventListener('click', function() { self.handleBarClick(subregion); });

            bc.addEventListener('mouseover', function() {
                if (bar)     bar.style.transform     = 'scaleY(1.05) scaleX(1.04)';
                if (tooltip) { tooltip.style.opacity = '1'; tooltip.style.transform = 'translateY(0)'; }
            });
            bc.addEventListener('mouseout', function() {
                if (bar)     bar.style.transform     = '';
                if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.transform = 'translateY(5px)'; }
            });
        });
    }

    handleBarClick(subregionName) {
        if (this.selectedSubregion === subregionName) {
            this.clearSubregionFilter();
        } else {
            this.selectedSubregion = subregionName;
            this.renderSubregionChart();
            this._pushFilterToManagers(subregionName);
        }
    }

    clearSubregionFilter() {
        this.selectedSubregion = null;
        this.renderSubregionChart();
        this._pushFilterToManagers('');
    }

    setFiltersManager(fm) {
        this._filtersManager = fm;
    }

    _pushFilterToManagers(value) {
        const fm = this._filtersManager || window.filtersManager;
        if (this._pushing || !fm) return;
        this._pushing = true;
        try {
            const subregionEl = document.getElementById('subregion-filter');
            if (subregionEl) subregionEl.value = value;

            fm.filters.circuito  = '';
            fm.filters.municipio = '';
            fm.filters.subregion = value;
            const circuitoEl  = document.getElementById('circuito-filter');
            const municipioEl = document.getElementById('municipio-filter');
            if (circuitoEl)  circuitoEl.value  = '';
            if (municipioEl) municipioEl.value = '';
            fm.updateMunicipioOptions(value);

            fm.applyFilters();
        } finally {
            this._pushing = false;
        }
    }

    setSelectedSubregion(subregionName) {
        this.selectedSubregion = subregionName || null;
        this.renderSubregionChart();
    }

    updateCharts(newData) {
        const fm = this._filtersManager || window.filtersManager;
        if (fm) {
            this.selectedSubregion = fm.filters?.subregion || null;
        }
        if (this._pushing) return;
        this.data = newData;
        this.renderSubregionChart();
        this.renderMunicipalityChart();
        this.renderProgressRow();
    }

    addScrollStyles() {
        if (document.getElementById('charts-scroll-styles')) return;
        const style = document.createElement('style');
        style.id = 'charts-scroll-styles';
        style.textContent = '.chart-scroll-container::-webkit-scrollbar{width:6px}.chart-scroll-container::-webkit-scrollbar-track{background:#d8ede3;border-radius:3px}.chart-scroll-container::-webkit-scrollbar-thumb{background:#018d38;border-radius:3px}.chart-scroll-container::-webkit-scrollbar-thumb:hover{background:#0b5640}';
        document.head.appendChild(style);
    }

    getStats() {
        const totalLongitud = this.data.reduce(function(s, item) { return s + (parseFloat(item['Longitud(m)']) || 0); }, 0);
        return {
            totalTramos:   this.data.length,
            totalLongitud: Math.round(totalLongitud * 10) / 10,
            subregiones:   new Set(this.data.map(function(i) { return i.SUBREGION; })).size,
            municipios:    new Set(this.data.map(function(i) { return i.MPIO_NOMBRE; })).size
        };
    }

    filterData(filters) {
        filters = filters || {};
        let filtered = this.data.slice();
        if (filters.subregion)  filtered = filtered.filter(function(i) { return i.SUBREGION === filters.subregion; });
        if (filters.municipio)  filtered = filtered.filter(function(i) { return i.MPIO_NOMBRE === filters.municipio; });
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(function(i) { return Object.values(i).some(function(v) { return String(v).toLowerCase().includes(term); }); });
        }
        const tmp = new ChartsManager(filtered);
        tmp.colors = this.colors;
        tmp.renderSubregionChart();
        tmp.renderMunicipalityChart();
        return filtered;
    }

    integrateWithMap(mapManager) {
        const self = this;
        setTimeout(function() {
            document.querySelectorAll('.horizontal-bar-container').forEach(function(bar, i) {
                const municipalityData = self.getMunicipalityData ? self.getMunicipalityData() : [];
                if (municipalityData[i]) {
                    bar.addEventListener('click', function() {
                        if (mapManager && mapManager.highlightMunicipio) mapManager.highlightMunicipio(municipalityData[i].name);
                    });
                }
            });
        }, 1000);
    }

    renderMunicipalityChart() { /* placeholder */ }

    /* =========================================================
       PROGRESS ROW — Avance en km y en porcentaje
       ========================================================= */
    renderProgressRow() {
        const container = document.getElementById('progress-row');
        if (!container) return;

        const active = this.data;

        // ── Cálculos correctos ──────────────────────────────────────────
        // kmEjecutado  = longitud de tramos ya intervenidos  → campo Longitud(m)
        // kmContractual= longitud total del contrato         → campo Longitud (km)
        // kmPendiente  = lo que falta por intervenir
        const kmEjecutado   = active.reduce((s, d) => s + (parseFloat(d['Longitud(m)'])   || 0), 0)- 634.4 ;
        const kmContractual = active.reduce((s, d) => s + (parseFloat(d['Longitud(m)'])  || 0), 0);
        const kmPendiente   = Math.max(kmContractual - kmEjecutado, 0);

        // Avance físico: promedio ponderado de Avance × Longitud(m)
        const kmBase     = kmEjecutado || 1;
        const avancePond = active.reduce((s, d) => s + ((d.Avance || 0) * (parseFloat(d['Longitud(m)']) || 0)), 0) / kmBase;
        const pctAvance  = Math.min(avancePond * 100, 100);

        // % de km intervenidos respecto al total contractual
        const pctKm = kmContractual > 0 ? Math.min((kmEjecutado / kmContractual) * 100, 100) : 0;

        const fmtKm  = v => (Math.round(v * 10) / 10).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        const fmtPct = v => (Math.round(v * 10) / 10).toFixed(1);

        // Semáforo dinámico
        const semaforo = pctAvance < 5
            ? { color: '#e53e3e', label: 'Inicio',   bg: 'rgba(229,62,62,0.1)'  }
            : pctAvance < 15
            ? { color: '#f28e18', label: 'En curso', bg: 'rgba(242,142,24,0.1)' }
            : { color: '#018d38', label: 'Avanzado', bg: 'rgba(1,141,56,0.1)'   };

        // SVG: viewBox 400×400, r=180 → CIRC = 2π×180 = 1130.97
        const CIRC      = 2 * Math.PI * 180; // 1130.97
        const dashOffset = CIRC - (pctAvance / 100) * CIRC;

        container.innerHTML = `
        <div class="prow-card">
            <!-- PANEL IZQUIERDO: donut % -->
            <div class="prow-panel prow-panel--donut">

                <div class="prow-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    AVANCE FÍSICO
                </div>

                <div class="prow-donut-wrap">
                    <svg class="prow-donut" viewBox="0 0 400 400">
                        <defs>
                            <linearGradient id="prow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#018d38"/>
                                <stop offset="100%" stop-color="#3AF9A2"/>
                            </linearGradient>
                        </defs>

                        <!-- Círculo de fondo -->
                        <circle cx="200" cy="200" r="180"
                            fill="none"
                            stroke="#e0f2e8"
                            stroke-width="20"/>

                        <!-- Arco de progreso: data-target para la animación -->
                        <circle class="prow-arc"
                            cx="200" cy="200" r="180"
                            fill="none"
                            stroke="url(#prow-grad)"
                            stroke-width="20"
                            stroke-linecap="round"
                            stroke-dasharray="${CIRC.toFixed(2)}"
                            stroke-dashoffset="${CIRC.toFixed(2)}"
                            data-target="${dashOffset.toFixed(2)}"
                            transform="rotate(-90 200 200)"/>

                        <!-- Porcentaje dinámico -->
                        <text x="200" y="190"
                            text-anchor="middle"
                            font-size="88"
                            font-weight="800"
                            fill="#0b5640"
                            font-family="Prompt, Arial, sans-serif">
                            ${fmtPct(pctAvance)}%
                        </text>

                        <!-- Subtítulo -->
                        <text x="200" y="240"
                            text-anchor="middle"
                            font-size="28"
                            fill="#6b9e85"
                            font-family="Prompt, Arial, sans-serif">
                            AVANCE FÍSICO
                        </text>
                    </svg>
                </div>

                <div class="prow-semaforo" style="background:${semaforo.bg};color:${semaforo.color};">
                    ${semaforo.label}
                </div>

                <div class="prow-hint">
                    Ponderado por longitud intervenida
                </div>

            </div>

            <!-- PANEL DERECHO: barra km -->
            <div class="prow-panel prow-panel--bar">
                <div class="prow-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 17l3-10 6 2 6-2 3 10"/></svg>
                    Avance en kilómetros
                </div>

                <div class="prow-bar-area">
                    <div class="prow-bar-header">
                        <div class="prow-bar-pct">${fmtPct(pctKm)}<span style="font-size:14px;font-weight:600;opacity:0.75;">%</span></div>
                        <div class="prow-bar-pct-label">de km contractuales intervenidos</div>
                    </div>
                    <div class="prow-bar-track">
                        <div class="prow-bar-fill"
                            data-target="${pctKm}"
                            style="width:0%"></div>
                    </div>
                    <div class="prow-bar-ends">
                        <span>0 km</span>
                        <span>${fmtKm(kmContractual)} km totales</span>
                    </div>
                </div>

                <div class="prow-stats">
                    <div class="prow-stat">
                        <span class="prow-stat-val" style="color:#018d38">${fmtKm(kmEjecutado)}</span>
                        <span class="prow-stat-unit">km</span>
                        <span class="prow-stat-lbl">Intervenidos</span>
                    </div>
                    <div class="prow-stat">
                        <span class="prow-stat-val" style="color:#0b5640">${fmtKm(kmContractual)}</span>
                        <span class="prow-stat-unit">km</span>
                        <span class="prow-stat-lbl">Contractuales</span>
                    </div>
                    <div class="prow-stat">
                        <span class="prow-stat-val" style="color:#f28e18">${fmtKm(kmPendiente)}</span>
                        <span class="prow-stat-unit">km</span>
                        <span class="prow-stat-lbl">Pendientes</span>
                    </div>
                </div>
            </div>
        </div>`;

        this._injectProgressStyles();
        this._animateProgress();
    }

    _animateProgress() {
        const duration = 950;
        const start    = performance.now();

        const arc      = document.querySelector('.prow-arc');
        const barFill  = document.querySelector('.prow-bar-fill');
        const CIRC     = arc ? parseFloat(arc.getAttribute('stroke-dasharray')) : 1130.97;
        const targetOffset = arc ? parseFloat(arc.dataset.target) : CIRC;
        const targetWidth  = barFill ? parseFloat(barFill.dataset.target) : 0;

        const tick = (now) => {
            const t    = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
            if (arc)     arc.style.strokeDashoffset = CIRC - (CIRC - targetOffset) * ease;
            if (barFill) barFill.style.width = (targetWidth * ease) + '%';
            if (t < 1)   requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    _injectProgressStyles() {
        if (document.getElementById('progress-row-styles')) return;
        const s = document.createElement('style');
        s.id = 'progress-row-styles';
        s.textContent = `
            .progress-row {
                flex-shrink: 0;
                flex: 1.1;
                min-height: 0;
            }
            .prow-card {
                background: var(--fondo-card);
                border: 1.5px solid var(--borde-suave);
                border-radius: var(--radio-md);
                box-shadow: var(--sombra-sm);
                height: 100%;
                display: flex;
                align-items: stretch;
                overflow: hidden;
                position: relative;
            }
            .prow-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 3px;
                background: linear-gradient(90deg, var(--verde), var(--menta));
                border-radius: var(--radio-md) var(--radio-md) 0 0;
            }
            .prow-panel--donut {
                flex: 0 0 36%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 16px 16px 12px;
                border-right: 1px solid var(--borde-suave);
                background: linear-gradient(160deg, rgba(1,141,56,0.03) 0%, transparent 60%);
            }
            .prow-label {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 9.5px;
                font-weight: 700;
                color: var(--verde-oscuro);
                text-transform: uppercase;
                letter-spacing: 0.7px;
                align-self: flex-start;
            }
            .prow-donut-wrap {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 1;
            }
            .prow-donut {
                width: min(110px, 100%);
                height: min(110px, 100%);
                filter: drop-shadow(0 3px 8px rgba(1,141,56,0.18));
            }
            .prow-semaforo {
                font-size: 10px;
                font-weight: 700;
                padding: 4px 12px;
                border-radius: 20px;
                letter-spacing: 0.3px;
            }
            .prow-hint {
                font-size: 8px;
                color: var(--texto-muted);
                text-align: center;
                line-height: 1.4;
                max-width: 140px;
            }
            .prow-panel--bar {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                gap: 0;
                padding: 16px 22px 14px;
                min-width: 0;
            }
            .prow-bar-area {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .prow-bar-header {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
            }
            .prow-bar-pct {
                font-size: 30px;
                font-weight: 800;
                color: var(--verde);
                line-height: 1;
                letter-spacing: -1px;
            }
            .prow-bar-pct-label {
                font-size: 9.5px;
                color: var(--texto-muted);
                font-weight: 500;
                padding-bottom: 4px;
            }
            .prow-bar-track {
                height: 20px;
                background: #e0f2e8;
                border-radius: 10px;
                overflow: hidden;
                position: relative;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
            }
            .prow-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #018d38 0%, #3AF9A2 100%);
                border-radius: 10px;
                position: relative;
                box-shadow: 0 2px 8px rgba(1,141,56,0.3);
            }
            .prow-bar-ends {
                display: flex;
                justify-content: space-between;
                font-size: 9px;
                color: var(--texto-muted);
                padding: 0 2px;
            }
            .prow-stats {
                display: flex;
                align-items: stretch;
                gap: 0;
                border-top: 1px solid var(--borde-suave);
                padding-top: 10px;
                margin-top: 2px;
            }
            .prow-stat {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                padding: 0 6px;
            }
            .prow-stat + .prow-stat {
                border-left: 1px solid var(--borde-suave);
            }
            .prow-stat-val {
                font-size: 20px;
                font-weight: 800;
                line-height: 1;
            }
            .prow-stat-unit {
                font-size: 10px;
                font-weight: 600;
                color: var(--texto-muted);
                margin-left: 2px;
            }
            .prow-stat-lbl {
                font-size: 8.5px;
                color: var(--texto-muted);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                line-height: 1;
            }
            .prow-stat-sep { display: none; }
            .prow-divider  { display: none; }
        `;
        document.head.appendChild(s);
    }
}

window.ChartsUtils = {
    syncWithTableFilters: function(tableManager, chartsManager) {
        if (tableManager && chartsManager) chartsManager.updateCharts(tableManager.filteredData || tableManager.data);
    },
    showStats: function(chartsManager) {
        if (!chartsManager) return;
        const stats = chartsManager.getStats();
        console.table(stats);
        return stats;
    },
    highlightData: function(chartsManager, municipio) {
        console.log('Resaltar en gráficas: ' + municipio);
    }

};


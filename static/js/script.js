// ========== MATHQUILL INIT ==========
$(document).ready(function() {
    try {
        var MQ = MathQuill.getInterface(2);
        var mathField = MQ.MathField(document.getElementById('mathquill-input'), {
            spaceBehavesLikeTab: true,
            handlers: {
                edit: function() {
                    try {
                        var latex = mathField.latex();
                        document.getElementById('mathquill-input').setAttribute('data-latex', latex);
                    } catch (e) {
                        console.warn('MathQuill edit handler error:', e);
                    }
                }
            }
        });
        window.mathField = mathField;
    } catch (e) {
        console.error('MathQuill initialization failed:', e);
        showGlobalError('Math input failed to load. Please refresh the page.');
    }
});

// ========== GLOBAL ERROR DISPLAY ==========
function showGlobalError(message) {
    var resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="error-msg">⚠️ ' + message + '</div>';
    } else {
        alert('Error: ' + message);
    }
}

// ========== MATHQUILL TO PYTHON CONVERTER ==========
function mathquillToPython(latex) {
    if (!latex || typeof latex !== 'string') {
        console.warn('Invalid LaTeX input, using default "x"');
        return 'x';
    }
    
    try {
        var expr = latex;
        
        expr = expr.replace(/\\cdot/g, '*');
        expr = expr.replace(/\\left|\\right/g, '');
        expr = expr.replace(/\^\{([^}]+)\}/g, '**($1)');
        expr = expr.replace(/\^([a-zA-Z0-9]+)/g, '**($1)');
        expr = expr.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
        expr = expr.replace(/\\sin/g, 'sin');
        expr = expr.replace(/\\cos/g, 'cos');
        expr = expr.replace(/\\tan/g, 'tan');
        expr = expr.replace(/\\exp/g, 'exp');
        expr = expr.replace(/\\log/g, 'log');
        expr = expr.replace(/\\sqrt/g, 'sqrt');
        expr = expr.replace(/\\ln/g, 'log');
        expr = expr.replace(/[{}]/g, '');
        expr = expr.replace(/\s+/g, '');
        expr = expr.replace(/\\pi/g, 'pi');
        expr = expr.replace(/\\e/g, 'e');
        expr = expr.replace(/\\([a-zA-Z]+)/g, '$1');
        expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
        expr = expr.replace(/([a-zA-Z])(\d)/g, '$1*$2');
        expr = expr.replace(/\)\(/g, ')*(');
        expr = expr.replace(/(\d)\(/g, '$1*(');
        expr = expr.replace(/\)([a-zA-Z])/g, ')*$1');
        
        if (!expr || expr.trim() === '') {
            console.warn('Empty expression after conversion, using "x"');
            return 'x';
        }
        
        console.log('Converted:', latex, '->', expr);
        return expr;
        
    } catch (e) {
        console.error('LaTeX conversion error:', e);
        throw new Error('Failed to convert math expression. Please check your input.');
    }
}

// ========== HELPER FUNCTIONS ==========
function formatNum(val, decimals) {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') {
        if (!isFinite(val)) return '∞';
        if (isNaN(val)) return 'NaN';
        return val.toFixed(decimals);
    }
    return String(val);
}

function toggleStep(id) {
    try {
        var el = document.getElementById(id);
        if (!el) { console.warn('Step element not found:', id); return; }
        el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
    } catch (e) {
        console.error('Toggle step error:', e);
    }
}

// ========== BACK TO TOP ==========
(function() {
    try {
        var backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) { console.warn('Back to top button not found'); return; }
        
        window.addEventListener('scroll', function() {
            try {
                if ((window.pageYOffset || document.documentElement.scrollTop) > 400) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            } catch (e) { console.error('Scroll handler error:', e); }
        });
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    } catch (e) {
        console.error('Back to top initialization error:', e);
    }
})();

// ========== DECIMAL CONTROL ==========
var currentDecimals = 6;

(function() {
    try {
        var decimalValueDisplay = document.getElementById('decimalValue');
        var minusBtn = document.getElementById('decimalMinus');
        var plusBtn = document.getElementById('decimalPlus');
        
        if (!decimalValueDisplay || !minusBtn || !plusBtn) {
            console.warn('Decimal controls not found'); return;
        }
        
        function updateDecimals(newVal) {
            currentDecimals = parseInt(newVal);
            decimalValueDisplay.textContent = currentDecimals;
            if (window.lastResult && window.lastLatex && window.lastData) {
                refreshTable();
            }
        }
        
        minusBtn.addEventListener('click', function() {
            if (currentDecimals > 1) { updateDecimals(currentDecimals - 1); }
        });
        
        plusBtn.addEventListener('click', function() {
            if (currentDecimals < 12) { updateDecimals(currentDecimals + 1); }
        });
        
        window.getCurrentDecimals = function() { return currentDecimals; };
    } catch (e) {
        console.error('Decimal control initialization error:', e);
    }
})();

// ========== REFRESH TABLE ON DECIMAL CHANGE ==========
function refreshTable() {
    if (!window.lastResult || !window.lastResult.iterations) return;
    
    var dec = window.getCurrentDecimals ? window.getCurrentDecimals() : 6;
    
    var tableWrapper = document.querySelector('.result-table-wrapper');
    if (!tableWrapper) return;
    
    var rows = tableWrapper.querySelectorAll('tbody tr, table tr');
    
    rows.forEach(function(row, idx) {
        if (idx === 0) return;
        var cells = row.querySelectorAll('td');
        if (cells.length >= 7) {
            var n = parseInt(cells[0].textContent);
            window.lastResult.iterations.forEach(function(it) {
                if (it.n === n) {
                    var xPrev = it.x_n;
                    var fPrev = it.f_x_n;
                    var xCurr = it.x_n1;
                    var fCurr = it.f_x_n1;
                    var errorVal = it.error !== undefined ? it.error : Math.abs(xCurr - xPrev);
                    
                    cells[1].textContent = formatNum(xPrev, dec);
                    cells[2].textContent = formatNum(fPrev, dec);
                    cells[3].textContent = formatNum(xCurr, dec);
                    cells[4].textContent = formatNum(fCurr, dec);
                    cells[5].textContent = formatNum(errorVal, dec);
                }
            });
        }
    });
    
    var formattedRoot = formatNum(window.lastResult.root, dec);
    var successMsg = document.querySelector('.success-msg strong');
    if (successMsg) successMsg.textContent = formattedRoot;
    
    var infoText = document.querySelector('.info-text');
    if (infoText && window.lastData) {
        infoText.innerHTML = '<strong>📐 f(x)=</strong> $' + (window.lastLatex || '').replace(/\$/g, '\\$') + '$ | <strong>🎯 x₀=</strong>' + window.lastData.x0 + ' | <strong>🎯 x₁=</strong>' + window.lastData.x1 + ' | <strong>🔢</strong>' + dec + ' decimals';
        if (window.MathJax) MathJax.typesetPromise();
    }
}

// ========== GRAPH ==========
var graphData = null;
var currentStep = 0;

function drawGraph(data, step) {
    try {
        var canvas = document.getElementById('graphCanvas');
        if (!canvas) { console.warn('Graph canvas not found'); return; }
        
        var ctx = canvas.getContext('2d');
        if (!ctx) { console.error('Canvas context not available'); return; }
        
        var W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        if (!data || !data.iterations || data.iterations.length === 0) {
            ctx.fillStyle = '#999'; ctx.font = '16px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('No data to display', W/2, H/2); return;
        }

        var padding = { left: 65, right: 30, top: 30, bottom: 50 };
        
        var allX = [];
        data.iterations.forEach(function(it) {
            if (it.x_n !== null && isFinite(it.x_n)) allX.push(it.x_n);
            if (it.x_n1 !== null && isFinite(it.x_n1)) allX.push(it.x_n1);
        });
        
        if (allX.length === 0) {
            ctx.fillStyle = '#999'; ctx.font = '16px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('No valid x values', W/2, H/2); return;
        }
        
        var xMin = Math.min.apply(null, allX) - 0.5;
        var xMax = Math.max.apply(null, allX) + 0.5;
        if (xMin === xMax) { xMin -= 1; xMax += 1; }

        var fxValues = [];
        for (var i = 0; i <= 200; i++) {
            var x = xMin + (xMax - xMin) * i / 200;
            try { var val = data.safeEval(x); fxValues.push(isFinite(val) ? val : NaN); }
            catch(e) { fxValues.push(NaN); }
        }
        
        var validFx = fxValues.filter(function(v) { return !isNaN(v) && isFinite(v); });
        if (validFx.length === 0) {
            ctx.fillStyle = '#999'; ctx.font = '16px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('Cannot evaluate function in this range', W/2, H/2); return;
        }
        
        var yMin = Math.min(0, Math.min.apply(null, validFx)) - 0.5;
        var yMax = Math.max(0, Math.max.apply(null, validFx)) + 0.5;
        if (yMin === yMax) { yMin -= 1; yMax += 1; }

        var plotW = W - padding.left - padding.right;
        var plotH = H - padding.top - padding.bottom;

        function toX(x) { return padding.left + (x - xMin) / (xMax - xMin) * plotW; }
        function toY(y) { return H - padding.bottom - (y - yMin) / (yMax - yMin) * plotH; }

        ctx.strokeStyle = '#e8ecf0'; ctx.lineWidth = 0.5;
        var xTicks = 10, yTicks = 8;
        for (var i = 0; i <= xTicks; i++) {
            var gx = padding.left + plotW * i / xTicks;
            ctx.beginPath(); ctx.moveTo(gx, padding.top); ctx.lineTo(gx, H - padding.bottom); ctx.stroke();
        }
        for (var i = 0; i <= yTicks; i++) {
            var gy = padding.top + plotH * i / yTicks;
            ctx.beginPath(); ctx.moveTo(padding.left, gy); ctx.lineTo(W - padding.right, gy); ctx.stroke();
        }

        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        var zeroY = toY(0), zeroX = toX(0);
        ctx.beginPath(); ctx.moveTo(padding.left, zeroY); ctx.lineTo(W - padding.right, zeroY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(zeroX, padding.top); ctx.lineTo(zeroX, H - padding.bottom); ctx.stroke();

        ctx.fillStyle = '#333'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
        var xStep = (xMax - xMin) / xTicks;
        for (var i = 0; i <= xTicks; i++) {
            var val = xMin + xStep * i;
            ctx.fillText(val.toFixed(1), padding.left + plotW * i / xTicks, zeroY + 18);
        }
        ctx.fillText('x', W - padding.right + 5, zeroY + 5);

        ctx.textAlign = 'right';
        var yStep = (yMax - yMin) / yTicks;
        for (var i = 0; i <= yTicks; i++) {
            var val = yMin + yStep * i;
            ctx.fillText(val.toFixed(1), padding.left - 8, H - padding.bottom - plotH * i / yTicks + 4);
        }
        ctx.save();
        ctx.translate(padding.left - 35, padding.top + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('f(x)', 0, 0);
        ctx.restore();

        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
        ctx.beginPath();
        var started = false;
        for (var i = 0; i <= 200; i++) {
            var x = xMin + (xMax - xMin) * i / 200, y = fxValues[i];
            if (!isNaN(y) && isFinite(y)) {
                if (!started) { ctx.moveTo(toX(x), toY(y)); started = true; }
                else { ctx.lineTo(toX(x), toY(y)); }
            } else { started = false; }
        }
        ctx.stroke();

        var iters = data.iterations;
        for (var s = 1; s <= step && s < iters.length; s++) {
            var prev = iters[s], xA = prev.x_n, fA = prev.f_x_n, xB = prev.x_n1, fB = prev.f_x_n1;
            if (xA === null || fA === null || xB === null || fB === null) continue;
            if (xA === xB) continue;
            if (!isFinite(fA) || !isFinite(fB)) continue;
            var slope = (fB - fA) / (xB - xA);
            if (!isFinite(slope)) continue;
            var intercept = fA - slope * xA;
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 3]);
            ctx.beginPath();
            ctx.moveTo(toX(xMin), toY(slope * xMin + intercept));
            ctx.lineTo(toX(xMax), toY(slope * xMax + intercept));
            ctx.stroke();
            ctx.setLineDash([]);
        }

        for (var s = 0; s <= step && s < iters.length; s++) {
            var it = iters[s];
            if (it.x_n !== null && it.f_x_n !== null && isFinite(it.x_n) && isFinite(it.f_x_n)) {
                ctx.fillStyle = s === 0 ? '#f59e0b' : '#ef4444';
                ctx.beginPath(); ctx.arc(toX(it.x_n), toY(it.f_x_n), 6, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
                if (s <= 1 || s === step) {
                    ctx.fillStyle = '#333'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText('x' + (s), toX(it.x_n), toY(it.f_x_n) - 14);
                }
            }
            if (s > 0 && it.x_n1 !== null && it.f_x_n1 !== null && isFinite(it.x_n1) && isFinite(it.f_x_n1)) {
                ctx.fillStyle = '#10b981';
                ctx.beginPath(); ctx.arc(toX(it.x_n1), toY(it.f_x_n1), 6, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
                if (s === step) {
                    ctx.fillStyle = '#333'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText('x' + (s+1), toX(it.x_n1), toY(it.f_x_n1) - 14);
                }
            }
        }

        if (data.root !== null && isFinite(data.root)) {
            var rx = toX(data.root), ry = toY(0);
            ctx.fillStyle = '#10b981';
            ctx.beginPath(); ctx.arc(rx, ry, 8, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = '#333'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText('Root ' + data.root.toFixed(4), rx + 14, ry - 6);
        }
        
    } catch (e) {
        console.error('Graph drawing error:', e);
    }
}

function nextGraphStep() {
    try {
        if (!graphData || currentStep >= graphData.iterations.length - 1) return;
        currentStep++;
        drawGraph(graphData, currentStep);
        var infoEl = document.getElementById('graphIterInfo');
        if (infoEl) infoEl.textContent = 'Step ' + currentStep + ': Secant line through x' + (currentStep-1) + ' and x' + currentStep;
    } catch (e) { console.error('Next step error:', e); }
}

function prevGraphStep() {
    try {
        if (currentStep <= 0) return;
        currentStep--;
        drawGraph(graphData, currentStep);
        var infoEl = document.getElementById('graphIterInfo');
        if (infoEl) infoEl.textContent = currentStep === 0 ? 'Step 0: Initial points (x₀, x₁)' : 'Step ' + currentStep + ': Secant line through x' + (currentStep-1) + ' and x' + currentStep;
    } catch (e) { console.error('Previous step error:', e); }
}

// ========== EXPORT FUNCTIONS ==========
function showToast(message) {
    var toast = document.getElementById('exportToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'exportToast';
        toast.className = 'export-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

function exportToCSV() {
    try {
        if (!window.lastResult || !window.lastResult.iterations) { showToast('⚠️ No results to export'); return; }
        var dec = window.getCurrentDecimals ? window.getCurrentDecimals() : 6;
        var csv = 'n,x_n-1,f(x_n-1),x_n,f(x_n),e,x_n+1\n';
        
        window.lastResult.iterations.forEach(function(it) {
            var e = it.error !== undefined ? it.error : Math.abs(it.x_n1 - it.x_n);
            csv += it.n + ',' + formatNum(it.x_n, dec) + ',' + formatNum(it.f_x_n, dec) + ',' + formatNum(it.x_n1, dec) + ',' + formatNum(it.f_x_n1, dec) + ',' + formatNum(e, dec) + ',' + formatNum(it.x_n1, dec) + '\n';
        });
        
        csv += '\nRoot,' + formatNum(window.lastResult.root, dec) + '\n';
        csv += 'Function,' + (window.lastData ? window.lastData.function : '') + '\n';
        csv += 'Iterations,' + (window.lastResult.iterations.length - 1) + '\n';
        
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url; link.download = 'secant-method-results.csv'; link.click();
        URL.revokeObjectURL(url);
        showToast('✅ CSV exported!');
    } catch (e) { console.error('CSV export error:', e); showToast('❌ Export failed'); }
}

function exportToPDF() {
    try {
        if (!window.lastResult || !window.lastResult.iterations) { showToast('⚠️ No results to export'); return; }
        var dec = window.getCurrentDecimals ? window.getCurrentDecimals() : 6;
        var latex = window.lastLatex || 'f(x)';
        
        var pdfHtml = '<html><head><style>';
        pdfHtml += 'body{font-family:Arial,sans-serif;padding:20px;color:#333;}';
        pdfHtml += 'h1{color:#1a237e;text-align:center;}h3{color:#333;}';
        pdfHtml += 'table{border-collapse:collapse;width:100%;margin:15px 0;}';
        pdfHtml += 'th{background:#3b82f6;color:white;padding:10px;font-size:0.85em;}';
        pdfHtml += 'td{border:1px solid #ddd;padding:8px;text-align:center;font-size:0.85em;}';
        pdfHtml += 'tr:nth-child(even){background:#f9f9f9;}';
        pdfHtml += '.info{margin:15px 0;color:#555;}';
        pdfHtml += '.root{background:#e8f5e9;padding:12px;border-radius:6px;text-align:center;font-size:1.2em;font-weight:bold;color:#2e7d32;}';
        pdfHtml += '@media print{body{padding:0;}}';
        pdfHtml += '</style></head><body>';
        
        pdfHtml += '<h1>Secant Method Results</h1>';
        pdfHtml += '<p class="info"><strong>Function:</strong> ' + latex + '</p>';
        pdfHtml += '<p class="info"><strong>x₀:</strong> ' + (window.lastData ? window.lastData.x0 : '') + ' | <strong>x₁:</strong> ' + (window.lastData ? window.lastData.x1 : '') + '</p>';
        pdfHtml += '<p class="info"><strong>Tolerance:</strong> ' + (window.lastData ? window.lastData.tol : '') + ' | <strong>Max Iter:</strong> ' + (window.lastData ? window.lastData.max_iter : '') + '</p>';
        pdfHtml += '<div class="root">✅ Root: ' + formatNum(window.lastResult.root, dec) + '</div>';
        pdfHtml += '<h3>Iteration Table</h3><table><tr><th>n</th><th>xₙ₋₁</th><th>f(xₙ₋₁)</th><th>xₙ</th><th>f(xₙ)</th><th>e</th><th>xₙ₊₁</th></tr>';
        
        window.lastResult.iterations.forEach(function(it) {
            var e = it.error !== undefined ? it.error : Math.abs(it.x_n1 - it.x_n);
            pdfHtml += '<tr><td>' + it.n + '</td><td>' + formatNum(it.x_n, dec) + '</td><td>' + formatNum(it.f_x_n, dec) + '</td><td>' + formatNum(it.x_n1, dec) + '</td><td>' + formatNum(it.f_x_n1, dec) + '</td><td>' + formatNum(e, dec) + '</td><td>' + formatNum(it.x_n1, dec) + '</td></tr>';
        });
        
        pdfHtml += '</table><p class="info">✨ Converged in <strong>' + (window.lastResult.iterations.length - 1) + '</strong> iterations</p>';
        pdfHtml += '<p style="text-align:center;color:#999;margin-top:30px;">Generated by Secant Method Calculator © 2026</p>';
        pdfHtml += '</body></html>';
        
        var printWindow = window.open('', '_blank');
        printWindow.document.write(pdfHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(function() { printWindow.print(); showToast('✅ PDF ready! Save as PDF in print dialog.'); }, 500);
    } catch (e) { console.error('PDF export error:', e); showToast('❌ Export failed'); }
}

function copyResults() {
    try {
        if (!window.lastResult || !window.lastResult.iterations) { showToast('⚠️ No results to copy'); return; }
        var dec = window.getCurrentDecimals ? window.getCurrentDecimals() : 6;
        var text = '=== Secant Method Results ===\n\n';
        text += 'Function: ' + (window.lastLatex || 'f(x)') + '\n';
        text += 'Root: ' + formatNum(window.lastResult.root, dec) + '\n';
        text += 'Iterations: ' + (window.lastResult.iterations.length - 1) + '\n\n';
        text += 'n\tx_n-1\t\tf(x_n-1)\t\tx_n\t\tf(x_n)\t\te\t\tx_n+1\n';
        
        window.lastResult.iterations.forEach(function(it) {
            var e = it.error !== undefined ? it.error : Math.abs(it.x_n1 - it.x_n);
            text += it.n + '\t' + formatNum(it.x_n, dec) + '\t' + formatNum(it.f_x_n, dec) + '\t' + formatNum(it.x_n1, dec) + '\t' + formatNum(it.f_x_n1, dec) + '\t' + formatNum(e, dec) + '\t' + formatNum(it.x_n1, dec) + '\n';
        });
        
        navigator.clipboard.writeText(text).then(function() {
            showToast('✅ Results copied to clipboard!');
        }).catch(function() {
            var textarea = document.createElement('textarea');
            textarea.value = text; document.body.appendChild(textarea);
            textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea);
            showToast('✅ Results copied!');
        });
    } catch (e) { console.error('Copy error:', e); showToast('❌ Copy failed'); }
}

// ========== INPUT VALIDATION ==========
function validateInputs(x0, x1, tol, maxIter) {
    var errors = [];
    var x0Num = parseFloat(x0);
    if (isNaN(x0Num) || !isFinite(x0Num)) errors.push('x₀ must be a valid number.');
    var x1Num = parseFloat(x1);
    if (isNaN(x1Num) || !isFinite(x1Num)) errors.push('x₁ must be a valid number.');
    if (!isNaN(x0Num) && !isNaN(x1Num) && x0Num === x1Num) errors.push('x₀ and x₁ must be different values.');
    var tolNum = parseFloat(tol);
    if (isNaN(tolNum) || !isFinite(tolNum) || tolNum <= 0) errors.push('Tolerance must be a positive number.');
    if (tolNum > 1) errors.push('Tolerance should be less than 1 (e.g., 0.001, 1e-6).');
    var maxIterNum = parseInt(maxIter);
    if (isNaN(maxIterNum) || maxIterNum < 1) errors.push('Max iterations must be at least 1.');
    if (maxIterNum > 500) errors.push('Max iterations cannot exceed 500.');
    return errors;
}

// ========== FORM HANDLER ==========
document.getElementById('calc-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var resDiv = document.getElementById('result');
    if (!resDiv) { console.error('Result div not found'); return; }
    
    try {
        if (!window.mathField) {
            resDiv.innerHTML = '<div class="error-msg">❌ Math input not ready. Please refresh the page.</div>';
            return;
        }
        
        var latex = window.mathField.latex();
        if (!latex || latex.trim() === '') {
            resDiv.innerHTML = '<div class="error-msg">❌ Please enter a function f(x).</div>';
            return;
        }
        
        var fExpr;
        try { fExpr = mathquillToPython(latex); }
        catch (convErr) { resDiv.innerHTML = '<div class="error-msg">❌ ' + convErr.message + '</div>'; return; }
        
        var x0 = document.getElementById('x0').value;
        var x1 = document.getElementById('x1').value;
        var tol = document.getElementById('tol').value;
        var maxIter = document.getElementById('max_iter').value;
        
        var validationErrors = validateInputs(x0, x1, tol, maxIter);
        if (validationErrors.length > 0) {
            var errorHtml = '<div class="error-msg">❌ <strong>Input Errors:</strong><ul style="margin-top:8px;">';
            validationErrors.forEach(function(err) { errorHtml += '<li>' + err + '</li>'; });
            errorHtml += '</ul></div>';
            resDiv.innerHTML = errorHtml;
            return;
        }
        
        var data = { function: fExpr, x0: x0, x1: x1, tol: tol, max_iter: maxIter };
        resDiv.innerHTML = '<div class="loading-msg">⏳ Calculating... Please wait...</div>';
        resDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        var response = await fetch('/calculate/secant', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            var errorData;
            try { errorData = await response.json(); } catch (parseErr) { throw new Error('Server error ' + response.status); }
            throw new Error(errorData.error || 'Server error ' + response.status);
        }
        
        var result = await response.json();
        if (result.error) { resDiv.innerHTML = '<div class="error-msg">❌ ' + result.error + '</div>'; return; }
        if (!result.root && result.root !== 0) { resDiv.innerHTML = '<div class="error-msg">❌ No root found. Try different initial values.</div>'; return; }
        if (!result.iterations || result.iterations.length === 0) { resDiv.innerHTML = '<div class="error-msg">❌ No iteration data returned.</div>'; return; }

        var dec = window.getCurrentDecimals ? window.getCurrentDecimals() : 6;
        var formattedRoot = formatNum(result.root, dec);
        
        var safeEvalFn;
        try {
            safeEvalFn = new Function('x', 'var sin=Math.sin,cos=Math.cos,tan=Math.tan,exp=Math.exp,log=Math.log,sqrt=Math.sqrt,abs=Math.abs,pow=Math.pow,pi=Math.PI,e=Math.E; return ' + fExpr + ';');
            var testVal = safeEvalFn(1);
            if (typeof testVal !== 'number' || !isFinite(testVal)) throw new Error('Function returns invalid value');
        } catch (funcErr) {
            resDiv.innerHTML = '<div class="error-msg">❌ Invalid function: ' + funcErr.message + '.</div>';
            return;
        }

        var html = '<div class="result-card">';
        html += '<div class="success-msg">✅ Root Found: <strong>' + formattedRoot + '</strong></div>';
        html += '<p class="info-text"><strong>📐 f(x)=</strong> $' + latex.replace(/\$/g, '\\$') + '$ | <strong>🎯 x₀=</strong>' + data.x0 + ' | <strong>🎯 x₁=</strong>' + data.x1 + ' | <strong>🔢</strong>' + dec + ' decimals</p>';
        html += '<div class="graph-container"><canvas id="graphCanvas" width="700" height="450"></canvas><div class="iteration-info" id="graphIterInfo">Step 0: Initial points (x₀, x₁)</div><div class="graph-controls"><button class="graph-btn" onclick="prevGraphStep()">◀ Prev</button><button class="graph-btn" onclick="nextGraphStep()">Next ▶</button></div></div>';
        
        html += '<div class="export-buttons">';
        html += '<button class="export-btn csv" onclick="exportToCSV()">📥 Export CSV</button>';
        html += '<button class="export-btn pdf" onclick="exportToPDF()">📄 Export PDF</button>';
        html += '<button class="export-btn copy" onclick="copyResults()">📋 Copy Results</button>';
        html += '</div>';
        
        // Table - skip n=0 (initial setup), start at n=1 (first iteration)
        html += '<div class="result-table-wrapper"><table><tr><th>n</th><th>x<sub>n-1</sub></th><th>f(x<sub>n-1</sub>)</th><th>x<sub>n</sub></th><th>f(x<sub>n</sub>)</th><th>e</th><th>Steps</th></tr>';
        
        result.iterations.forEach(function(it, i) {
            if (it.n === 0) return; // skip initial setup row
            
            var sid = 'step-' + it.n;
            var isLast = i === result.iterations.length - 1;
            var rowClass = isLast ? 'highlight-row' : '';
            
            // For n=1: x_{n-1}=x₀, x_n=x₁ (from iteration 0)
            // For n>1: x_{n-1}=previous x_n, x_n=current x_n
            var xPrev = it.x_n;
            var fPrev = it.f_x_n;
            var xCurr = it.x_n1;
            var fCurr = it.f_x_n1;
            var errorVal = it.error !== undefined ? it.error : Math.abs(xCurr - xPrev);
            var stepText = (it.step || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var stepBtnLabel = '📝';
            
            html += '<tr class="' + rowClass + '">';
            html += '<td><strong>' + it.n + '</strong></td>';
            html += '<td>' + formatNum(xPrev, dec) + '</td>';
            html += '<td>' + formatNum(fPrev, dec) + '</td>';
            html += '<td>' + formatNum(xCurr, dec) + '</td>';
            html += '<td>' + formatNum(fCurr, dec) + '</td>';
            html += '<td>' + formatNum(errorVal, dec) + '</td>';
            html += '<td><button class="step-btn" onclick="toggleStep(\'' + sid + '\')">' + stepBtnLabel + '</button><div id="' + sid + '" class="step-detail">' + stepText + '</div></td>';
            html += '</tr>';
        });
        
        html += '</table></div>';
        html += '<p class="info-text">✨ Converged in <strong>' + (result.iterations.length - 1) + '</strong> iterations</p>';
        html += '</div>';
        
        resDiv.innerHTML = html;

        graphData = { iterations: result.iterations, root: result.root, safeEval: safeEvalFn };
        window.lastResult = result;
        window.lastLatex = latex;
        window.lastData = data;
        currentStep = 0;
        
        setTimeout(function() { 
            try {
                drawGraph(graphData, 0); 
                resDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (window.MathJax) MathJax.typesetPromise();
            } catch (graphErr) { console.error('Graph initialization error:', graphErr); }
        }, 100);
        
    } catch (err) {
        console.error('Form submission error:', err);
        var errorMessage = err.message || 'An unexpected error occurred.';
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            errorMessage = 'Network error: Could not connect to server.';
        }
        resDiv.innerHTML = '<div class="error-msg">❌ ' + errorMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
        resDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});
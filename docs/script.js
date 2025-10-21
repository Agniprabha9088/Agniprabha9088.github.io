const API_URL = 'https://stock-predictor-ultra-8cyd16vsc-agnis-projects-5f4b1cf0.vercel.app';
let userId = localStorage.getItem('userId') || generateUserId();
let apiKey = localStorage.getItem('apiKey') || '';
let authenticated = sessionStorage.getItem('authenticated') === 'true';

function generateUserId() {
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', id);
    return id;
}

async function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    
    try {
        const response = await fetch(`${API_URL}/api/authenticate`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ password: password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            sessionStorage.setItem('authenticated', 'true');
            document.getElementById('passwordScreen').style.display = 'none';
            document.getElementById('mainSystem').style.display = 'block';
            document.getElementById('footer').style.display = 'block';
            
            if (apiKey) {
                document.getElementById('apiSetup').style.display = 'none';
                document.getElementById('querySection').style.display = 'block';
            }
        } else {
            document.getElementById('passwordError').textContent = '❌ Invalid password. Try again.';
            document.getElementById('passwordError').style.display = 'block';
        }
    } catch (error) {
        document.getElementById('passwordError').textContent = '❌ Error: ' + error.message;
        document.getElementById('passwordError').style.display = 'block';
    }
}

async function saveApiKey() {
    apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        alert('Please enter API key');
        return;
    }
    localStorage.setItem('apiKey', apiKey);
    
    document.getElementById('apiSetup').innerHTML = '<p>⏳ Detecting tier and capabilities...</p>';
    
    try {
        const response = await fetch(`${API_URL}/api/check-tier`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ api_key: apiKey })
        });
        
        const tierInfo = await response.json();
        
        let tierClass = `tier-${tierInfo.tier}`;
        let tierEmoji = {'free': '🆓', 'tier1': '⭐', 'tier2': '💎'}[tierInfo.tier];
        
        document.getElementById('apiSetup').innerHTML = `
            <div style="text-align: center;">
                <h2>✅ System Ready</h2>
                <div class="tier-badge ${tierClass}">${tierEmoji} ${tierInfo.tier.toUpperCase()} TIER</div>
                <div class="usage-stats">
                    <strong>Model:</strong> ${tierInfo.model}<br>
                    <strong>Requests/Min:</strong> ${tierInfo.limits.rpm}<br>
                    <strong>Tokens/Min:</strong> ${tierInfo.limits.tpm.toLocaleString()}<br>
                    <strong>Requests/Day:</strong> ${tierInfo.limits.rpd || 'Unlimited'}<br>
                    <p style="margin-top: 15px; color: #666; font-weight: bold;">
                        🎯 60+ Candlestick Patterns Enabled<br>
                        📊 50+ Technical Indicators Active<br>
                        🧠 Zero-Shot Learning Ready<br>
                        🌍 Multi-Source News Analysis<br>
                        📈 10-Year Historical Data Access
                    </p>
                </div>
                ${tierInfo.tier === 'free' ? `
                <div class="upgrade-banner">
                    <p>⚡ Upgrade for 133x faster predictions!</p>
                    <p>Pro Tier: 2000 RPM | Premium Tier: 10000 RPM</p>
                    <a href="https://ai.google.dev/pricing" target="_blank">Upgrade Now →</a>
                </div>
                ` : ''}
                <button class="btn" onclick="location.reload()">Change Key</button>
            </div>
        `;
        
        document.getElementById('querySection').style.display = 'block';
        loadHistory();
        
    } catch (error) {
        document.getElementById('apiSetup').innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${error.message}
                <br><button class="btn" style="margin-top: 10px;" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

async function predictStock() {
    const query = document.getElementById('queryInput').value.trim();
    if (!query) {
        alert('Enter your question');
        return;
    }

    document.getElementById('loading').classList.add('active');
    document.getElementById('results').classList.remove('active');

    try {
        const response = await fetch(`${API_URL}/api/predict`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                user_id: userId
            })
        });

        const data = await response.json();

        if (response.status === 429) {
            document.getElementById('results').innerHTML = `
                <div class="error">
                    <h3>⚠️ Rate Limit</h3>
                    <p><strong>Wait:</strong> ${Math.ceil(data.wait_time)}s</p>
                    <div class="upgrade-banner">
                        <a href="https://ai.google.dev/pricing" target="_blank">Upgrade for Faster Access →</a>
                    </div>
                </div>
            `;
            document.getElementById('results').classList.add('active');
            return;
        }

        if (data.error) throw new Error(data.error);

        displayResults(data);
        loadHistory();
    } catch (error) {
        document.getElementById('results').innerHTML = `
            <div class="error"><strong>Error:</strong> ${error.message}</div>
        `;
        document.getElementById('results').classList.add('active');
    } finally {
        document.getElementById('loading').classList.remove('active');
    }
}

function displayResults(data) {
    let html = `
        <div class="prediction-card">
            <div class="prediction-header">
                <div>
                    <h2>${data.company_name} (${data.symbol})</h2>
                    <span class="tier-badge tier-${data.api_tier}">${data.api_tier.toUpperCase()}</span>
                    <p style="margin-top: 10px;">
                        🎯 ${data.patterns_detected} Patterns | 📊 ${data.indicators_analyzed} Indicators
                    </p>
                </div>
                <div class="current-price">$${data.current_price.toFixed(2)}</div>
            </div>
            <p><strong>Target:</strong> ${data.prediction_time}</p>
            <p><strong>Trend:</strong> ${data.overall_trend.toUpperCase()} (Strength: ${data.trend_strength}/10)</p>
            <p><strong>Recommendation:</strong> ${data.recommendation}</p>
            <p><strong>Risk:</strong> ${data.risk_level.toUpperCase()}</p>
            
            <h3 style="margin-top: 20px;">📍 Support & Resistance</h3>
            <p><strong>Support:</strong> ${data.support_levels.map(p => `$${p.toFixed(2)}`).join(', ')}</p>
            <p><strong>Resistance:</strong> ${data.resistance_levels.map(p => `$${p.toFixed(2)}`).join(', ')}</p>
            
            <div class="risk-zones">
    `;

    const riskClasses = ['risk-free', 'low-risk', 'medium-risk', 'high-risk'];
    data.risk_zones.forEach((zone, i) => {
        html += `
            <div class="risk-zone ${riskClasses[i]}">
                <div style="font-weight: bold; font-size: 1.1em;">${zone.zone}</div>
                <div class="zone-price">$${zone.predicted_price.toFixed(2)}</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${zone.confidence}%"></div>
                </div>
                <div style="text-align: center; margin: 10px 0;"><strong>${zone.confidence}% Confidence</strong></div>
                <p style="margin: 10px 0; font-size: 0.9em;">
                    <strong>Move:</strong> ${zone.expected_move}<br>
                    <strong>Stop Loss:</strong> $${zone.stop_loss.toFixed(2)}<br>
                    <strong>Targets:</strong> $${zone.target_1.toFixed(2)} | $${zone.target_2.toFixed(2)} | $${zone.target_3.toFixed(2)}
                </p>
                <p style="font-size: 0.85em; color: #555; line-height: 1.5;">${zone.reasoning}</p>
            </div>
        `;
    });

    html += `</div>
        <div class="insights">
            <h3>🔍 Key Signals</h3>
            ${data.key_signals.map(s => `<div class="insight-item">${s}</div>`).join('')}
        </div>
    </div>`;

    if (data.chart_data) {
        html += `
            <div class="charts-section">
                <div class="chart-container"><h3>📈 Price & Moving Averages</h3><canvas id="priceChart"></canvas></div>
                <div class="chart-container"><h3>📊 RSI (14)</h3><canvas id="rsiChart"></canvas></div>
                <div class="chart-container"><h3>📉 MACD</h3><canvas id="macdChart"></canvas></div>
                <div class="chart-container"><h3>📦 Volume</h3><canvas id="volumeChart"></canvas></div>
                <div class="chart-container"><h3>🎈 Bollinger Bands</h3><canvas id="bbChart"></canvas></div>
                <div class="chart-container"><h3>⚡ Stochastic</h3><canvas id="stochChart"></canvas></div>
            </div>
        `;
    }

    document.getElementById('results').innerHTML = html;
    document.getElementById('results').classList.add('active');

    if (data.chart_data) {
        setTimeout(() => renderCharts(data.chart_data), 100);
    }
}

function renderCharts(chartData) {
    // Price Chart
    new Chart(document.getElementById('priceChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: chartData.prices.map((_, i) => i),
            datasets: [
                {label: 'Close', data: chartData.prices.map(d => d.Close), borderColor: '#667eea', tension: 0.4},
                {label: 'SMA 20', data: chartData.prices.map(d => d.SMA_20), borderColor: '#2ecc71', borderDash: [5,5], tension: 0.4},
                {label: 'SMA 50', data: chartData.prices.map(d => d.SMA_50), borderColor: '#f39c12', borderDash: [5,5], tension: 0.4}
            ]
        },
        options: {responsive: true, plugins: {legend: {display: true}}}
    });

    // RSI
    new Chart(document.getElementById('rsiChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: chartData.rsi.map((_, i) => i),
            datasets: [{label: 'RSI', data: chartData.rsi, borderColor: '#9b59b6', tension: 0.4}]
        },
        options: {responsive: true}
    });

    // MACD
    new Chart(document.getElementById('macdChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: chartData.macd.map((_, i) => i),
            datasets: [
                {label: 'MACD', data: chartData.macd.map(d => d.MACD), borderColor: '#3498db', tension: 0.4},
                {label: 'Signal', data: chartData.macd.map(d => d.MACD_Signal), borderColor: '#e74c3c', tension: 0.4}
            ]
        },
        options: {responsive: true}
    });

    // Volume
    new Chart(document.getElementById('volumeChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: chartData.volume.map((_, i) => i),
            datasets: [{label: 'Volume', data: chartData.volume, backgroundColor: 'rgba(102, 126, 234, 0.6)'}]
        },
        options: {responsive: true}
    });

    // Bollinger Bands
    new Chart(document.getElementById('bbChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: chartData.bollinger.map((_, i) => i),
            datasets: [
                {label: 'Upper', data: chartData.bollinger.map(d => d.BB_Upper_20), borderColor: '#e74c3c', fill: false},
                {label: 'Middle', data: chartData.bollinger.map(d => d.BB_Mid_20), borderColor: '#3498db', fill: false},
                {label: 'Lower', data: chartData.bollinger.map(d => d.BB_Lower_20), borderColor: '#2ecc71', fill: false}
            ]
        },
        options: {responsive: true}
    });

    // Stochastic
    new Chart(document.getElementById('stochChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: chartData.stochastic.map((_, i) => i),
            datasets: [
                {label: '%K', data: chartData.stochastic.map(d => d.Stoch_K_14), borderColor: '#9b59b6'},
                {label: '%D', data: chartData.stochastic.map(d => d.Stoch_D_14), borderColor: '#e67e22'}
            ]
        },
        options: {responsive: true}
    });
}

async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/api/history/${userId}`);
        const data = await response.json();

        if (data.history && data.history.length > 0) {
            document.getElementById('historySection').style.display = 'block';
            
            let html = '';
            data.history.slice(-15).reverse().forEach(item => {
                html += `
                    <div class="history-item" onclick='displayResults(${JSON.stringify(item.prediction).replace(/'/g, "\\'")})'> 
                        <strong>${item.query}</strong>
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            ${new Date(item.timestamp).toLocaleString()} | Patterns: ${item.prediction.patterns_detected}
                        </div>
                    </div>
                `;
            });
            document.getElementById('historyList').innerHTML = html;
        }
    } catch (error) {
        console.error('History error:', error);
    }
}

// Initialize
if (authenticated) {
    document.getElementById('passwordScreen').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    document.getElementById('footer').style.display = 'block';
    
    if (apiKey) {
        document.getElementById('apiSetup').style.display = 'none';
        document.getElementById('querySection').style.display = 'block';
        loadHistory();
    }
}

// Soil Health Assessment Application
class SoilHealthAnalyzer {
    constructor() {
        this.soilData = {
            soilParameters: {
                nutrients: {
                    N: {min: 0, max: 0.5, default: 0.15, unit: "%", optimal_min: 0.12, optimal_max: 0.25},
                    P: {min: 0, max: 80, default: 25, unit: "mg/kg", optimal_min: 20, optimal_max: 40},
                    K: {min: 0, max: 300, default: 150, unit: "mg/kg", optimal_min: 120, optimal_max: 200}
                },
                chemical: {
                    pH: {min: 3, max: 10, default: 6.5, unit: "", optimal_min: 6.0, optimal_max: 7.0},
                    EC: {min: 0, max: 3, default: 0.8, unit: "dS/m", optimal_min: 0.5, optimal_max: 1.5},
                    OC: {min: 0, max: 4, default: 1.2, unit: "%", optimal_min: 1.0, optimal_max: 3.0}
                },
                micronutrients: {
                    Zn: {min: 0, max: 5, default: 1.5, unit: "mg/kg", optimal_min: 1.0, optimal_max: 3.0},
                    Fe: {min: 0, max: 100, default: 45, unit: "mg/kg", optimal_min: 30, optimal_max: 70},
                    Cu: {min: 0, max: 8, default: 2.5, unit: "mg/kg", optimal_min: 1.5, optimal_max: 4.0},
                    Mn: {min: 0, max: 40, default: 15, unit: "mg/kg", optimal_min: 10, optimal_max: 25},
                    B: {min: 0, max: 3, default: 0.8, unit: "mg/kg", optimal_min: 0.5, optimal_max: 2.0}
                },
                environmental: {
                    Temperature: {min: 10, max: 40, default: 25, unit: "°C"},
                    Moisture: {min: 10, max: 80, default: 45, unit: "%"}
                },
                composition: {
                    Sand: {min: 10, max: 80, default: 40, unit: "%"},
                    Clay: {min: 5, max: 60, default: 30, unit: "%"},
                    Silt: {min: 5, max: 50, default: 30, unit: "%"}
                }
            },
            healthCategories: {
                Poor: {min: 0, max: 39, color: "#FF4444", description: "Requires immediate attention"},
                Fair: {min: 40, max: 59, color: "#FFA500", description: "Needs improvement"},
                Good: {min: 60, max: 79, color: "#32CD32", description: "Well-balanced soil"},
                Excellent: {min: 80, max: 100, color: "#228B22", description: "Optimal soil health"}
            },
            cropTypes: ["Wheat", "Corn", "Rice", "Cotton", "Barley"],
            sampleSoils: [
                {
                    name: "Poor Quality Soil",
                    values: {N: 0.05, P: 8, K: 60, pH: 4.5, EC: 0.3, OC: 0.3, Zn: 0.5, Fe: 15, Cu: 1.0, Mn: 5, B: 0.2, Temperature: 28, Moisture: 25, Sand: 70, Clay: 15, Silt: 15}
                },
                {
                    name: "Good Quality Soil",
                    values: {N: 0.15, P: 22, K: 140, pH: 6.2, EC: 0.8, OC: 1.1, Zn: 1.2, Fe: 35, Cu: 2.0, Mn: 12, B: 0.9, Temperature: 24, Moisture: 45, Sand: 40, Clay: 30, Silt: 30}
                },
                {
                    name: "High pH Alkaline Soil",
                    values: {N: 0.12, P: 18, K: 110, pH: 8.2, EC: 1.2, OC: 0.8, Zn: 0.8, Fe: 25, Cu: 1.5, Mn: 8, B: 0.6, Temperature: 26, Moisture: 35, Sand: 45, Clay: 35, Silt: 20}
                }
            ]
        };

        this.radarChart = null;
        this.pieChart = null;
        this.init();
    }

    init() {
        this.setupInputSynchronization();
        this.setupSampleLoading();
        this.setupNavigation();
        this.setupExport();
        
        // Wait for DOM to be fully ready before initializing charts
        setTimeout(() => {
            this.initializeCharts();
            this.updateAnalysis();
        }, 100);
    }

    setupInputSynchronization() {
        const parameters = ['N', 'P', 'K', 'pH', 'EC', 'OC', 'Zn', 'Fe', 'Cu', 'Mn', 'B', 'Temperature', 'Moisture', 'Sand', 'Clay', 'Silt'];
        
        parameters.forEach(param => {
            const rangeInput = document.getElementById(param);
            const numberInput = document.getElementById(`${param}-number`);
            
            if (rangeInput && numberInput) {
                rangeInput.addEventListener('input', () => {
                    numberInput.value = rangeInput.value;
                    this.handleCompositionChange(param, rangeInput.value);
                    this.debounceUpdate();
                });
                
                numberInput.addEventListener('input', () => {
                    rangeInput.value = numberInput.value;
                    this.handleCompositionChange(param, numberInput.value);
                    this.debounceUpdate();
                });
            }
        });
    }

    debounceUpdate() {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            this.updateAnalysis();
        }, 200);
    }

    handleCompositionChange(param, value) {
        if (['Sand', 'Clay', 'Silt'].includes(param)) {
            const sand = parseFloat(document.getElementById('Sand').value);
            const clay = parseFloat(document.getElementById('Clay').value);
            const silt = parseFloat(document.getElementById('Silt').value);
            
            const total = sand + clay + silt;
            if (total > 100) {
                const ratio = 100 / total;
                document.getElementById('Sand').value = (sand * ratio).toFixed(0);
                document.getElementById('Sand-number').value = (sand * ratio).toFixed(0);
                document.getElementById('Clay').value = (clay * ratio).toFixed(0);
                document.getElementById('Clay-number').value = (clay * ratio).toFixed(0);
                document.getElementById('Silt').value = (silt * ratio).toFixed(0);
                document.getElementById('Silt-number').value = (silt * ratio).toFixed(0);
            }
        }
    }

    setupSampleLoading() {
        const sampleButtons = document.querySelectorAll('[data-sample]');
        const loadSampleBtn = document.getElementById('loadSampleBtn');

        sampleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const sampleIndex = parseInt(button.dataset.sample);
                this.loadSampleData(sampleIndex);
            });
        });

        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadSampleData(1); // Load good quality soil as default
            });
        }
    }

    loadSampleData(index) {
        const sample = this.soilData.sampleSoils[index];
        if (!sample) return;

        // Show loading state
        document.body.style.opacity = '0.8';
        
        Object.entries(sample.values).forEach(([param, value]) => {
            const rangeInput = document.getElementById(param);
            const numberInput = document.getElementById(`${param}-number`);
            
            if (rangeInput && numberInput) {
                rangeInput.value = value;
                numberInput.value = value;
            }
        });

        // Force immediate update
        setTimeout(() => {
            this.updateAnalysis();
            document.body.style.opacity = '1';
            this.showNotification(`Loaded ${sample.name} data successfully!`, 'success');
        }, 300);
    }

    getCurrentValues() {
        const values = {};
        const parameters = ['N', 'P', 'K', 'pH', 'EC', 'OC', 'Zn', 'Fe', 'Cu', 'Mn', 'B', 'Temperature', 'Moisture', 'Sand', 'Clay', 'Silt'];
        
        parameters.forEach(param => {
            const input = document.getElementById(param);
            if (input) {
                values[param] = parseFloat(input.value) || 0;
            }
        });
        
        return values;
    }

    calculateSoilHealthScore(values) {
        let totalScore = 0;
        let parameterCount = 0;

        // Define parameter weights
        const weights = {
            N: 1.2, P: 1.2, K: 1.2, pH: 1.5, EC: 1.0, OC: 1.3,
            Zn: 0.8, Fe: 0.8, Cu: 0.6, Mn: 0.6, B: 0.6
        };

        // Calculate scores for nutrients and chemical properties
        const allParams = {
            ...this.soilData.soilParameters.nutrients,
            ...this.soilData.soilParameters.chemical,
            ...this.soilData.soilParameters.micronutrients
        };

        Object.entries(allParams).forEach(([param, config]) => {
            if (values[param] !== undefined) {
                const value = values[param];
                const weight = weights[param] || 1.0;
                let score = 0;

                if (value >= config.optimal_min && value <= config.optimal_max) {
                    score = 100; // Perfect score in optimal range
                } else if (value < config.optimal_min) {
                    const distance = config.optimal_min - value;
                    const range = config.optimal_min - config.min;
                    score = Math.max(0, 100 - (distance / range) * 60);
                } else {
                    const distance = value - config.optimal_max;
                    const range = config.max - config.optimal_max;
                    score = Math.max(0, 100 - (distance / range) * 60);
                }

                totalScore += score * weight;
                parameterCount += weight;
            }
        });

        // Environmental factors bonus/penalty
        if (values.Temperature >= 18 && values.Temperature <= 30) {
            totalScore += 5;
            parameterCount += 0.1;
        }
        if (values.Moisture >= 35 && values.Moisture <= 55) {
            totalScore += 5;
            parameterCount += 0.1;
        }

        return Math.round(totalScore / parameterCount);
    }

    getHealthCategory(score) {
        for (const [category, config] of Object.entries(this.soilData.healthCategories)) {
            if (score >= config.min && score <= config.max) {
                return { name: category, ...config };
            }
        }
        return { name: 'Poor', ...this.soilData.healthCategories.Poor };
    }

    recommendCrop(values, healthScore) {
        const crops = this.soilData.cropTypes;
        let bestCrop = crops[0];
        let confidence = 50;

        // Simple crop recommendation logic based on pH and nutrients
        if (values.pH >= 6.0 && values.pH <= 7.0) {
            if (values.N >= 0.12 && values.P >= 20 && values.K >= 120) {
                if (values.OC >= 1.0) {
                    bestCrop = 'Wheat';
                    confidence = 85;
                } else {
                    bestCrop = 'Corn';
                    confidence = 78;
                }
            } else {
                bestCrop = 'Barley';
                confidence = 65;
            }
        } else if (values.pH >= 5.5 && values.pH < 6.0) {
            bestCrop = 'Rice';
            confidence = 75;
        } else if (values.pH > 7.0 && values.pH <= 8.0) {
            bestCrop = 'Cotton';
            confidence = 70;
        } else if (values.pH < 5.5) {
            bestCrop = 'Rice';
            confidence = 60;
        } else {
            bestCrop = 'Cotton';
            confidence = 55;
        }

        // Adjust confidence based on health score
        confidence = Math.min(95, confidence + (healthScore - 50) * 0.3);
        confidence = Math.max(30, confidence);

        return { crop: bestCrop, confidence: Math.round(confidence) };
    }

    evaluateNutrients(values) {
        const nutrients = {
            Nitrogen: { value: values.N, optimal_min: 0.12, optimal_max: 0.25 },
            Phosphorus: { value: values.P, optimal_min: 20, optimal_max: 40 },
            Potassium: { value: values.K, optimal_min: 120, optimal_max: 200 },
            'pH Level': { value: values.pH, optimal_min: 6.0, optimal_max: 7.0 }
        };

        const results = [];
        Object.entries(nutrients).forEach(([name, config]) => {
            let status, icon;
            if (config.value >= config.optimal_min && config.value <= config.optimal_max) {
                status = 'good';
                icon = '✅ Adequate';
                if (name === 'pH Level') icon = '✅ Optimal';
            } else if (config.value < config.optimal_min * 0.8 || config.value > config.optimal_max * 1.2) {
                status = 'poor';
                icon = name === 'pH Level' ? '❌ Poor' : '❌ Deficient';
            } else {
                status = 'warning';
                icon = name === 'pH Level' ? '⚠️ Suboptimal' : '⚠️ Low';
            }

            results.push({ name, status, icon });
        });

        return results;
    }

    generateRecommendations(values, healthScore) {
        const recommendations = [];

        // pH recommendations
        if (values.pH < 6.0) {
            recommendations.push({
                priority: 'high-priority',
                title: 'pH Adjustment Required',
                description: 'Soil is too acidic. Apply lime (2-3 tons per hectare) to raise pH for better nutrient availability.',
                icon: 'fas fa-exclamation-circle'
            });
        } else if (values.pH > 7.5) {
            recommendations.push({
                priority: 'high-priority',
                title: 'Reduce Soil Alkalinity',
                description: 'Apply sulfur or organic matter to reduce pH. Consider gypsum application for better soil structure.',
                icon: 'fas fa-exclamation-circle'
            });
        }

        // Nutrient recommendations
        if (values.N < 0.12) {
            recommendations.push({
                priority: 'high-priority',
                title: 'Nitrogen Deficiency',
                description: 'Apply nitrogen-rich fertilizers like urea or ammonium sulfate. Consider organic options like compost.',
                icon: 'fas fa-exclamation-circle'
            });
        }

        if (values.P < 20) {
            recommendations.push({
                priority: 'medium-priority',
                title: 'Phosphorus Supplementation',
                description: 'Apply phosphorus fertilizers like DAP or rock phosphate to improve root development.',
                icon: 'fas fa-info-circle'
            });
        }

        if (values.K < 120) {
            recommendations.push({
                priority: 'medium-priority',
                title: 'Potassium Enhancement',
                description: 'Use potassium chloride or organic sources like wood ash to improve plant disease resistance.',
                icon: 'fas fa-info-circle'
            });
        }

        // Organic carbon
        if (values.OC < 1.0) {
            recommendations.push({
                priority: 'medium-priority',
                title: 'Improve Organic Matter',
                description: 'Add compost, farmyard manure, or green manure to enhance soil structure and water retention.',
                icon: 'fas fa-info-circle'
            });
        }

        // Micronutrient recommendations
        const micronutrientDeficient = ['Zn', 'Fe', 'Cu', 'Mn', 'B'].filter(nutrient => {
            const config = this.soilData.soilParameters.micronutrients[nutrient];
            return values[nutrient] < config.optimal_min;
        });

        if (micronutrientDeficient.length > 0) {
            recommendations.push({
                priority: 'low-priority',
                title: 'Micronutrient Deficiency',
                description: `Apply micronutrient mix containing ${micronutrientDeficient.join(', ')} through foliar spray or soil application.`,
                icon: 'fas fa-lightbulb'
            });
        }

        // General recommendations based on health score
        if (healthScore >= 80) {
            recommendations.push({
                priority: 'low-priority',
                title: 'Maintain Excellence',
                description: 'Continue current soil management practices. Regular soil testing recommended every 2-3 years.',
                icon: 'fas fa-check-circle'
            });
        } else if (recommendations.length === 0) {
            recommendations.push({
                priority: 'medium-priority',
                title: 'Regular Monitoring',
                description: 'Consider regular soil testing and gradual improvement of organic matter content.',
                icon: 'fas fa-info-circle'
            });
        }

        return recommendations;
    }

    updateAnalysis() {
        const values = this.getCurrentValues();
        const healthScore = this.calculateSoilHealthScore(values);
        const healthCategory = this.getHealthCategory(healthScore);
        const cropRecommendation = this.recommendCrop(values, healthScore);
        const nutrientStatus = this.evaluateNutrients(values);
        const recommendations = this.generateRecommendations(values, healthScore);

        // Update health score display
        const healthScoreElement = document.getElementById('healthScore');
        if (healthScoreElement) {
            healthScoreElement.textContent = healthScore;
        }
        
        const progressBar = document.getElementById('healthProgress');
        if (progressBar) {
            progressBar.style.width = `${healthScore}%`;
        }
        
        const categoryElement = document.getElementById('healthCategory');
        const descriptionElement = document.getElementById('healthDescription');
        if (categoryElement && descriptionElement) {
            categoryElement.textContent = healthCategory.name;
            categoryElement.style.color = healthCategory.color;
            descriptionElement.textContent = healthCategory.description;
        }

        // Update crop recommendation
        const cropElement = document.getElementById('recommendedCrop');
        const confidenceElement = document.getElementById('cropConfidence');
        if (cropElement && confidenceElement) {
            cropElement.textContent = cropRecommendation.crop;
            confidenceElement.textContent = `${cropRecommendation.confidence}%`;
        }

        // Update nutrient indicators
        const nutrientContainer = document.getElementById('nutrientIndicators');
        if (nutrientContainer) {
            nutrientContainer.innerHTML = nutrientStatus.map(nutrient => `
                <div class="nutrient-indicator">
                    <span class="nutrient-name">${nutrient.name}:</span>
                    <span class="nutrient-status ${nutrient.status}">${nutrient.icon}</span>
                </div>
            `).join('');
        }

        // Update recommendations
        const recommendationsContainer = document.getElementById('recommendationsList');
        if (recommendationsContainer) {
            recommendationsContainer.innerHTML = recommendations.map(rec => `
                <div class="recommendation-item ${rec.priority}">
                    <div class="recommendation-icon">
                        <i class="${rec.icon}"></i>
                    </div>
                    <div class="recommendation-content">
                        <h4>${rec.title}</h4>
                        <p>${rec.description}</p>
                    </div>
                </div>
            `).join('');
        }

        // Update pH indicator
        this.updatePHIndicator(values.pH);

        // Update charts
        this.updateCharts(values);
    }

    updatePHIndicator(pH) {
        const marker = document.getElementById('phMarker');
        const phValue = document.getElementById('currentPH');
        
        if (marker && phValue) {
            const position = ((pH - 3) / 7) * 100;
            marker.style.left = `${Math.max(0, Math.min(100, position))}%`;
            phValue.textContent = pH.toFixed(1);
        }
    }

    initializeCharts() {
        // Initialize Radar Chart
        const radarCtx = document.getElementById('radarChart');
        if (radarCtx && !this.radarChart) {
            this.radarChart = new Chart(radarCtx, {
                type: 'radar',
                data: {
                    labels: ['Nitrogen', 'Phosphorus', 'Potassium', 'pH', 'Organic Carbon', 'Zinc', 'Iron'],
                    datasets: [{
                        label: 'Current Levels',
                        data: [50, 60, 70, 80, 60, 70, 80],
                        backgroundColor: 'rgba(31, 184, 198, 0.2)',
                        borderColor: '#1FB8CD',
                        borderWidth: 2,
                        pointBackgroundColor: '#1FB8CD'
                    }, {
                        label: 'Optimal Range',
                        data: [80, 80, 80, 90, 85, 75, 85],
                        backgroundColor: 'rgba(50, 205, 50, 0.1)',
                        borderColor: '#32CD32',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointBackgroundColor: '#32CD32'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: {
                                stepSize: 20
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Initialize Pie Chart
        const pieCtx = document.getElementById('pieChart');
        if (pieCtx && !this.pieChart) {
            this.pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: ['Sand', 'Clay', 'Silt'],
                    datasets: [{
                        data: [40, 30, 30],
                        backgroundColor: ['#FFC185', '#B4413C', '#5D878F']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    updateCharts(values) {
        if (this.radarChart) {
            // Calculate normalized values (0-100 scale)
            const normalizedData = [
                (values.N / 0.25) * 100,
                (values.P / 40) * 100,
                (values.K / 200) * 100,
                ((values.pH - 3) / 7) * 100,
                (values.OC / 3) * 100,
                (values.Zn / 3) * 100,
                (values.Fe / 70) * 100
            ].map(val => Math.min(100, Math.max(0, val)));

            this.radarChart.data.datasets[0].data = normalizedData;
            this.radarChart.update('none');
        }

        if (this.pieChart) {
            this.pieChart.data.datasets[0].data = [values.Sand, values.Clay, values.Silt];
            this.pieChart.update('none');
        }
    }

    setupNavigation() {
        // Smooth scrolling with offset for fixed navbar
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    const offsetTop = target.offsetTop - 80; // Account for navbar height
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Active navigation highlighting
        const throttledScroll = this.throttle(() => {
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-links a');
            
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 120;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }, 100);

        window.addEventListener('scroll', throttledScroll);
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    setupExport() {
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                try {
                    const values = this.getCurrentValues();
                    const healthScore = this.calculateSoilHealthScore(values);
                    const healthCategory = this.getHealthCategory(healthScore);
                    const cropRecommendation = this.recommendCrop(values, healthScore);
                    const recommendations = this.generateRecommendations(values, healthScore);
                    
                    const exportData = {
                        timestamp: new Date().toLocaleString(),
                        soilParameters: values,
                        analysis: {
                            healthScore,
                            category: healthCategory.name,
                            categoryDescription: healthCategory.description,
                            recommendedCrop: cropRecommendation.crop,
                            confidence: cropRecommendation.confidence
                        },
                        recommendations: recommendations.map(rec => ({
                            priority: rec.priority,
                            title: rec.title,
                            description: rec.description
                        }))
                    };

                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    
                    const exportFileDefaultName = `soil_analysis_${new Date().toISOString().split('T')[0]}.json`;
                    
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();

                    this.showNotification('Analysis results exported successfully!', 'success');
                } catch (error) {
                    console.error('Export failed:', error);
                    this.showNotification('Export failed. Please try again.', 'error');
                }
            });
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Styling
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: var(--color-surface); 
            border: 1px solid var(--color-border); border-radius: var(--radius-base); 
            box-shadow: var(--shadow-lg); padding: var(--space-16); max-width: 400px; 
            z-index: 1000; transform: translateX(100%); transition: transform 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.borderLeft = '4px solid var(--color-success)';
        } else if (type === 'error') {
            notification.style.borderLeft = '4px solid var(--color-error)';
        }

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SoilHealthAnalyzer();
});

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification-content { 
        display: flex; align-items: center; justify-content: space-between; gap: var(--space-12); 
    }
    .notification-close { 
        background: none; border: none; font-size: 1.2rem; cursor: pointer; 
        color: var(--color-text-secondary); padding: 0; width: 20px; height: 20px; 
        display: flex; align-items: center; justify-content: center; 
    }
    .notification-close:hover { color: var(--color-text); }
    .notification-message { font-size: var(--font-size-sm); color: var(--color-text); }
`;
document.head.appendChild(style);
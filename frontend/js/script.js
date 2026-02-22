/**
 * LaptopGenius - Smart Laptop Price Predictor
 * Frontend JavaScript for API communication and UI handling
 */

// API Base URL
const API_BASE = '';

// DOM Elements
const elements = {
    // Form elements
    company: document.getElementById('company'),
    laptopType: document.getElementById('laptopType'),
    screenSize: document.getElementById('screenSize'),
    resolution: document.getElementById('resolution'),
    touchscreen: document.getElementById('touchscreen'),
    ips: document.getElementById('ips'),
    cpu: document.getElementById('cpu'),
    gpu: document.getElementById('gpu'),
    ram: document.getElementById('ram'),
    os: document.getElementById('os'),
    hdd: document.getElementById('hdd'),
    ssd: document.getElementById('ssd'),
    weight: document.getElementById('weight'),
    
    // Buttons
    predictBtn: document.getElementById('predictBtn'),
    resetBtn: document.getElementById('resetBtn'),
    
    // Result panel elements
    resultPlaceholder: document.getElementById('resultPlaceholder'),
    resultContent: document.getElementById('resultContent'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    priceValue: document.getElementById('priceValue'),
    resultDetails: document.getElementById('resultDetails'),
    errorMessage: document.getElementById('errorMessage'),
    
    // Navigation
    navMenu: document.getElementById('navMenu'),
    navLinks: document.querySelector('.nav-links')
};

// State
let formOptions = null;

/**
 * Initialize the application
 */
async function init() {
    try {
        await loadFormOptions();
        setupEventListeners();
        setupSmoothScroll();
    } catch (error) {
        console.error('Failed to initialize:', error);
        showError('Failed to load form options. Please refresh the page.');
    }
}

/**
 * Load dropdown options from API
 */
async function loadFormOptions() {
    const response = await fetch(`${API_BASE}/api/options`);
    
    if (!response.ok) {
        throw new Error('Failed to load options');
    }
    
    formOptions = await response.json();
    populateDropdowns();
}

/**
 * Populate all dropdown menus with options
 */
function populateDropdowns() {
    // Companies/Brands
    populateSelect(elements.company, formOptions.companies, 'Select Brand');
    
    // Laptop Types
    populateSelect(elements.laptopType, formOptions.laptop_types, 'Select Type');
    
    // Screen Sizes (with labels and values)
    populateSelectWithLabels(elements.screenSize, formOptions.screen_sizes, 'Select Screen Size');
    
    // Resolutions
    populateSelect(elements.resolution, formOptions.resolutions, 'Select Resolution');
    
    // CPUs
    populateSelect(elements.cpu, formOptions.cpus, 'Select CPU');
    
    // GPUs
    populateSelect(elements.gpu, formOptions.gpus, 'Select GPU');
    
    // RAM
    populateSelectWithUnit(elements.ram, formOptions.ram, 'Select RAM', ' GB');
    
    // OS
    populateSelect(elements.os, formOptions.os_options, 'Select OS');
    
    // HDD
    populateSelectWithStorage(elements.hdd, formOptions.hdd, 'Select HDD');
    
    // SSD
    populateSelectWithStorage(elements.ssd, formOptions.ssd, 'Select SSD');
    
    // Weights (with labels and values)
    populateSelectWithLabels(elements.weight, formOptions.weights, 'Select Weight');
}

/**
 * Populate a select element with simple values
 */
function populateSelect(selectElement, options, placeholder) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        selectElement.appendChild(opt);
    });
}

/**
 * Populate a select element with label-value pairs
 */
function populateSelectWithLabels(selectElement, options, placeholder) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        selectElement.appendChild(opt);
    });
}

/**
 * Populate a select element with unit suffix
 */
function populateSelectWithUnit(selectElement, options, placeholder, unit) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = `${option}${unit}`;
        selectElement.appendChild(opt);
    });
}

/**
 * Populate storage dropdowns (HDD/SSD)
 */
function populateSelectWithStorage(selectElement, options, placeholder) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        if (option === 0) {
            opt.textContent = 'None';
        } else if (option >= 1024) {
            opt.textContent = `${option / 1024} TB`;
        } else {
            opt.textContent = `${option} GB`;
        }
        selectElement.appendChild(opt);
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Predict button
    elements.predictBtn.addEventListener('click', handlePredict);
    
    // Reset button
    elements.resetBtn.addEventListener('click', handleReset);
    
    // Mobile navigation toggle
    if (elements.navMenu) {
        elements.navMenu.addEventListener('click', toggleMobileNav);
    }
    
    // Keyboard support for form
    document.getElementById('predictorForm').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handlePredict();
        }
    });
}

/**
 * Setup smooth scrolling for navigation links
 */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80; // Account for fixed navbar
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Toggle mobile navigation
 */
function toggleMobileNav() {
    if (elements.navLinks) {
        elements.navLinks.classList.toggle('active');
    }
}

/**
 * Handle prediction request
 */
async function handlePredict() {
    // Validate form
    if (!validateForm()) {
        showError('Please fill in all required fields.');
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        // Prepare request data
        const data = {
            company: elements.company.value,
            laptop_type: elements.laptopType.value,
            ram: parseInt(elements.ram.value),
            weight: parseFloat(elements.weight.value),
            touchscreen: elements.touchscreen.value,
            ips: elements.ips.value,
            screen_size: parseFloat(elements.screenSize.value),
            resolution: elements.resolution.value,
            cpu: elements.cpu.value,
            hdd: parseInt(elements.hdd.value),
            ssd: parseInt(elements.ssd.value),
            gpu: elements.gpu.value,
            os: elements.os.value
        };
        
        // Make API request
        const response = await fetch(`${API_BASE}/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Prediction failed');
        }
        
        // Show result
        showResult(result);
        
    } catch (error) {
        console.error('Prediction error:', error);
        showError(error.message || 'Failed to get prediction. Please try again.');
    }
}

/**
 * Validate form inputs
 */
function validateForm() {
    const requiredFields = [
        elements.company,
        elements.laptopType,
        elements.screenSize,
        elements.resolution,
        elements.cpu,
        elements.gpu,
        elements.ram,
        elements.os,
        elements.hdd,
        elements.ssd,
        elements.weight
    ];
    
    for (const field of requiredFields) {
        if (!field.value || field.value === '') {
            field.focus();
            field.style.borderColor = '#ef4444';
            setTimeout(() => {
                field.style.borderColor = '';
            }, 2000);
            return false;
        }
    }
    
    return true;
}

/**
 * Show loading state
 */
function showLoading() {
    elements.resultPlaceholder.classList.add('hidden');
    elements.resultContent.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.loadingState.classList.remove('hidden');
}

/**
 * Show prediction result
 */
function showResult(result) {
    elements.resultPlaceholder.classList.add('hidden');
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.resultContent.classList.remove('hidden');
    
    // Animate price counter
    animatePrice(result.predicted_price);
    
    // Populate configuration details
    const config = result.configuration;
    elements.resultDetails.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Brand</span>
            <span class="detail-value">${config.brand}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Type</span>
            <span class="detail-value">${config.type}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Display</span>
            <span class="detail-value">${config.screen_size} • ${config.resolution}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Processor</span>
            <span class="detail-value">${config.cpu}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">RAM</span>
            <span class="detail-value">${config.ram}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Storage</span>
            <span class="detail-value">${config.hdd !== 'None' ? 'HDD: ' + config.hdd : ''} ${config.ssd !== 'None' ? 'SSD: ' + config.ssd : ''}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Graphics</span>
            <span class="detail-value">${config.gpu}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Features</span>
            <span class="detail-value">${config.touchscreen === 'Yes' ? 'Touchscreen' : ''}${config.ips === 'Yes' ? (config.touchscreen === 'Yes' ? ', IPS' : 'IPS') : ''}</span>
        </div>
    `;
    
    // Scroll to result on mobile
    if (window.innerWidth < 1024) {
        elements.resultContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Animate price counter
 */
function animatePrice(targetPrice) {
    const duration = 1000; // Animation duration in ms
    const startTime = performance.now();
    const startPrice = 0;
    
    function updatePrice(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentPrice = Math.floor(startPrice + (targetPrice - startPrice) * easeOutQuart);
        
        elements.priceValue.textContent = currentPrice.toLocaleString('en-IN');
        
        if (progress < 1) {
            requestAnimationFrame(updatePrice);
        }
    }
    
    requestAnimationFrame(updatePrice);
}

/**
 * Show error state
 */
function showError(message) {
    elements.resultPlaceholder.classList.add('hidden');
    elements.loadingState.classList.add('hidden');
    elements.resultContent.classList.add('hidden');
    elements.errorState.classList.remove('hidden');
    elements.errorMessage.textContent = message;
}

/**
 * Reset form and result panel
 */
function handleReset() {
    // Reset all form fields
    const selects = document.querySelectorAll('#predictorForm select');
    selects.forEach(select => {
        select.selectedIndex = 0;
        select.style.borderColor = '';
    });
    
    // Reset touchscreen and IPS to "No"
    elements.touchscreen.value = 'No';
    elements.ips.value = 'No';
    
    // Reset result panel
    elements.resultPlaceholder.classList.remove('hidden');
    elements.resultContent.classList.add('hidden');
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
}

/**
 * Update active navigation link based on scroll position
 */
function updateActiveNavLink() {
    const sections = ['home', 'predictor', 'features', 'about'];
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        }
    });
}

// Update active nav on scroll
window.addEventListener('scroll', updateActiveNavLink);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

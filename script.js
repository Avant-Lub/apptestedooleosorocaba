let currentStep = 1;
const formInputs = {
    clientName: '',
    clientPhone: '',
    licensePlate: '',
    brand: '',
    model: '',
    displacement: '',
    yearManufacture: '',
    yearModel: '',
    serviceTypes: [],
    oilType: 'Indique-me a melhor opção'
};

// Atualiza os inputs no objeto formInputs em tempo real
document.getElementById('clientName').addEventListener('input', function() {
    formInputs.clientName = this.value;
});

document.getElementById('clientPhone').addEventListener('input', function(e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    formInputs.clientPhone = e.target.value;
});

document.getElementById('licensePlate').addEventListener('input', function(e) {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (this.value.length > 3 && !this.value.includes('-')) {
        this.value = this.value.slice(0, 3) + '-' + this.value.slice(3);
    }
    formInputs.licensePlate = this.value;
    
    const manualFields = ['brand', 'model', 'displacement', 'yearManufacture', 'yearModel'];
    manualFields.forEach(id => {
        const el = document.getElementById(id);
        el.disabled = this.value.length >= 7;
        el.style.opacity = this.value.length >= 7 ? '0.5' : '1';
    });
});

// Captura campos manuais
['brand', 'model', 'displacement', 'yearManufacture', 'yearModel'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        formInputs[id] = this.value;
    });
});

function nextStep(step) {
    // Validação Passo 1
    if (currentStep === 1) {
        if (!formInputs.clientName || formInputs.clientName.trim().length < 3) {
            showToast("Por favor, informe seu nome completo.");
            return;
        }
        if (!formInputs.clientPhone || formInputs.clientPhone.length < 14) {
            showToast("Informe um WhatsApp válido.");
            return;
        }
    }

    // Validação Passo 2
    if (currentStep === 2) {
        const hasPlate = formInputs.licensePlate && formInputs.licensePlate.length >= 7;
        const hasManual = formInputs.brand && formInputs.model;
        if (!hasPlate && !hasManual) {
            showToast("Informe a placa ou os dados do veículo.");
            return;
        }
    }

    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    updateProgress();
    window.scrollTo(0, 0);
}

function prevStep(step) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    updateProgress();
}

function updateProgress() {
    const fill = document.getElementById('progressFill');
    fill.style.width = (currentStep / 3 * 100) + '%';
}

function toggleService(el) {
    const val = el.getAttribute('data-value');
    el.classList.toggle('selected');
    
    if (el.classList.contains('selected')) {
        formInputs.serviceTypes.push(val);
    } else {
        formInputs.serviceTypes = formInputs.serviceTypes.filter(s => s !== val);
    }

    document.getElementById('oilPreference').style.display = 
        formInputs.serviceTypes.includes('oil') ? 'block' : 'none';
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}

function showSummary() {
    if (formInputs.serviceTypes.length === 0) {
        showToast("Selecione ao menos um serviço.");
        return;
    }

    document.getElementById('sumName').textContent = formInputs.clientName;
    document.getElementById('sumVehicle').textContent = formInputs.licensePlate || (formInputs.brand + ' ' + formInputs.model);
    
    const serviceMap = {
        oil: 'Óleo', transmission: 'Câmbio', arrefecimento: 'Arrefecimento',
        'disco-dianteiras': 'Freio Diant.', 'disco-traseiras': 'Freio Tras.', 'bieletas-dianteiras': 'Bieletas'
    };
    document.getElementById('sumServices').textContent = formInputs.serviceTypes.map(s => serviceMap[s]).join(', ');
    
    document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function sendWhatsApp() {
    const serviceMap = {
        oil: 'Troca de Óleo + Filtros',
        transmission: 'Fluído de Câmbio Automático',
        arrefecimento: 'Sistema de Arrefecimento',
        'disco-dianteiras': 'Disco/Pastilhas Dianteiras',
        'disco-traseiras': 'Disco/Pastilhas Traseiras',
        'bieletas-dianteiras': 'Bieletas Dianteiras'
    };

    let msg = `🚗 *NOVO ORÇAMENTO - Do Óleo Sorocaba*\n\n`;
    msg += `👤 *Cliente:* ${formInputs.clientName}\n`;
    msg += `📱 *WhatsApp:* ${formInputs.clientPhone}\n\n`;
    
    msg += `*VEÍCULO:*\n`;
    if (formInputs.licensePlate) {
        msg += `• Placa: ${formInputs.licensePlate}\n`;
    } else {
        msg += `• ${formInputs.brand} ${formInputs.model}\n`;
        msg += `• Motor: ${formInputs.displacement}\n`;
        msg += `• Ano: ${formInputs.yearManufacture}/${formInputs.yearModel}\n`;
    }

    msg += `\n*SERVIÇOS:* \n`;
    formInputs.serviceTypes.forEach(s => {
        msg += `✅ ${serviceMap[s]}\n`;
    });

    if (formInputs.serviceTypes.includes('oil')) {
        msg += `\n*PREFERÊNCIA DE ÓLEO:* ${document.getElementById('oilType').value}\n`;
    }

    msg += `\n_Enviado via App Orçamento Inteligente_`;

    const url = `https://wa.me/5515998473981?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

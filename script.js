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
    oilType: 'Indique-me a melhor opção',
    brakeType: ''
};

// Máscara de Telefone
document.getElementById('clientPhone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    let formatted = '';
    if (value.length > 0) {
        formatted = '(' + value.slice(0, 2);
        if (value.length > 2) {
            formatted += ') ' + value.slice(2, 7);
            if (value.length > 7) {
                formatted += '-' + value.slice(7, 11);
            }
        }
    }
    e.target.value = formatted;
    formInputs.clientPhone = formatted;
});

// Máscara de Placa
document.getElementById('licensePlate').addEventListener('input', function(e) {
    let value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    
    if (value.length > 3) {
        value = value.slice(0, 3) + '-' + value.slice(3);
    }
    this.value = value;
    formInputs.licensePlate = value;
});

// Captura de inputs com conversão para maiúsculas onde necessário
['clientName', 'brand', 'model', 'displacement', 'yearManufacture', 'yearModel'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        let value = this.value;
        if (['brand', 'model', 'displacement'].includes(id)) {
            value = value.toUpperCase();
            this.value = value;
        }
        formInputs[id] = value;
    });
});

document.getElementById('brakeType').addEventListener('change', function() {
    formInputs.brakeType = this.value;
});

function openExternal(url) {
    if (confirm("Você está saindo para um site externo (Carros na Web/Fipe). Estes sites podem conter anúncios. Deseja continuar?")) {
        window.open(url, '_blank');
    }
}

function nextStep(step) {
    // Passo 1 é opcional
    
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

    // Lógica de Freio Traseiro
    document.getElementById('brakeTypeSection').style.display = 
        formInputs.serviceTypes.includes('disco-traseiras') ? 'block' : 'none';

    // Lógica de Óleo
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
    
    if (formInputs.serviceTypes.includes('disco-traseiras') && !formInputs.brakeType) {
        showToast("Por favor, informe o tipo de freio de mão.");
        return;
    }

    document.getElementById('sumName').textContent = formInputs.clientName || "Não informado";
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
    msg += `👤 *Cliente:* ${formInputs.clientName || 'Não informado'}\n`;
    msg += `📱 *WhatsApp:* ${formInputs.clientPhone || 'Não informado'}\n\n`;
    
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

    if (formInputs.serviceTypes.includes('disco-traseiras')) {
        msg += `• Freio de Mão: ${formInputs.brakeType}\n`;
    }

    if (formInputs.serviceTypes.includes('oil')) {
        msg += `\n*PREFERÊNCIA DE ÓLEO:* ${document.getElementById('oilType').value}\n`;
    }

    msg += `\n_Enviado via App Orçamento Inteligente_`;

    const url = `https://wa.me/5515998473981?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

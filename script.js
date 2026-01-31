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

// --- CONFIGURAÇÃO APIBRASIL ---
const CHANNEL_NAME = "SEU_CHANNEL_NAME"; 
const BEARER_TOKEN = "SEU_TOKEN_BEARER"; 
// ------------------------------

let isPlateValid = false; 

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

// Máscara de Placa e Validação
document.getElementById('licensePlate').addEventListener('input', async function(e) {
    let value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    
    let displayValue = value;
    if (value.length > 3) {
        const isOldPlate = value.length >= 5 && !isNaN(value[4]);
        if (isOldPlate) {
            displayValue = value.slice(0, 3) + '-' + value.slice(3);
        }
    }
    
    this.value = displayValue;
    formInputs.licensePlate = value;
    
    isPlateValid = false;
    updatePlateStatus("", "");
    
    // Se a placa for apagada ou alterada, mostra os campos manuais novamente
    toggleManualFields(true);

    if (value.length === 7) {
        await validarEConsultarPlaca(value);
    }
});

function toggleManualFields(show) {
    const manualFields = document.getElementById('manualVehicleFields');
    manualFields.style.display = show ? 'block' : 'none';
}

function updatePlateStatus(msg, color) {
    const statusDiv = document.getElementById('plateStatus');
    const plateInput = document.getElementById('licensePlate');
    statusDiv.textContent = msg;
    statusDiv.style.color = color;
    plateInput.style.borderColor = color || "#ddd";
}

async function validarEConsultarPlaca(placa) {
    const regexAntiga = /^[A-Z]{3}[0-9]{4}$/;
    const regexMercosul = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;

    if (!regexAntiga.test(placa) && !regexMercosul.test(placa)) {
        updatePlateStatus("Formato de placa inválido!", "#dc3545");
        isPlateValid = false;
        return;
    }

    updatePlateStatus("Consultando...", "#007bff");

    try {
        const response = await fetch(`https://api.brasilaberto.net/v1/vehicles/${placa}`, {
            method: 'GET',
            headers: {
                'Channel-Name': CHANNEL_NAME,
                'Authorization': `Bearer ${BEARER_TOKEN}`
            }
        });

        const data = await response.json();

        if (response.ok && data.result) {
            const v = data.result;
            
            // Preenche campos
            document.getElementById('brand').value = v.brand || '';
            document.getElementById('model').value = v.model || '';
            document.getElementById('displacement').value = v.engine || '';
            document.getElementById('yearManufacture').value = v.yearManufacture || '';
            document.getElementById('yearModel').value = v.yearModel || '';

            // Atualiza objeto
            formInputs.brand = v.brand || '';
            formInputs.model = v.model || '';
            formInputs.displacement = v.engine || '';
            formInputs.yearManufacture = v.yearManufacture || '';
            formInputs.yearModel = v.yearModel || '';

            updatePlateStatus("Veículo identificado!", "#28a745");
            isPlateValid = true;
            toggleManualFields(false); // Oculta campos se deu certo
        } else {
            // Consulta Silenciosa: Não informa erro, apenas mantém campos manuais
            updatePlateStatus("", "");
            isPlateValid = false;
            toggleManualFields(true);
        }
    } catch (error) {
        updatePlateStatus("", "");
        isPlateValid = false;
        toggleManualFields(true);
    }
}

// Captura de inputs manuais
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
    window.open(url, '_blank');
}

function nextStep(step) {
    if (currentStep === 2) {
        const plateValue = formInputs.licensePlate;
        
        // Se tem algo na placa mas não é válido (7 chars + formato)
        if (plateValue.length > 0 && !isPlateValid) {
            showToast("Por favor, insira uma placa válida.");
            return;
        }

        // Se a placa não foi preenchida ou não foi encontrada, exige Marca e Modelo
        if (!isPlateValid) {
            if (!formInputs.brand || !formInputs.model) {
                showToast("Informe a Marca e o Modelo do veículo.");
                return;
            }
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

    document.getElementById('brakeTypeSection').style.display = 
        formInputs.serviceTypes.includes('disco-traseiras') ? 'block' : 'none';

    document.getElementById('oilPreference').style.display = 
        formInputs.serviceTypes.includes('oil') ? 'block' : 'none';
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    t.style.opacity = '1';
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.style.display = 'none', 500);
    }, 3000);
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
    let vehicleText = formInputs.licensePlate ? `[${formInputs.licensePlate}] ` : "";
    vehicleText += `${formInputs.brand} ${formInputs.model}`;
    document.getElementById('sumVehicle').textContent = vehicleText || "Não informado";
    
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
    msg += `• Placa: ${formInputs.licensePlate || 'Não informada'}\n`;
    msg += `• Marca/Mod: ${formInputs.brand} ${formInputs.model}\n`;
    msg += `• Motor: ${formInputs.displacement || 'N/A'}\n`;
    msg += `• Ano: ${formInputs.yearManufacture || ''}/${formInputs.yearModel || ''}\n`;

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

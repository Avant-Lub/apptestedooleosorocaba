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

// Máscara de Placa e Lógica de Desativação
document.getElementById('licensePlate').addEventListener('input', function(e) {
    let value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    
    if (value.length > 3) {
        value = value.slice(0, 3) + '-' + value.slice(3);
    }
    this.value = value;
    formInputs.licensePlate = value;

    // Se a placa tiver 7 caracteres (formato completo), desativa campos manuais
    const isPlateComplete = value.replace('-', '').length === 7;
    const manualFields = ['brand', 'model', 'displacement', 'yearManufacture', 'yearModel'];
    
    manualFields.forEach(id => {
        const el = document.getElementById(id);
        el.disabled = isPlateComplete;
        if (isPlateComplete) {
            el.value = ''; // Limpa o campo se estiver desativado
            formInputs[id] = '';
        }
    });
});

// Captura de inputs
['clientName', 'brand', 'model', 'displacement', 'yearManufacture', 'yearModel'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        let value = this.value.toUpperCase();
        if (['brand', 'model', 'displacement'].includes(id)) {
            value = value.toUpperCase();
            this.value = value;
        } else if (id === 'yearManufacture' || id === 'yearModel') {
            value = value.replace(/\D/g, '').slice(0, 4);
            this.value = value;
        }
        formInputs[id] = value;
    });
});

document.getElementById('brakeType').addEventListener('change', function() {
    formInputs.brakeType = this.value;
});

function openExternal(url) {
    if (confirm("Você está saindo para um site externo. Estes sites podem conter anúncios. Deseja continuar?")) {
        window.open(url, '_blank');
    }
}

function shareApp() {
    const shareData = {
        title: 'Do Óleo Sorocaba - Orçamento Inteligente',
        text: 'Solicite seu orçamento de troca de óleo e manutenção de forma rápida!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(console.error);
    } else {
        // Fallback para copiar link
        navigator.clipboard.writeText(window.location.href);
        showToast("Link copiado para a área de transferência!");
    }
}

function validateYears() {
    const isPlateComplete = formInputs.licensePlate.replace('-', '').length === 7;
    if (isPlateComplete) return true; // Ignora validação se tiver placa

    const fab = parseInt(formInputs.yearManufacture);
    const mod = parseInt(formInputs.yearModel);
    
    if (formInputs.yearManufacture && (fab < 1901 || fab > 2099)) {
        showToast("Ano de Fabricação deve ser entre 1901 e 2099.");
        return false;
    }
    if (formInputs.yearModel && (mod < 1901 || mod > 2099)) {
        showToast("Ano do Modelo deve ser entre 1901 e 2099.");
        return false;
    }
    return true;
}
// Sempre que atualizar os valores
//function atualizarResumoDados() {
    // Supondo que você tenha essas variáveis
 //   document.getElementById('sumName').textContent = nomeCliente.toUpperCase();
//    document.getElementById('sumVehicle').textContent = modeloVeiculo.toUpperCase();
//    document.getElementById('sumServices').textContent = servicosSelecionados.toUpperCase();
// }

function nextStep(step) {
    if (currentStep === 2) {
        const hasPlate = formInputs.licensePlate.replace('-', '').length === 7;
        const hasManual = formInputs.brand && formInputs.model;
        
        if (!hasPlate && !hasManual) {
            showToast("Informe a placa ou os dados do veículo.");
            return;
        }
        
        if (!validateYears()) return;
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
    setTimeout(() => t.style.display = 'none', 3000);
}

function resetApp() {
    // Limpa o objeto de dados
    Object.keys(formInputs).forEach(key => {
        if (Array.isArray(formInputs[key])) formInputs[key] = [];
        else if (key === 'oilType') formInputs[key] = 'Indique-me a melhor opção';
        else formInputs[key] = '';
    });

    // Limpa todos os inputs da tela
    document.querySelectorAll('input').forEach(input => {
        input.value = '';
        input.disabled = false;
    });
    document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Esconde seções condicionais
    document.getElementById('brakeTypeSection').style.display = 'none';
    document.getElementById('oilPreference').style.display = 'none';

    // Volta para o passo 1
    document.querySelectorAll('.card').forEach(card => card.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
    currentStep = 1;
    updateProgress();
    closeModal();
}

function atualizarResumoDados() {
    // Supondo que você tenha essas variáveis
    document.getElementById('sumName').textContent = function atualizarResumoDados() {
    // Supondo que você tenha essas variáveis
    document.getElementById('sumName').textContent = clientname.toUpperCase();
  //  document.getElementById('sumVehicle').textContent = modeloVeiculo.toUpperCase();
  //  document.getElementById('sumServices').textContent = servicosSelecionados.toUpperCase();
}
lientname.toUpperCase();
    document.getElementById('sumVehicle').textContent = modeloVeiculo.toUpperCase();
    document.getElementById('sumServices').textContent = servicosSelecionados.toUpperCase();
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
    if (formInputs.licensePlate.replace('-', '').length === 7) {
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

    // Reinicia o app após um pequeno delay para garantir que o link abriu
    setTimeout(resetApp, 1000);
}

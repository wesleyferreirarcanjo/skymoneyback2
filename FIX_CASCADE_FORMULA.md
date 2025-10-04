# 🔧 Fix: Fórmula de Cascata por Posição

## ✅ ENTENDIMENTO CORRETO DA DOCUMENTAÇÃO

A cascata **NÃO** vai para "próximo que não completou", mas sim para **posições específicas calculadas**!

---

## 📐 Fórmula da Cascata

### **Regra:**
```
Cada 3 doadores → 1 receptor
```

### **Fórmula:**
```typescript
receiver_position = Math.floor((donor_position - 1) / 3) + 34
```

### **Exemplos:**

| Doador | Posição Doador | Cálculo | Receptor | Posição Receptor |
|--------|---------------|---------|----------|-----------------|
| #001   | 1             | (1-1)/3 + 34 = 0 + 34 | #034 | 34 |
| #002   | 2             | (2-1)/3 + 34 = 0 + 34 | #034 | 34 |
| #003   | 3             | (3-1)/3 + 34 = 0 + 34 | #034 | 34 |
| #004   | 4             | (4-1)/3 + 34 = 1 + 34 | #035 | 35 |
| #005   | 5             | (5-1)/3 + 34 = 1 + 34 | #035 | 35 |
| #006   | 6             | (6-1)/3 + 34 = 1 + 34 | #035 | 35 |
| #007   | 7             | (7-1)/3 + 34 = 2 + 34 | #036 | 36 |
| #008   | 8             | (8-1)/3 + 34 = 2 + 34 | #036 | 36 |
| #009   | 9             | (9-1)/3 + 34 = 2 + 34 | #036 | 36 |

---

## 🔄 Fluxo Completo

### **Conforme Documentação:**

```
Mês 1:
• Entrada do PULL: R$10.000 = 100×R$100
• Recebedores principais: #001–#033 (33 pessoas × R$300 = R$9.900)
• Cada um gera R$100 de cascata → 33×R$100 = R$3.300
• R$3.300 → completa 11 novas pessoas (#034–#044)
```

**Cálculo:**
- 33 doadores (#001-#033) = 33 cascatas de R$100
- 33 ÷ 3 = 11 receptores
- Cada receptor recebe 3×R$100 = R$300 (completa!)
- Receptores: #034-#044

---

## 💻 Implementação

### **Código Atualizado:**

```typescript
private async createUserCascadeDonation(
    donorUserId: string, 
    level: number, 
    amount: number
) {
    // 1. Buscar posição do doador
    const donorQueues = await this.queueService.findByUserId(donorUserId);
    const donorQueue = donorQueues.find(q => q.donation_number === level);
    const donorPosition = donorQueue.position;
    
    // 2. Calcular posição do receptor
    const receiverPosition = Math.floor((donorPosition - 1) / 3) + 34;
    
    // 3. Buscar receptor na posição calculada
    const allQueues = await this.queueService.findByDonationNumber(level);
    const receiverQueue = allQueues.find(
        q => q.position === receiverPosition && q.user_id
    );
    
    // 4. Criar doação de cascata
    await this.createDonation(
        donorUserId,              // Doador (ex: #001)
        receiverQueue.user_id,    // Receptor (ex: #034)
        amount,                   // R$ 100
        CASCADE_N1
    );
}
```

---

## 📊 Exemplo Prático

### **Cenário Completo:**

```
Inicialmente:
├─ #001: 0/3 doações
├─ #002: 0/3 doações
├─ #003: 0/3 doações
├─ #034: 0/3 doações
└─ #035: 0/3 doações

Admin gera PULL para #001, #002, #003:
═════════════════════════════════════════

#001 recebe 3 PULL → 3/3 ✅
    ↓
Sistema cria automaticamente:
├─ Upgrade: #001 → N2 (R$ 200)
├─ Cascata: #001 → #034 (R$ 100)  ← Posição 1 → Posição 34
└─ #001 vira nível 2

#002 recebe 3 PULL → 3/3 ✅
    ↓
Sistema cria automaticamente:
├─ Upgrade: #002 → N2 (R$ 200)
├─ Cascata: #002 → #034 (R$ 100)  ← Posição 2 → Posição 34
└─ #002 vira nível 2

#003 recebe 3 PULL → 3/3 ✅
    ↓
Sistema cria automaticamente:
├─ Upgrade: #003 → N2 (R$ 200)
├─ Cascata: #003 → #034 (R$ 100)  ← Posição 3 → Posição 34
└─ #003 vira nível 2

Resultado:
═════════════════════════════════════════
#034 agora tem:
├─ Cascata de #001: R$ 100 (1/3)
├─ Cascata de #002: R$ 100 (2/3)
└─ Cascata de #003: R$ 100 (3/3) ✅

#034 confirma 3ª cascata → 3/3 ✅
    ↓
Sistema cria automaticamente:
├─ Upgrade: #034 → N2 (R$ 200)
├─ Cascata: #034 → #045 (R$ 100)  ← Posição 34 → Posição 45!
    └─ Cálculo: (34-1)/3 + 34 = 11 + 34 = 45 ✅
└─ #034 vira nível 2
```

---

## 🔍 Validação Matemática

### **Documentação diz:**

```
#001–#033 (33 doadores) → geram R$3.300 cascata
R$3.300 ÷ R$300 = 11 receptores
Receptores: #034–#044 (11 pessoas)
```

### **Nossa fórmula:**

```python
# Posições 1-3 → Receptor 34
(1-1)/3 + 34 = 34
(2-1)/3 + 34 = 34
(3-1)/3 + 34 = 34

# Posições 4-6 → Receptor 35
(4-1)/3 + 34 = 35
(5-1)/3 + 34 = 35
(6-1)/3 + 34 = 35

# ...

# Posições 31-33 → Receptor 44
(31-1)/3 + 34 = 44
(32-1)/3 + 34 = 44
(33-1)/3 + 34 = 44
```

**Confirmado:** 33 doadores → 11 receptores (#34-#44) ✅

---

## 📋 Benefícios

### **Antes (Errado):**
- ❌ Cascata ia para "próximo que não completou"
- ❌ Ordem aleatória/imprevisível
- ❌ Não seguia a especificação

### **Depois (Correto):**
- ✅ Cascata segue fórmula matemática exata
- ✅ Posições fixas e previsíveis
- ✅ Cada 3 doadores → 1 receptor específico
- ✅ Segue exatamente a documentação

---

## 🔍 Logs Esperados

```
[CASCADE] Calculating cascade receiver: donor=abc-123 (position 1) → receiver position 34
[CASCADE] Creating cascade: donor=abc-123 (position 1), receiver=def-456 (position 34), amount=100, type=CASCADE_N1
[CASCADE] Successfully created cascade donation: 100 from user abc-123 (pos 1) to user def-456 (pos 34)

[CASCADE] Calculating cascade receiver: donor=ghi-789 (position 2) → receiver position 34
[CASCADE] Creating cascade: donor=ghi-789 (position 2), receiver=def-456 (position 34), amount=100, type=CASCADE_N1
[CASCADE] Successfully created cascade donation: 100 from user ghi-789 (pos 2) to user def-456 (pos 34)

[CASCADE] Calculating cascade receiver: donor=jkl-012 (position 3) → receiver position 34
[CASCADE] Creating cascade: donor=jkl-012 (position 3), receiver=def-456 (position 34), amount=100, type=CASCADE_N1
[CASCADE] Successfully created cascade donation: 100 from user jkl-012 (pos 3) to user def-456 (pos 34)
```

---

## 🎯 Quadro Resumo

| Conceito | Descrição |
|----------|-----------|
| **Fórmula** | `floor((donor_pos - 1) / 3) + 34` |
| **Razão** | Cada 3 doadores → 1 receptor |
| **Doadores** | #001-#033 |
| **Receptores Primários** | #034-#044 (11 pessoas) |
| **Cascatas Secundárias** | #034-#044 geram para #045-#047 |
| **Valor** | R$ 100 por cascata |
| **Total por Receptor** | 3×R$100 = R$300 |

---

## 📋 Arquivos Modificados

```
✏️ src/donations/donations.service.ts
   - Método: createUserCascadeDonation()
   - Linhas: 1948-2016
   - Implementa fórmula: floor((pos-1)/3) + 34
   - Busca receptor na posição exata
   - Logs detalhados com posições
```

---

## 🚀 Deploy

```bash
# Build
npm run build

# Commit
git add src/donations/donations.service.ts
git commit -m "fix: cascade uses position-based formula (3 donors -> 1 receiver)"

# Push
git push origin develop
```

---

## ✅ Checklist

- [x] ✅ Fórmula matemática implementada
- [x] ✅ Busca por posição exata (não "próximo disponível")
- [x] ✅ Cada 3 doadores → 1 receptor específico
- [x] ✅ Logs mostram posições calculadas
- [x] ✅ Build sem erros
- [x] ✅ Linter sem erros
- [x] ✅ Segue documentação exatamente

---

**✅ Cascata Agora Segue a Fórmula Matemática Correta da Documentação!** 🎯📐


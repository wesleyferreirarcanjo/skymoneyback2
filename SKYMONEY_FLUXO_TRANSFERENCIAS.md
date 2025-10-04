# 🚀 SkyMoneyIA 2.0 - Fluxo de Transferências e Lógica de Negócio

## 📋 Visão Geral do Sistema

O SkyMoneyIA 2.0 é um sistema de doações em 3 níveis com **100 participantes fixos** (IDs #001-#100), onde cada participante contribui mensalmente com R$ 100 (PULL) gerando R$ 10.000/mês no total.

---

## 🟨 **NÍVEL 1 - Ciclo de R$ 100 + Cascata**

### **Configuração do N1**
- **Valor por doação**: R$ 100
- **Doações necessárias**: 3 doações = R$ 300 total
- **Participantes**: 100 usuários (IDs #001-#100)
- **PULL mensal**: R$ 10.000 (100 × R$ 100)

### **Lógica de Transferência N1**

#### **1. Doações PULL (PULL)**
```
Tipo: DonationType.PULL
Valor: R$ 100
Origem: Todos os 100 participantes (contribuição mensal)
Destino: Primeiros 33 participantes na fila (#001-#033)
Processo: 3 doações por recebedor = R$ 300 total
```

#### **2. Doações de Cascata (CASCADE_N1)**
```
Tipo: DonationType.CASCADE_N1
Valor: R$ 100
Origem: R$ 100 "lucro" de cada participante que completa N1
Destino: Próximos participantes na fila (#034 em diante)
Processo: Acelera o ciclo, reduzindo tempo de 4 para 2 meses
```

#### **3. Upgrades para N2 (UPGRADE_N2)**
```
Tipo: DonationType.UPGRADE_N2
Valor: R$ 200
Origem: R$ 200 de cada participante que completa N1
Destino: Entrada inicial do participante no Nível 2
Processo: Permite acesso ao N2 após completar N1
```

### **Fluxo Detalhado N1**

#### **Mês 1:**
1. **Entrada PULL**: R$ 10.000
2. **Recebedores principais**: #001-#033 (33 pessoas × R$ 300 = R$ 9.900)
3. **Cascata gerada**: 33 × R$ 100 = R$ 3.300
4. **Novos beneficiados**: #034-#044 (11 pessoas completas)
5. **Cascata secundária**: 11 × R$ 100 = R$ 1.100
6. **Mais beneficiados**: #045-#047 (3 pessoas completas)
7. **Resultado M1**: #001-#047 concluídos
8. **Upgrades N2**: 47 × R$ 200 = R$ 9.400 enviados

#### **Mês 2:**
1. **Nova entrada PULL**: R$ 10.000
2. **Completa**: #048 (faltava R$ 100) e #049 (faltava R$ 200)
3. **Novos beneficiados**: #050-#096 (47 pessoas)
4. **Cascata do mês**: 47 × R$ 100 = R$ 4.700
5. **Finaliza**: #097-#100 (últimos 4 participantes)
6. **Resultado M2**: #048-#100 concluídos
7. **Upgrades N2**: +52 × R$ 200 = R$ 10.400 enviados

---

## 🟧 **NÍVEL 2 - Ciclo de R$ 200 + Reinjeções + Pacotes 8k**

### **Configuração do N2**
- **Valor por doação**: R$ 200
- **Doações necessárias**: 18 doações = R$ 3.600 total
- **Participantes**: Mesmos 100 usuários vindos do N1
- **Entrada inicial**: R$ 20.000 (100 upgrades de R$ 200)

### **Lógica de Transferência N2**

#### **1. Doações PULL N2**
```
Tipo: DonationType.PULL
Valor: R$ 200
Origem: R$ 10.000/mês (50 × R$ 200)
Destino: Participantes na fila do N2
Processo: 18 doações por participante
```

#### **2. Reinjeções N2 (REINJECTION_N2)**
```
Tipo: DonationType.REINJECTION_N2
Valor: R$ 200 cada (total R$ 2.000 por participante)
Origem: R$ 2.000 de cada participante que completa N2
Destino: 10 novas doações no próprio N2 (acelera fila)
Processo: Reinjeção total - nenhum lucro líquido
```

#### **3. Pacotes 8k**
```
Tipo: DonationType.REINJECTION_N2
Valor: R$ 8.000 (40 × R$ 200)
Origem: Disparado a cada 5 concluintes no N2
Destino: Reinjetado no N2 para acelerar fila
Processo: Sistema de aceleração automática
```

#### **4. Upgrades para N3 (UPGRADE_N3)**
```
Tipo: DonationType.UPGRADE_N3
Valor: R$ 1.600
Origem: R$ 1.600 de cada participante que completa N2
Destino: Entrada inicial do participante no Nível 3
Processo: Permite acesso ao N3 após completar N2
```

### **Fluxo Detalhado N2**

#### **Mês 2 (entrada inicial):**
1. **Upgrades do N1**: R$ 20.000 (100 × R$ 200)
2. **Primeiros concluintes**: #001-#011 (11 pessoas)
3. **Cascata gerada**: 11 × R$ 2.000 = R$ 22.000
4. **Pacotes 8k**: 2 pacotes (R$ 16.000) ativados
5. **Total reinjetado**: R$ 38.000 acelera fila

#### **Meses 3-7:**
1. **PULL mensal**: R$ 10.000
2. **Cascata contínua**: R$ 2.000 por concluinte
3. **Pacotes 8k**: A cada 5 upgrades
4. **Progressão acelerada**: 10-15 concluintes por mês
5. **Finalização**: Todos os 100 participantes completam N2

---

## 🟩 **NÍVEL 3 - Ciclo de R$ 1.600 + ADM + Reforços + Finais**

### **Configuração do N3**
- **Valor por doação**: R$ 1.600
- **Doações necessárias**: 27 doações = R$ 43.200 total
- **Participantes**: Mesmos 100 usuários vindos do N2
- **Entrada inicial**: R$ 160.000 (100 upgrades de R$ 1.600)

### **Lógica de Transferência N3**

#### **1. Doações para ADM (ADM_N3)**
```
Tipo: DonationType.ADM_N3
Valor: R$ 1.600 cada (2 doações = R$ 3.200 total)
Origem: Primeiras 2 doações de cada participante N3
Destino: Administração do sistema
Processo: Não volta para o participante
```

#### **2. Doações de Reforço (REINFORCEMENT_N3)**
```
Tipo: DonationType.REINFORCEMENT_N3
Valor: R$ 1.600 cada (5 doações = R$ 8.000 total)
Origem: Doações 3-7 de cada participante N3
Destino: 
- Enquanto N2 ativo → volta para N2
- Após N2 encerrar → fica no N3 como "cascata final"
Processo: Acelera outros níveis ou N3
```

#### **3. Doações Finais (FINAL_PAYMENT_N3)**
```
Tipo: DonationType.FINAL_PAYMENT_N3
Valor: R$ 1.600 cada (20 doações = R$ 32.000 total)
Origem: Doações 8-27 de cada participante N3
Destino: Participante (lucro líquido)
Processo: Único lucro real do sistema
```

#### **4. Doações PULL N3**
```
Tipo: DonationType.PULL
Valor: R$ 1.600
Origem: R$ 10.000/mês (6 doações de R$ 1.600)
Destino: Participantes na fila do N3
Processo: Mantém fluxo após encerramento do N2
```

### **Fluxo Detalhado N3**

#### **Meses 3-7 (N2 ainda ativo):**
1. **Upgrades do N2**: R$ 160.000 (100 × R$ 1.600)
2. **Primeiros concluintes**: #001-#020 ativos
3. **ADM**: 2 doações por participante → administração
4. **Reforço**: 5 doações por participante → volta para N2
5. **N2 acelera**: Recebe reforços até encerrar no M7

#### **Meses 8-20 (N2 encerrado):**
1. **PULL mensal**: R$ 10.000 (6 doações de R$ 1.600)
2. **Reforço N3**: R$ 8.000 de cada novo concluinte
3. **Progressão**: 10-15 concluintes por mês
4. **Mês 15**: ~#070 concluídos
5. **Meses 18-20**: Todos #001-#100 concluídos
6. **Lucro líquido**: R$ 32.000 por participante

---

## 🔄 **Sistema de Fila e Ordem**

### **Gerenciamento de Posições**
- **Ordem**: Sequencial por ID (#001 → #002 → ... → #100)
- **Posições**: Baseadas em `donation_number` e `position`
- **Recebedor atual**: Marcado com `is_receiver = true`
- **Progressão**: Automática após confirmação de doações

### **Operações de Fila**
- **Avançar fila**: Próximo na sequência vira recebedor
- **Mover para final**: Participante vai para última posição
- **Trocar posições**: Dois participantes trocam de lugar
- **Remover participante**: Libera vaga para novo participante

---

## 💰 **Resumo Financeiro por Nível**

| Nível | Entrada | Saída | Lucro Líquido | Duração |
|-------|---------|-------|---------------|---------|
| **N1** | R$ 300 | R$ 200 (upgrade) + R$ 100 (cascata) | R$ 0 | 2 meses |
| **N2** | R$ 3.600 | R$ 1.600 (upgrade) + R$ 2.000 (reinjeção) | R$ 0 | 7 meses |
| **N3** | R$ 43.200 | R$ 3.200 (ADM) + R$ 8.000 (reforço) + R$ 32.000 (líquido) | R$ 32.000 | 18-20 meses |

---

## 🎯 **Pontos-Chave do Sistema**

1. **Autossustentável**: Nenhum dinheiro sai do sistema até N3
2. **Aceleração**: Cascatas e reinjeções reduzem tempo de espera
3. **Liquidez garantida**: R$ 32.000 líquidos por participante no final
4. **Reentrada**: Participantes podem reiniciar após completar N3
5. **Capacidade fixa**: 100 participantes por grupo
6. **Transparência**: Todas as transferências são rastreáveis via sistema
7. **⭐ NOVO - Upgrade em Cascata**: Upgrades devem ser feitos em ordem sequencial de posição
8. **⭐ NOVO - Manutenção de Posição**: Usuário mantém a mesma posição ao fazer upgrade entre níveis

---

## 🔧 **Implementação Técnica**

### **Tipos de Doação (DonationType)**
- `PULL`: Contribuições mensais regulares
- `CASCADE_N1`: Cascatas do Nível 1
- `UPGRADE_N2`: Upgrades para Nível 2
- `REINJECTION_N2`: Reinjeções no Nível 2
- `UPGRADE_N3`: Upgrades para Nível 3
- `REINFORCEMENT_N3`: Reforços do Nível 3
- `ADM_N3`: Doações administrativas
- `FINAL_PAYMENT_N3`: Pagamentos finais líquidos

### **Estados de Doação (DonationStatus)**
- `PENDING_PAYMENT`: Aguardando pagamento
- `PENDING_CONFIRMATION`: Aguardando confirmação
- `CONFIRMED`: Confirmada e processada
- `EXPIRED`: Expirada
- `CANCELLED`: Cancelada

### **Sistema de Upgrades (NOVO)**

#### **Regra 1: Upgrades em Ordem Sequencial**
- Upgrades devem ser feitos respeitando a ordem da fila
- Usuário só pode fazer upgrade se todos anteriores:
  - Não completaram o nível ainda, OU
  - Já fizeram upgrade para o próximo nível
- Exemplo:
  - ✅ #001 completou → pode fazer upgrade
  - ✅ #002 completou → pode fazer upgrade (se #001 já fez)
  - ❌ #005 completou → NÃO pode upgrade (se #003 completou mas não fez upgrade)

#### **Regra 2: Manutenção de Posição**
- Ao fazer upgrade, usuário mantém a mesma posição
- Exemplo:
  - Usuário #010 no N1 → Faz upgrade → Vira #010 no N2
  - Usuário #025 no N2 → Faz upgrade → Vira #025 no N3
- Posição é preservada através dos níveis

#### **Regra 3: Upgrade para Si Mesmo**
- Doação de upgrade é do usuário para ele mesmo
- Donor = Receiver = Usuário que está fazendo upgrade
- Isso marca que o upgrade foi concluído

### **Processamento Automático**
Após confirmação de uma doação, o sistema automaticamente:
1. Executa regras de negócio específicas por tipo
2. Atualiza progresso do usuário no nível
3. Verifica se nível foi completado
4. **NOVO**: Retorna informação de upgrade disponível (usuário decide)
5. Notifica participantes afetados

### **Processamento Manual (Decisão do Usuário)**
Quando usuário completa um nível:
1. Sistema informa que upgrade está disponível
2. Sistema verifica se pode fazer upgrade (ordem sequencial)
3. Usuário decide aceitar ou aguardar
4. Se aceitar E estiver na ordem: cria doações de upgrade e cascata
5. Usuário é adicionado ao próximo nível na mesma posição

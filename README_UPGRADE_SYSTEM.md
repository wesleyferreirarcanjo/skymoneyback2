# 📚 Sistema de Upgrade - Documentação Completa

## 🎯 Visão Geral

Sistema de **upgrade em cascata com manutenção de posição** implementado no SkyMoney 2.0.

### **Regra Principal:**
- Upgrades devem ser feitos **em ordem sequencial** de posição na fila
- Usuário mantém a **mesma posição** ao fazer upgrade entre níveis
- Usuário **decide** quando fazer upgrade (não é automático)

---

## 📄 Documentos Disponíveis

### **1. Para Entender o Sistema**
📖 **`SKYMONEY_FLUXO_TRANSFERENCIAS.md`**
- Regras de negócio completas
- Fluxo de cada nível (N1, N2, N3)
- Tipos de doações
- Cascatas e reinjeções

### **2. Para Implementar no Frontend**
🚀 **`FRONTEND_UPGRADE_IMPLEMENTATION.md`** ⭐ **RECOMENDADO**
- Código pronto para copy-paste
- Types TypeScript completos
- Hooks customizados
- Componentes React
- CSS incluído
- Exemplo de uso completo

🔧 **`FRONTEND_UPGRADE_GUIDE.md`**
- Documentação detalhada
- Explicações extensas
- Múltiplas abordagens
- Casos de uso avançados

### **3. Para Debug**
🐛 **`DEBUG_DONOR_ID_NULL.md`**
- Solução para erro `donor_id null`
- Queries SQL de verificação
- Checklist de troubleshooting

🐛 **`TEST_UPGRADE_DEBUG.md`**
- Logs esperados
- Verificações de banco
- Testes manuais

🐛 **`UPGRADE_EM_CASCATA_FRONTEND.md`**
- Documentação para desenvolvedor frontend (sem código)
- Fluxos funcionais
- Modais e interfaces sugeridas
- FAQs

---

## 🚀 Começar Rápido - Frontend

### **Passo 1: Ler Documentação**
```bash
# Abrir e ler
FRONTEND_UPGRADE_IMPLEMENTATION.md
```

### **Passo 2: Criar Estrutura**
```
src/
├── types/
│   └── donations.types.ts      ← Copiar do doc
├── lib/
│   └── api.ts                  ← Copiar do doc
├── services/
│   └── donations.service.ts    ← Copiar do doc
├── hooks/
│   ├── useUserProgress.ts      ← Copiar do doc
│   └── useUpgrade.ts           ← Copiar do doc
├── components/
│   ├── LevelProgress.tsx       ← Copiar do doc
│   └── UpgradeModal.tsx        ← Copiar do doc
└── styles/
    └── upgrade.css             ← Copiar do doc
```

### **Passo 3: Testar**
```bash
npm run build
npm run dev
```

### **Passo 4: Deploy**
```bash
git add .
git commit -m "feat: implement upgrade system"
git push origin main
```

---

## 📡 API Endpoints

### **GET /donations/my-level-progress**
Buscar progresso do usuário em todos os níveis

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta:**
```json
[
  {
    "level": 1,
    "donations_received": 3,
    "donations_required": 3,
    "total_received": 300,
    "progress_percentage": 100,
    "level_completed": true,
    "level_completed_at": "2025-01-15T10:30:00Z"
  }
]
```

---

### **POST /donations/accept-upgrade**
Aceitar upgrade para próximo nível

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "from_level": 1,
  "to_level": 2
}
```

**Resposta de Sucesso:**
```json
{
  "message": "Upgrade realizado com sucesso!",
  "new_level": 2,
  "donations_created": [...]
}
```

**Possíveis Erros:**
- `400` - Não completou nível
- `400` - Bloqueado (fora de ordem)
- `400` - Já fez upgrade
- `400` - Sequência inválida

---

### **POST /donations/:id/confirm**
Confirmar doação (modificado para retornar upgrade_available)

**Resposta quando completa nível:**
```json
{
  "message": "Doação confirmada com sucesso!",
  "level_completed": true,
  "completed_level": 1,
  "upgrade_available": {
    "can_upgrade": true,
    "from_level": 1,
    "to_level": 2,
    "requirements": {...}
  }
}
```

---

## 🎨 Fluxo de Uso

### **Cenário 1: Upgrade Permitido**
```
1. Usuário completa N1 (3/3 doações)
2. Confirma última doação
3. Modal aparece: "🎉 Nível 1 Completado!"
4. Mostra: "✅ Você pode fazer upgrade"
5. Clica "Aceitar Upgrade"
6. Sucesso: vai para N2 na mesma posição
```

### **Cenário 2: Upgrade Bloqueado**
```
1. Usuário completa N1 (3/3 doações)
2. Confirma última doação
3. Modal aparece: "🎉 Nível 1 Completado!"
4. Mostra: "⏳ Aguarde participantes anteriores"
5. Apenas botão "OK, Entendi"
6. Aguarda outros fazerem upgrade
```

---

## 🔧 Backend - Status

### **Implementado ✅**
- [x] Validação de ordem sequencial
- [x] Manutenção de posição
- [x] Endpoint `/donations/my-level-progress`
- [x] Endpoint `/donations/accept-upgrade`
- [x] Modificado `/donations/:id/confirm`
- [x] Logs detalhados
- [x] Tratamento de erros

### **Migrations Necessárias**
```sql
-- Adicionar colunas na tabela queue
ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_received DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS donations_received INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS donations_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS level_completed_at TIMESTAMPTZ;

-- Adicionar coluna na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
```

---

## 💻 Frontend - A Implementar

### **Checklist**
- [ ] Criar types (`donations.types.ts`)
- [ ] Criar API helper (`lib/api.ts`)
- [ ] Criar service (`donations.service.ts`)
- [ ] Criar hook de progresso (`useUserProgress.ts`)
- [ ] Criar hook de upgrade (`useUpgrade.ts`)
- [ ] Criar componente de progresso (`LevelProgress.tsx`)
- [ ] Criar modal de upgrade (`UpgradeModal.tsx`)
- [ ] Integrar com confirmação de doação
- [ ] Adicionar CSS
- [ ] Testar fluxo completo

---

## 🐛 Troubleshooting

### **Erro: "makeAuthenticatedRequest" is not exported**
📄 Ver: `FRONTEND_UPGRADE_IMPLEMENTATION.md` - Passo 2

**Solução:** Criar `src/lib/api.ts` com a função exportada

---

### **Erro: "donor_id violates not-null constraint"**
📄 Ver: `DEBUG_DONOR_ID_NULL.md`

**Solução:** Verificar se usuário está na fila do nível

---

### **Erro: Build Failed**
**Verificar:**
1. Todos arquivos foram criados
2. Imports estão corretos
3. Types estão definidos
4. `api.ts` exporta função

---

## 📊 Arquitetura

```
┌─────────────┐
│   Frontend  │
│   Dashboard │
└──────┬──────┘
       │
       ├─► GET /donations/my-level-progress
       │   (Carregar progresso)
       │
       ├─► POST /donations/:id/confirm
       │   (Confirmar doação)
       │   └─► level_completed? → Mostrar Modal
       │
       └─► POST /donations/accept-upgrade
           (Usuário aceita upgrade)
           └─► Criar doações + Atualizar nível
```

---

## 📝 Ordem de Leitura Recomendada

### **Para Desenvolvedores Frontend:**
1. **Ler:** `FRONTEND_UPGRADE_IMPLEMENTATION.md` (copy-paste)
2. **Implementar:** Seguir código do documento
3. **Testar:** Build e funcionamento
4. **Se erro:** Ver seção Troubleshooting

### **Para Product Owners:**
1. **Ler:** `SKYMONEY_FLUXO_TRANSFERENCIAS.md` (regras)
2. **Ler:** `UPGRADE_EM_CASCATA_FRONTEND.md` (UX)
3. **Validar:** Fluxos estão corretos

### **Para Debug:**
1. **Ver logs:** `TEST_UPGRADE_DEBUG.md`
2. **Verificar DB:** `DEBUG_DONOR_ID_NULL.md`
3. **Rodar queries:** Verificações SQL

---

## ✅ Status do Projeto

| Componente | Status | Doc |
|------------|--------|-----|
| **Backend - Lógica** | ✅ Completo | `donations.service.ts` |
| **Backend - Endpoints** | ✅ Completo | `donations.controller.ts` |
| **Backend - Validações** | ✅ Completo | `canUserUpgradeInOrder()` |
| **Backend - Logs** | ✅ Completo | Prefixo `[UPGRADE]` |
| **Frontend - Types** | ⏳ A Fazer | `FRONTEND_UPGRADE_IMPLEMENTATION.md` |
| **Frontend - Service** | ⏳ A Fazer | `FRONTEND_UPGRADE_IMPLEMENTATION.md` |
| **Frontend - Hooks** | ⏳ A Fazer | `FRONTEND_UPGRADE_IMPLEMENTATION.md` |
| **Frontend - UI** | ⏳ A Fazer | `FRONTEND_UPGRADE_IMPLEMENTATION.md` |
| **Testes** | ⏳ A Fazer | Manual |
| **Documentação** | ✅ Completo | Este arquivo |

---

## 🚀 Deploy

### **Backend:**
```bash
npm run build
pm2 restart skymoney-backend
```

### **Frontend:**
```bash
npm run build
# Deploy automático via git push
```

---

## 📞 Suporte

**Dúvidas sobre:**
- **Regras de negócio:** Ver `SKYMONEY_FLUXO_TRANSFERENCIAS.md`
- **Implementação:** Ver `FRONTEND_UPGRADE_IMPLEMENTATION.md`
- **Erros:** Ver seção Troubleshooting ou docs de debug

---

## 🎉 Resumo

✅ **Backend:** Completo e funcionando  
⏳ **Frontend:** Documentação pronta, implementação pendente  
📚 **Docs:** Completos com exemplos  
🐛 **Debug:** Guias disponíveis  

**Próximo Passo:** Implementar frontend seguindo `FRONTEND_UPGRADE_IMPLEMENTATION.md` 🚀


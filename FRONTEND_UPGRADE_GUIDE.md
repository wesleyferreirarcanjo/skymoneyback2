# 🚀 Frontend - Guia de Implementação do Sistema de Upgrade

> ⚠️ **NOVO:** Veja também [`FRONTEND_UPGRADE_IMPLEMENTATION.md`](./FRONTEND_UPGRADE_IMPLEMENTATION.md) para uma versão mais direta e focada em copy-paste!

## 📋 Visão Geral

Este documento detalha como implementar o sistema de upgrade em cascata no frontend, seguindo os padrões do projeto SkyMoney.

---

## 🎯 Padrões do Projeto

### **1. Autenticação**
Todas as requisições devem incluir o token JWT:

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### **2. Estrutura de Resposta**
O backend retorna respostas estruturadas:

**Sucesso:**
```typescript
{
  message: string;
  data?: any;
  // campos específicos do endpoint
}
```

**Erro:**
```typescript
{
  statusCode: number;
  message: string;
  error: string;
}
```

### **3. Base URL**
```
Produção: https://skymoney-test-back.dq4298.easypanel.host
Desenvolvimento: http://localhost:3000
```

---

## 📡 Endpoints do Sistema de Upgrade

### **1. Verificar Progresso do Usuário**

**Endpoint:** `GET /donations/my-level-progress`

**Headers:**
```typescript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Resposta de Sucesso:**
```typescript
[
  {
    level: number;                    // 1, 2 ou 3
    donations_received: number;       // Quantas doações recebeu
    donations_required: number;       // Quantas são necessárias
    total_received: number;           // Valor total recebido
    progress_percentage: number;      // Porcentagem de conclusão
    level_completed: boolean;         // Se completou o nível
    level_completed_at?: Date;        // Quando completou
  }
]
```

**Exemplo de Resposta:**
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

**Quando Usar:** 
- Ao carregar dashboard do usuário
- Após confirmar uma doação recebida
- Periodicamente para atualizar progresso

---

### **2. Aceitar Upgrade para Próximo Nível**

**Endpoint:** `POST /donations/accept-upgrade`

**Headers:**
```typescript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Body:**
```typescript
{
  from_level: number;  // Nível atual (1 ou 2)
  to_level: number;    // Próximo nível (2 ou 3)
}
```

**Exemplo de Request:**
```json
{
  "from_level": 1,
  "to_level": 2
}
```

**Resposta de Sucesso:**
```typescript
{
  message: string;                    // "Upgrade realizado com sucesso!"
  new_level: number;                  // 2 ou 3
  donations_created: Array<{
    type: string;                     // "upgrade", "cascade", "reinjection"
    level: number;                    // Nível da doação
    amount: number;                   // Valor
    position?: number;                // Posição na fila (para upgrade)
  }>;
}
```

**Exemplo de Resposta:**
```json
{
  "message": "Upgrade realizado com sucesso!",
  "new_level": 2,
  "donations_created": [
    {
      "type": "upgrade",
      "level": 2,
      "amount": 200,
      "position": 5
    },
    {
      "type": "cascade",
      "level": 1,
      "amount": 100
    }
  ]
}
```

**Possíveis Erros:**

#### **400 - Não Completou o Nível**
```json
{
  "statusCode": 400,
  "message": "Você ainda não completou este nível",
  "error": "Bad Request"
}
```

#### **400 - Bloqueado por Ordem Sequencial**
```json
{
  "statusCode": 400,
  "message": "Aguarde os participantes anteriores fazerem upgrade primeiro. Upgrades devem ser feitos em ordem sequencial.",
  "error": "Bad Request"
}
```

#### **400 - Já Fez Upgrade**
```json
{
  "statusCode": 400,
  "message": "Você já está neste nível ou superior",
  "error": "Bad Request"
}
```

#### **400 - Sequência Inválida**
```json
{
  "statusCode": 400,
  "message": "Sequência de upgrade inválida",
  "error": "Bad Request"
}
```

**Quando Usar:**
- Quando usuário clicar em "Aceitar Upgrade" no modal
- Apenas após verificar que `level_completed: true`

---

### **3. Confirmar Doação Recebida (Modificado)**

**Endpoint:** `POST /donations/:id/confirm`

**Headers:**
```typescript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Resposta de Sucesso (Quando Completa Nível):**
```typescript
{
  message: string;
  level_completed?: boolean;          // true se completou
  completed_level?: number;           // Qual nível completou (1, 2 ou 3)
  upgrade_available?: {
    can_upgrade: boolean;             // Se pode fazer upgrade
    from_level: number;               // Nível atual
    to_level: number | null;          // Próximo nível (null se completou N3)
    requirements: {
      upgrade_amount?: number;        // Valor do upgrade
      cascade_amount?: number;        // Valor da cascata (N1)
      reinjection_amount?: number;    // Valor da reinjeção (N2)
      total: number;                  // Total necessário
      description: string;            // Descrição
    };
    user_balance: number;             // Saldo do usuário
    can_afford: boolean;              // Se tem saldo suficiente
  };
}
```

**Exemplo de Resposta (N1 Completado):**
```json
{
  "message": "Doação confirmada com sucesso!",
  "level_completed": true,
  "completed_level": 1,
  "upgrade_available": {
    "can_upgrade": true,
    "from_level": 1,
    "to_level": 2,
    "requirements": {
      "upgrade_amount": 200,
      "cascade_amount": 100,
      "total": 300,
      "description": "Upgrade para Nível 2 + Cascata N1"
    },
    "user_balance": 300,
    "can_afford": true
  }
}
```

**Quando Usar:**
- Após receber comprovante de pagamento
- O frontend deve verificar se `level_completed: true` e mostrar modal de upgrade

---

## 🎨 Implementação no Frontend

### **Estrutura Recomendada**

```
src/
├── services/
│   └── donations.service.ts       # Chamadas à API
├── hooks/
│   ├── useUserProgress.ts         # Hook para progresso
│   └── useUpgrade.ts              # Hook para upgrade
├── components/
│   ├── LevelProgress/             # Componente de progresso
│   ├── UpgradeModal/              # Modal de upgrade
│   └── LevelCompletedModal/       # Modal de nível completado
└── types/
    └── donations.types.ts         # Tipos TypeScript
```

---

### **1. Types (TypeScript)**

**Arquivo:** `src/types/donations.types.ts`

```typescript
// Progresso de Nível
export interface LevelProgress {
  level: number;
  donations_received: number;
  donations_required: number;
  total_received: number;
  progress_percentage: number;
  level_completed: boolean;
  level_completed_at?: string;
}

// Informações de Upgrade
export interface UpgradeInfo {
  can_upgrade: boolean;
  from_level: number;
  to_level: number | null;
  requirements: {
    upgrade_amount?: number;
    cascade_amount?: number;
    reinjection_amount?: number;
    total: number;
    description: string;
  };
  user_balance: number;
  can_afford: boolean;
}

// Request de Upgrade
export interface AcceptUpgradeRequest {
  from_level: number;
  to_level: number;
}

// Resposta de Upgrade
export interface AcceptUpgradeResponse {
  message: string;
  new_level: number;
  donations_created: Array<{
    type: string;
    level: number;
    amount: number;
    position?: number;
  }>;
}

// Resposta de Confirmação (quando completa nível)
export interface DonationConfirmResponse {
  message: string;
  level_completed?: boolean;
  completed_level?: number;
  upgrade_available?: UpgradeInfo;
}
```

---

### **2. Service API**

**Arquivo:** `src/services/donations.service.ts`

```typescript
import axios from 'axios';
import type {
  LevelProgress,
  AcceptUpgradeRequest,
  AcceptUpgradeResponse,
  DonationConfirmResponse
} from '../types/donations.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Configurar axios com interceptor para token
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // ou seu método de armazenamento
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Você pode adicionar tratamento global de erros aqui
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const donationsService = {
  /**
   * Buscar progresso do usuário em todos os níveis
   */
  async getMyLevelProgress(): Promise<LevelProgress[]> {
    const response = await api.get<LevelProgress[]>('/donations/my-level-progress');
    return response.data;
  },

  /**
   * Aceitar upgrade para próximo nível
   */
  async acceptUpgrade(data: AcceptUpgradeRequest): Promise<AcceptUpgradeResponse> {
    const response = await api.post<AcceptUpgradeResponse>(
      '/donations/accept-upgrade',
      data
    );
    return response.data;
  },

  /**
   * Confirmar recebimento de doação
   */
  async confirmDonation(donationId: string): Promise<DonationConfirmResponse> {
    const response = await api.post<DonationConfirmResponse>(
      `/donations/${donationId}/confirm`
    );
    return response.data;
  },

  // ... outros métodos de doações
};
```

---

### **3. Custom Hook - Progresso**

**Arquivo:** `src/hooks/useUserProgress.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { donationsService } from '../services/donations.service';
import type { LevelProgress } from '../types/donations.types';

export const useUserProgress = () => {
  const [progress, setProgress] = useState<LevelProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await donationsService.getMyLevelProgress();
      setProgress(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar progresso');
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Helper para pegar progresso de um nível específico
  const getLevelProgress = useCallback(
    (level: number): LevelProgress | undefined => {
      return progress.find((p) => p.level === level);
    },
    [progress]
  );

  // Helper para verificar se pode fazer upgrade
  const canUpgradeFromLevel = useCallback(
    (level: number): boolean => {
      const levelProgress = getLevelProgress(level);
      return levelProgress?.level_completed ?? false;
    },
    [getLevelProgress]
  );

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
    getLevelProgress,
    canUpgradeFromLevel,
  };
};
```

---

### **4. Custom Hook - Upgrade**

**Arquivo:** `src/hooks/useUpgrade.ts`

```typescript
import { useState } from 'react';
import { donationsService } from '../services/donations.service';
import type {
  AcceptUpgradeRequest,
  AcceptUpgradeResponse,
} from '../types/donations.types';

export const useUpgrade = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptUpgrade = async (
    fromLevel: number,
    toLevel: number
  ): Promise<AcceptUpgradeResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const data: AcceptUpgradeRequest = {
        from_level: fromLevel,
        to_level: toLevel,
      };

      const response = await donationsService.acceptUpgrade(data);
      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Erro ao processar upgrade';
      setError(errorMessage);
      console.error('Error accepting upgrade:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    acceptUpgrade,
    loading,
    error,
    clearError: () => setError(null),
  };
};
```

---

### **5. Componente - Progresso de Nível**

**Arquivo:** `src/components/LevelProgress/LevelProgress.tsx`

```typescript
import React from 'react';
import { useUserProgress } from '../../hooks/useUserProgress';

export const LevelProgress: React.FC = () => {
  const { progress, loading, error, getLevelProgress } = useUserProgress();

  if (loading) {
    return <div>Carregando progresso...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const currentLevel = progress.find((p) => p.level_completed === false);
  const completedLevels = progress.filter((p) => p.level_completed);

  return (
    <div className="level-progress">
      <h2>Seu Progresso</h2>

      {/* Níveis Completados */}
      {completedLevels.map((level) => (
        <div key={level.level} className="level-card completed">
          <h3>Nível {level.level} ✅</h3>
          <p>Completado em {new Date(level.level_completed_at!).toLocaleDateString()}</p>
          <p>Total recebido: R$ {level.total_received.toFixed(2)}</p>
        </div>
      ))}

      {/* Nível Atual */}
      {currentLevel && (
        <div className="level-card current">
          <h3>Nível {currentLevel.level} (Atual)</h3>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${currentLevel.progress_percentage}%` }}
            />
          </div>
          <p>
            {currentLevel.donations_received} / {currentLevel.donations_required}{' '}
            doações ({currentLevel.progress_percentage.toFixed(0)}%)
          </p>
          <p>Total recebido: R$ {currentLevel.total_received.toFixed(2)}</p>
        </div>
      )}

      {/* Níveis Futuros */}
      {progress.length === 0 && (
        <div className="level-card locked">
          <h3>Nível 1 🔒</h3>
          <p>Você ainda não está em nenhum nível</p>
        </div>
      )}
    </div>
  );
};
```

---

### **6. Componente - Modal de Upgrade**

**Arquivo:** `src/components/UpgradeModal/UpgradeModal.tsx`

```typescript
import React, { useState } from 'react';
import { useUpgrade } from '../../hooks/useUpgrade';
import type { UpgradeInfo } from '../../types/donations.types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgradeInfo: UpgradeInfo;
  onSuccess: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  upgradeInfo,
  onSuccess,
}) => {
  const { acceptUpgrade, loading, error } = useUpgrade();
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAcceptUpgrade = async () => {
    if (!upgradeInfo.can_upgrade) {
      return;
    }

    const response = await acceptUpgrade(
      upgradeInfo.from_level,
      upgradeInfo.to_level!
    );

    if (response) {
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {!showSuccess ? (
          <>
            <h2>🎉 Parabéns! Nível {upgradeInfo.from_level} Completado!</h2>

            <div className="upgrade-info">
              <p className="description">{upgradeInfo.requirements.description}</p>

              <div className="requirements">
                <h3>Detalhes do Upgrade:</h3>

                {upgradeInfo.requirements.upgrade_amount && (
                  <div className="requirement-item">
                    <span>Upgrade para N{upgradeInfo.to_level}:</span>
                    <span>R$ {upgradeInfo.requirements.upgrade_amount.toFixed(2)}</span>
                  </div>
                )}

                {upgradeInfo.requirements.cascade_amount && (
                  <div className="requirement-item">
                    <span>Cascata N{upgradeInfo.from_level}:</span>
                    <span>R$ {upgradeInfo.requirements.cascade_amount.toFixed(2)}</span>
                  </div>
                )}

                {upgradeInfo.requirements.reinjection_amount && (
                  <div className="requirement-item">
                    <span>Reinjeção N{upgradeInfo.from_level}:</span>
                    <span>
                      R$ {upgradeInfo.requirements.reinjection_amount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="requirement-item total">
                  <span>Total:</span>
                  <span>R$ {upgradeInfo.requirements.total.toFixed(2)}</span>
                </div>
              </div>

              {upgradeInfo.can_upgrade ? (
                <p className="can-upgrade">✅ Você pode fazer o upgrade agora!</p>
              ) : (
                <p className="cannot-upgrade">
                  ⏳ Aguarde os participantes anteriores fazerem upgrade.
                </p>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              {upgradeInfo.can_upgrade ? (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleAcceptUpgrade}
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : 'Aceitar Upgrade'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Aguardar
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={onClose}>
                  OK, Entendi
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="success-message">
            <h2>✅ Upgrade Realizado com Sucesso!</h2>
            <p>Você agora está no Nível {upgradeInfo.to_level}!</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### **7. Componente - Confirmação de Doação (Modificado)**

**Arquivo:** `src/components/DonationConfirmation.tsx`

```typescript
import React, { useState } from 'react';
import { donationsService } from '../services/donations.service';
import { UpgradeModal } from './UpgradeModal/UpgradeModal';
import type { UpgradeInfo } from '../types/donations.types';

interface DonationConfirmationProps {
  donationId: string;
  onConfirmed: () => void;
}

export const DonationConfirmation: React.FC<DonationConfirmationProps> = ({
  donationId,
  onConfirmed,
}) => {
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const response = await donationsService.confirmDonation(donationId);

      // Verificar se completou nível e tem upgrade disponível
      if (response.level_completed && response.upgrade_available) {
        setUpgradeInfo(response.upgrade_available);
        setShowUpgradeModal(true);
      } else {
        // Apenas confirmou, sem upgrade
        onConfirmed();
      }
    } catch (error) {
      console.error('Error confirming donation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSuccess = () => {
    onConfirmed(); // Atualizar a tela
  };

  return (
    <>
      <button onClick={handleConfirm} disabled={loading}>
        {loading ? 'Confirmando...' : 'Confirmar Recebimento'}
      </button>

      {upgradeInfo && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          upgradeInfo={upgradeInfo}
          onSuccess={handleUpgradeSuccess}
        />
      )}
    </>
  );
};
```

---

## 🎨 Estilos Sugeridos (CSS)

**Arquivo:** `src/components/UpgradeModal/UpgradeModal.css`

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
  margin-bottom: 24px;
  color: #2c3e50;
  font-size: 24px;
  text-align: center;
}

.upgrade-info {
  margin: 24px 0;
}

.description {
  font-size: 16px;
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 24px;
}

.requirements {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.requirements h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #2c3e50;
}

.requirement-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
  font-size: 16px;
}

.requirement-item:last-child {
  border-bottom: none;
}

.requirement-item.total {
  font-weight: bold;
  font-size: 18px;
  color: #2c3e50;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 2px solid #3498db;
}

.can-upgrade {
  color: #27ae60;
  font-weight: bold;
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: #d5f4e6;
  border-radius: 8px;
}

.cannot-upgrade {
  color: #e67e22;
  font-weight: bold;
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: #ffeaa7;
  border-radius: 8px;
}

.error-message {
  color: #e74c3c;
  background: #fadbd8;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.success-message {
  text-align: center;
  padding: 20px;
}

.success-message h2 {
  color: #27ae60;
  margin-bottom: 16px;
}

/* Animação de entrada */
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-content {
  animation: modalFadeIn 0.3s ease-out;
}
```

---

## 📱 Fluxo de Uso Completo

### **Cenário 1: Usuário Completa N1 e Pode Fazer Upgrade**

```
1. Usuário recebe 3ª doação do N1
2. Clica em "Confirmar Recebimento"
3. Backend responde com `level_completed: true` e `upgrade_available`
4. Modal de upgrade aparece automaticamente
5. Usuário vê:
   - "🎉 Parabéns! Nível 1 Completado!"
   - Detalhes: R$ 200 upgrade + R$ 100 cascata
   - "✅ Você pode fazer o upgrade agora!"
6. Usuário clica "Aceitar Upgrade"
7. Loading aparece
8. Sucesso: "✅ Upgrade Realizado com Sucesso!"
9. Dashboard atualiza mostrando Nível 2
```

### **Cenário 2: Usuário Completa mas Está Bloqueado**

```
1. Usuário recebe 3ª doação do N1
2. Clica em "Confirmar Recebimento"
3. Backend responde com `can_upgrade: false`
4. Modal aparece com:
   - "🎉 Parabéns! Nível 1 Completado!"
   - "⏳ Aguarde os participantes anteriores fazerem upgrade"
   - Botão apenas "OK, Entendi"
5. Usuário aguarda
6. Quando anteriores fizerem upgrade, pode tentar novamente
```

### **Cenário 3: Usuário Tenta Fazer Upgrade Manualmente**

```
1. Usuário vai em "Meu Progresso"
2. Vê "Nível 1: 3/3 doações ✅"
3. Clica em "Fazer Upgrade"
4. POST /donations/accept-upgrade é chamado
5. Se bloqueado: erro 400 com mensagem clara
6. Se permitido: sucesso e dashboard atualiza
```

---

## 🔔 Sistema de Notificações (Opcional)

Para melhorar a experiência, implemente notificações:

```typescript
// Verificar periodicamente se pode fazer upgrade
useEffect(() => {
  const checkUpgradeStatus = async () => {
    const progress = await donationsService.getMyLevelProgress();
    
    const completedLevel = progress.find(
      (p) => p.level_completed && !hasUpgradedFrom(p.level)
    );

    if (completedLevel) {
      // Tentar fazer upgrade (pode falhar se bloqueado)
      try {
        await donationsService.acceptUpgrade({
          from_level: completedLevel.level,
          to_level: completedLevel.level + 1,
        });
        
        showNotification('🎉 Upgrade desbloqueado! Você pode fazer upgrade agora.');
      } catch (error) {
        // Ainda bloqueado, aguardar
      }
    }
  };

  const interval = setInterval(checkUpgradeStatus, 60000); // A cada 1 minuto

  return () => clearInterval(interval);
}, []);
```

---

## ✅ Checklist de Implementação

### **Backend (Pronto)**
- [x] Endpoint `/donations/my-level-progress`
- [x] Endpoint `/donations/accept-upgrade`
- [x] Validação de ordem sequencial
- [x] Manutenção de posição
- [x] Logs detalhados

### **Frontend (A Fazer)**
- [ ] Criar types TypeScript
- [ ] Implementar service de API
- [ ] Criar hook `useUserProgress`
- [ ] Criar hook `useUpgrade`
- [ ] Componente de progresso de níveis
- [ ] Modal de upgrade
- [ ] Modificar confirmação de doação
- [ ] Estilizar componentes
- [ ] Testar fluxo completo
- [ ] Sistema de notificações (opcional)

---

## 🚀 Exemplo de Uso Rápido

```typescript
// No componente Dashboard
import { useUserProgress } from './hooks/useUserProgress';
import { LevelProgress } from './components/LevelProgress/LevelProgress';

export const Dashboard = () => {
  const { progress, loading } = useUserProgress();

  return (
    <div>
      <h1>Meu Dashboard</h1>
      <LevelProgress />
      {/* ... resto do dashboard */}
    </div>
  );
};
```

---

**✅ Documentação Completa! Frontend pode começar a implementar seguindo estes padrões.** 🎉

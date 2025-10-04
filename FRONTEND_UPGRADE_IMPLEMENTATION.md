# 🚀 Frontend - Implementação do Sistema de Upgrade

## 📋 Visão Geral

Sistema de upgrade em cascata com manutenção de posição. O usuário completa um nível e decide quando fazer upgrade para o próximo.

---

## 🎯 Regras de Negócio

### **Upgrade em Cascata:**
- Upgrades devem ser feitos **em ordem sequencial** de posição
- Usuário #001 pode fazer upgrade
- Usuário #002 só pode fazer upgrade **após** #001 fazer
- Usuário #005 só pode fazer upgrade **após** todos anteriores fazerem

### **Manutenção de Posição:**
- Usuário #005 no N1 → Faz upgrade → Vira #005 no N2
- A posição na fila é **mantida** entre níveis

### **Decisão do Usuário:**
- Sistema **NÃO** faz upgrade automático
- Usuário **decide** quando fazer upgrade
- Sistema valida se está na ordem correta

---

## 📡 API - Endpoints Disponíveis

### **1. Buscar Progresso do Usuário**

```typescript
GET /donations/my-level-progress
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

### **2. Aceitar Upgrade**

```typescript
POST /donations/accept-upgrade
Authorization: Bearer {token}
Content-Type: application/json

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

**Erros Possíveis:**

**400 - Não Completou:**
```json
{
  "statusCode": 400,
  "message": "Você ainda não completou este nível",
  "error": "Bad Request"
}
```

**400 - Bloqueado (Fora de Ordem):**
```json
{
  "statusCode": 400,
  "message": "Aguarde os participantes anteriores fazerem upgrade primeiro. Upgrades devem ser feitos em ordem sequencial.",
  "error": "Bad Request"
}
```

**400 - Já Fez Upgrade:**
```json
{
  "statusCode": 400,
  "message": "Você já está neste nível ou superior",
  "error": "Bad Request"
}
```

---

### **3. Confirmar Doação (Modificado)**

```typescript
POST /donations/:donationId/confirm
Authorization: Bearer {token}
```

**Resposta quando COMPLETA um nível:**
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

**Resposta quando NÃO completa:**
```json
{
  "message": "Doação confirmada com sucesso!"
}
```

---

## 💻 Implementação Passo a Passo

### **Passo 1: Criar Types**

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
export interface UpgradeRequirements {
  upgrade_amount?: number;
  cascade_amount?: number;
  reinjection_amount?: number;
  total: number;
  description: string;
}

export interface UpgradeInfo {
  can_upgrade: boolean;
  from_level: number;
  to_level: number | null;
  requirements: UpgradeRequirements;
  user_balance: number;
  can_afford: boolean;
}

// Request de Upgrade
export interface AcceptUpgradeRequest {
  from_level: number;
  to_level: number;
}

// Resposta de Upgrade
export interface DonationCreated {
  type: string;
  level: number;
  amount: number;
  position?: number;
}

export interface AcceptUpgradeResponse {
  message: string;
  new_level: number;
  donations_created: DonationCreated[];
}

// Resposta de Confirmação
export interface DonationConfirmResponse {
  message: string;
  level_completed?: boolean;
  completed_level?: number;
  upgrade_available?: UpgradeInfo;
}
```

---

### **Passo 2: Criar API Helper**

**Arquivo:** `src/lib/api.ts`

```typescript
import axios, { AxiosRequestConfig } from 'axios';

// Configurar base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // ou onde você armazena o token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Você pode adicionar tratamento global aqui
    const message = error.response?.data?.message || error.message;
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// Função auxiliar para fazer requisições autenticadas
export async function makeAuthenticatedRequest<T = any>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}

// Exportar instância para uso direto se necessário
export default api;
```

---

### **Passo 3: Criar Service de Doações**

**Arquivo:** `src/services/donations.service.ts`

```typescript
import { makeAuthenticatedRequest } from '../lib/api';
import type {
  LevelProgress,
  AcceptUpgradeRequest,
  AcceptUpgradeResponse,
  DonationConfirmResponse,
} from '../types/donations.types';

export const donationsService = {
  /**
   * Buscar progresso do usuário em todos os níveis
   */
  async getMyLevelProgress(): Promise<LevelProgress[]> {
    return makeAuthenticatedRequest<LevelProgress[]>({
      method: 'GET',
      url: '/donations/my-level-progress',
    });
  },

  /**
   * Aceitar upgrade para próximo nível
   */
  async acceptUpgrade(
    data: AcceptUpgradeRequest
  ): Promise<AcceptUpgradeResponse> {
    return makeAuthenticatedRequest<AcceptUpgradeResponse>({
      method: 'POST',
      url: '/donations/accept-upgrade',
      data,
    });
  },

  /**
   * Confirmar recebimento de doação
   */
  async confirmDonation(
    donationId: string
  ): Promise<DonationConfirmResponse> {
    return makeAuthenticatedRequest<DonationConfirmResponse>({
      method: 'POST',
      url: `/donations/${donationId}/confirm`,
    });
  },
};
```

---

### **Passo 4: Criar Hook de Progresso**

**Arquivo:** `src/hooks/useUserProgress.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { donationsService } from '../services/donations.service';
import type { LevelProgress } from '../types/donations.types';

export function useUserProgress() {
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
      const message = err.response?.data?.message || 'Erro ao carregar progresso';
      setError(message);
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Helper: pegar progresso de um nível específico
  const getLevelProgress = useCallback(
    (level: number): LevelProgress | undefined => {
      return progress.find((p) => p.level === level);
    },
    [progress]
  );

  // Helper: verificar se pode fazer upgrade
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
}
```

---

### **Passo 5: Criar Hook de Upgrade**

**Arquivo:** `src/hooks/useUpgrade.ts`

```typescript
import { useState } from 'react';
import { donationsService } from '../services/donations.service';
import type {
  AcceptUpgradeRequest,
  AcceptUpgradeResponse,
} from '../types/donations.types';

export function useUpgrade() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const acceptUpgrade = async (
    fromLevel: number,
    toLevel: number
  ): Promise<AcceptUpgradeResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const data: AcceptUpgradeRequest = {
        from_level: fromLevel,
        to_level: toLevel,
      };

      const response = await donationsService.acceptUpgrade(data);
      setSuccess(true);
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

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(false);

  return {
    acceptUpgrade,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
  };
}
```

---

### **Passo 6: Criar Componente de Progresso**

**Arquivo:** `src/components/LevelProgress.tsx`

```typescript
import React from 'react';
import { useUserProgress } from '../hooks/useUserProgress';

export const LevelProgress: React.FC = () => {
  const { progress, loading, error } = useUserProgress();

  if (loading) {
    return (
      <div className="level-progress-loading">
        <p>Carregando seu progresso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="level-progress-error">
        <p>❌ {error}</p>
      </div>
    );
  }

  if (progress.length === 0) {
    return (
      <div className="level-progress-empty">
        <p>Você ainda não está em nenhum nível.</p>
      </div>
    );
  }

  return (
    <div className="level-progress-container">
      <h2>Seu Progresso nos Níveis</h2>

      {progress.map((level) => (
        <div
          key={level.level}
          className={`level-card ${
            level.level_completed ? 'completed' : 'in-progress'
          }`}
        >
          <div className="level-header">
            <h3>
              Nível {level.level}
              {level.level_completed && ' ✅'}
            </h3>
            {level.level_completed && level.level_completed_at && (
              <span className="completion-date">
                Completado em{' '}
                {new Date(level.level_completed_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          <div className="level-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${level.progress_percentage}%` }}
              />
            </div>
            <p className="progress-text">
              {level.donations_received} de {level.donations_required} doações (
              {level.progress_percentage.toFixed(0)}%)
            </p>
          </div>

          <div className="level-info">
            <p>
              <strong>Total recebido:</strong> R${' '}
              {level.total_received.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

### **Passo 7: Criar Modal de Upgrade**

**Arquivo:** `src/components/UpgradeModal.tsx`

```typescript
import React, { useState } from 'react';
import { useUpgrade } from '../hooks/useUpgrade';
import type { UpgradeInfo } from '../types/donations.types';

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
  const { acceptUpgrade, loading, error, success } = useUpgrade();
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!upgradeInfo.can_upgrade || !upgradeInfo.to_level) {
      return;
    }

    const response = await acceptUpgrade(
      upgradeInfo.from_level,
      upgradeInfo.to_level
    );

    if (response) {
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {!showSuccess ? (
          <>
            <div className="modal-header">
              <h2>🎉 Nível {upgradeInfo.from_level} Completado!</h2>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                {upgradeInfo.requirements.description}
              </p>

              <div className="upgrade-details">
                <h3>Detalhes do Upgrade:</h3>

                {upgradeInfo.requirements.upgrade_amount && (
                  <div className="detail-row">
                    <span>Upgrade para Nível {upgradeInfo.to_level}:</span>
                    <span>
                      R$ {upgradeInfo.requirements.upgrade_amount.toFixed(2)}
                    </span>
                  </div>
                )}

                {upgradeInfo.requirements.cascade_amount && (
                  <div className="detail-row">
                    <span>Cascata Nível {upgradeInfo.from_level}:</span>
                    <span>
                      R$ {upgradeInfo.requirements.cascade_amount.toFixed(2)}
                    </span>
                  </div>
                )}

                {upgradeInfo.requirements.reinjection_amount && (
                  <div className="detail-row">
                    <span>Reinjeção Nível {upgradeInfo.from_level}:</span>
                    <span>
                      R${' '}
                      {upgradeInfo.requirements.reinjection_amount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="detail-row total">
                  <span>Total:</span>
                  <span>R$ {upgradeInfo.requirements.total.toFixed(2)}</span>
                </div>
              </div>

              {upgradeInfo.can_upgrade ? (
                <div className="upgrade-status can-upgrade">
                  <p>✅ Você pode fazer o upgrade agora!</p>
                </div>
              ) : (
                <div className="upgrade-status blocked">
                  <p>⏳ Aguarde os participantes anteriores fazerem upgrade.</p>
                  <p className="blocked-info">
                    Upgrades devem ser feitos em ordem sequencial.
                  </p>
                </div>
              )}

              {error && <div className="modal-error">{error}</div>}
            </div>

            <div className="modal-footer">
              {upgradeInfo.can_upgrade ? (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleAccept}
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : '✓ Aceitar Upgrade'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Aguardar
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={handleClose}>
                  OK, Entendi
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h2>Upgrade Realizado!</h2>
            <p>Você agora está no Nível {upgradeInfo.to_level}!</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### **Passo 8: Integrar com Confirmação de Doação**

**Arquivo:** `src/components/DonationItem.tsx` (ou onde você confirma doações)

```typescript
import React, { useState } from 'react';
import { donationsService } from '../services/donations.service';
import { UpgradeModal } from './UpgradeModal';
import type { UpgradeInfo } from '../types/donations.types';

interface DonationItemProps {
  donationId: string;
  // ... outras props
}

export const DonationItem: React.FC<DonationItemProps> = ({ donationId }) => {
  const [confirming, setConfirming] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);

  const handleConfirm = async () => {
    try {
      setConfirming(true);

      // Confirmar doação
      const response = await donationsService.confirmDonation(donationId);

      // Verificar se completou nível
      if (response.level_completed && response.upgrade_available) {
        // Mostrar modal de upgrade
        setUpgradeInfo(response.upgrade_available);
        setShowUpgradeModal(true);
      } else {
        // Apenas confirmou, sem upgrade
        alert('Doação confirmada com sucesso!');
        // Recarregar lista de doações
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao confirmar';
      alert(message);
    } finally {
      setConfirming(false);
    }
  };

  const handleUpgradeSuccess = () => {
    // Recarregar dashboard
    window.location.reload();
  };

  return (
    <div className="donation-item">
      {/* ... renderizar informações da doação ... */}

      <button onClick={handleConfirm} disabled={confirming}>
        {confirming ? 'Confirmando...' : 'Confirmar Recebimento'}
      </button>

      {/* Modal de Upgrade */}
      {upgradeInfo && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          upgradeInfo={upgradeInfo}
          onSuccess={handleUpgradeSuccess}
        />
      )}
    </div>
  );
};
```

---

## 🎨 Estilos CSS

**Arquivo:** `src/styles/upgrade.css`

```css
/* Modal de Upgrade */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
  text-align: center;
}

.modal-body {
  padding: 32px;
}

.modal-description {
  font-size: 16px;
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 24px;
}

.upgrade-details {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
}

.upgrade-details h3 {
  font-size: 18px;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
  font-size: 15px;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.total {
  margin-top: 12px;
  padding-top: 16px;
  border-top: 2px solid #3498db;
  font-weight: 600;
  font-size: 18px;
  color: #2c3e50;
}

.upgrade-status {
  margin: 24px 0;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.upgrade-status.can-upgrade {
  background: #d5f4e6;
  border: 2px solid #27ae60;
}

.upgrade-status.can-upgrade p {
  color: #27ae60;
  font-weight: 600;
  margin: 0;
}

.upgrade-status.blocked {
  background: #ffeaa7;
  border: 2px solid #e67e22;
}

.upgrade-status.blocked p {
  color: #e67e22;
  font-weight: 600;
  margin: 8px 0;
}

.blocked-info {
  font-size: 14px;
  font-weight: 400;
}

.modal-error {
  background: #fadbd8;
  color: #e74c3c;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
  text-align: center;
  font-weight: 500;
}

.modal-footer {
  padding: 24px 32px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
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
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.success-content {
  padding: 48px 32px;
  text-align: center;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.success-content h2 {
  color: #27ae60;
  margin: 16px 0;
}

.success-content p {
  color: #7f8c8d;
  font-size: 16px;
}

/* Progresso de Níveis */
.level-progress-container {
  margin: 24px 0;
}

.level-progress-container h2 {
  font-size: 24px;
  margin-bottom: 24px;
  color: #2c3e50;
}

.level-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.level-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.level-card.completed {
  border-color: #27ae60;
  background: #f0fdf4;
}

.level-card.in-progress {
  border-color: #3498db;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.level-header h3 {
  margin: 0;
  font-size: 20px;
  color: #2c3e50;
}

.completion-date {
  font-size: 14px;
  color: #7f8c8d;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2ecc71 100%);
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.level-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.level-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #2c3e50;
}
```

---

## 📱 Exemplo de Uso Completo

**Arquivo:** `src/pages/Dashboard.tsx`

```typescript
import React from 'react';
import { LevelProgress } from '../components/LevelProgress';
import { useUserProgress } from '../hooks/useUserProgress';

export const Dashboard: React.FC = () => {
  const { progress, loading } = useUserProgress();

  return (
    <div className="dashboard">
      <h1>Meu Dashboard</h1>

      {/* Progresso de Níveis */}
      <LevelProgress />

      {/* Outras seções do dashboard */}
      {/* ... doações pendentes, histórico, etc ... */}
    </div>
  );
};
```

---

## 🔄 Fluxo Completo do Usuário

### **Cenário 1: Completou e Pode Fazer Upgrade**

```
1. Usuário recebe 3ª doação do N1
   ↓
2. Clica em "Confirmar Recebimento"
   ↓
3. API retorna: level_completed: true, upgrade_available
   ↓
4. Modal aparece automaticamente:
   "🎉 Nível 1 Completado!"
   "✅ Você pode fazer o upgrade agora!"
   ↓
5. Usuário clica "Aceitar Upgrade"
   ↓
6. API processa upgrade
   ↓
7. Sucesso: "✅ Upgrade Realizado!"
   ↓
8. Dashboard recarrega mostrando Nível 2
```

### **Cenário 2: Completou mas Está Bloqueado**

```
1. Usuário recebe 3ª doação do N1
   ↓
2. Clica em "Confirmar Recebimento"
   ↓
3. API retorna: can_upgrade: false
   ↓
4. Modal aparece:
   "🎉 Nível 1 Completado!"
   "⏳ Aguarde os participantes anteriores"
   ↓
5. Apenas botão "OK, Entendi"
   ↓
6. Usuário fecha modal e aguarda
```

---

## ✅ Checklist de Implementação

### **Backend (Pronto ✅)**
- [x] Endpoint `/donations/my-level-progress`
- [x] Endpoint `/donations/accept-upgrade`
- [x] Validação de ordem sequencial
- [x] Logs detalhados

### **Frontend (A Implementar)**
- [ ] Criar `src/types/donations.types.ts`
- [ ] Criar `src/lib/api.ts`
- [ ] Criar `src/services/donations.service.ts`
- [ ] Criar `src/hooks/useUserProgress.ts`
- [ ] Criar `src/hooks/useUpgrade.ts`
- [ ] Criar `src/components/LevelProgress.tsx`
- [ ] Criar `src/components/UpgradeModal.tsx`
- [ ] Integrar com confirmação de doação
- [ ] Adicionar CSS (`src/styles/upgrade.css`)
- [ ] Testar fluxo completo
- [ ] Deploy

---

## 🚀 Começar Rápido

1. **Copiar todos os arquivos** listados acima
2. **Ajustar imports** conforme estrutura do projeto
3. **Testar build:** `npm run build`
4. **Testar localmente:** `npm run dev`
5. **Commit e push**

---

## 🐛 Troubleshooting

### **Erro: "makeAuthenticatedRequest" is not exported**
✅ **Solução:** Criar/atualizar `src/lib/api.ts` com a função

### **Erro: Token não está sendo enviado**
✅ **Solução:** Verificar se `localStorage.getItem('token')` está correto

### **Erro: CORS**
✅ **Solução:** Backend já tem CORS configurado, verificar se URL está correta

---

**✅ Documentação Completa! Copy-Paste e Implemente!** 🎉


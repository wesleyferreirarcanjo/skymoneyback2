import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DataGeneratorService {
  private readonly logger = new Logger(DataGeneratorService.name);

  constructor(private readonly usersService: UsersService) {}

  async generateTestUsers(): Promise<void> {
    this.logger.log('Starting to generate 98 test users...');
    
    const baseUser = {
      firstName: 'WESLEY',
      lastName: 'ARCANJO',
      email: 'wesleyferreirarcanjo@gmail.com',
      phone: '119929308722',
      password: '$2b$10$1ecNtNobEaRpi9D7OhRA1Oc3wQjBXKpMBMMuSgWCLBm8ykA0bV6OC',
      pixKey: 'wesleyferreirarcanjo@gmail.com',
      cpf: '433126428922',
      birthDate: '1998-04-02',
      cep: '068244402',
      address: 'Rua Catuaba, Jardim Batista, Embu das Artes - SP',
      addressNumber: '1172',
      bank: 'Banco do Brasil',
      agency: '1232132',
      account: '21312313212',
      pixKeyType: 'email',
      pixCopyPaste: '3213123123',
      btcAddress: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH2',
      usdtAddress: '0x165CD37b4C644C2921454429E7F9358d18A452e14',
      pixOwnerName: 'WESLEY FERREIRA ARCANJO',
      role: UserRole.USER,
      status: UserStatus.APPROVED,
      adminApproved: true,
      adminApprovedAt: new Date(),
    };

    const firstNames = [
      'WESLEY', 'JOÃO', 'MARIA', 'PEDRO', 'ANA', 'CARLOS', 'JULIA', 'LUCAS', 'FERNANDA', 'RAFAEL',
      'CAMILA', 'DIEGO', 'LARISSA', 'GABRIEL', 'AMANDA', 'RODRIGO', 'BRUNA', 'MARCOS', 'PATRICIA', 'FELIPE',
      'VANESSA', 'ANDRE', 'CAROLINA', 'THIAGO', 'DANIELA', 'LEONARDO', 'ADRIANA', 'VINICIUS', 'CRISTINA', 'ANTONIO',
      'SANDRA', 'RICARDO', 'MONICA', 'FERNANDO', 'SIMONE', 'ALEXANDRE', 'LUCIANA', 'MARCELO', 'ROSANA', 'EDUARDO',
      'FABIANA', 'ROBERTO', 'CLAUDIA', 'SERGIO', 'DENISE', 'PAULO', 'ELIANE', 'JOSE', 'MARLENE', 'FRANCISCO',
      'REGINA', 'MANOEL', 'CLEUSA', 'SEBASTIAO', 'MARIA', 'JOSE', 'ANTONIO', 'FRANCISCO', 'CARLOS', 'PAULO',
      'PEDRO', 'LUCAS', 'MARCOS', 'LUIZ', 'GABRIEL', 'RAFAEL', 'DANIEL', 'MARCELO', 'BRUNO', 'EDUARDO',
      'FELIPE', 'RAIMUNDO', 'RODRIGO', 'MANUEL', 'GABRIEL', 'ALEXANDRE', 'SERGIO', 'FRANCISCO', 'ANTONIO', 'CARLOS',
      'PAULO', 'PEDRO', 'LUCAS', 'MARCOS', 'LUIZ', 'GABRIEL', 'RAFAEL', 'DANIEL', 'MARCELO', 'BRUNO',
      'EDUARDO', 'FELIPE', 'RAIMUNDO', 'RODRIGO', 'MANUEL', 'GABRIEL', 'ALEXANDRE', 'SERGIO', 'FRANCISCO', 'ANTONIO'
    ];

    const lastNames = [
      'ARCANJO', 'SILVA', 'SANTOS', 'OLIVEIRA', 'SOUZA', 'RODRIGUES', 'FERREIRA', 'ALVES', 'PEREIRA', 'LIMA',
      'GOMES', 'COSTA', 'RIBEIRO', 'MARTINS', 'CARVALHO', 'ALMEIDA', 'LOPES', 'SOARES', 'FERNANDES', 'VIEIRA',
      'BARBOSA', 'ROCHA', 'DIAS', 'MONTEIRO', 'CARDOSO', 'REIS', 'MORAES', 'MOREIRA', 'CORREIA', 'NUNES',
      'MENDES', 'FREITAS', 'MACHADO', 'RAMOS', 'TEIXEIRA', 'CASTRO', 'SANTANA', 'JESUS', 'MIRANDA', 'SANTOS',
      'OLIVEIRA', 'SOUZA', 'RODRIGUES', 'FERREIRA', 'ALVES', 'PEREIRA', 'LIMA', 'GOMES', 'COSTA', 'RIBEIRO',
      'MARTINS', 'CARVALHO', 'ALMEIDA', 'LOPES', 'SOARES', 'FERNANDES', 'VIEIRA', 'BARBOSA', 'ROCHA', 'DIAS',
      'MONTEIRO', 'CARDOSO', 'REIS', 'MORAES', 'MOREIRA', 'CORREIA', 'NUNES', 'MENDES', 'FREITAS', 'MACHADO',
      'RAMOS', 'TEIXEIRA', 'CASTRO', 'SANTANA', 'JESUS', 'MIRANDA', 'SANTOS', 'OLIVEIRA', 'SOUZA', 'RODRIGUES',
      'FERREIRA', 'ALVES', 'PEREIRA', 'LIMA', 'GOMES', 'COSTA', 'RIBEIRO', 'MARTINS', 'CARVALHO', 'ALMEIDA',
      'LOPES', 'SOARES', 'FERNANDES', 'VIEIRA', 'BARBOSA', 'ROCHA', 'DIAS', 'MONTEIRO', 'CARDOSO', 'REIS'
    ];

    const banks = [
      'Banco do Brasil', 'Caixa Econômica Federal', 'Bradesco', 'Itaú Unibanco', 'Santander',
      'Banco Inter', 'Nubank', 'BTG Pactual', 'Safra', 'Banco Original',
      'Banco Pan', 'Banco Votorantim', 'Banco Safra', 'Banco Original', 'Banco Inter',
      'Nubank', 'BTG Pactual', 'Safra', 'Banco Original', 'Banco Pan'
    ];

    const pixKeyTypes = ['email', 'cpf', 'phone', 'random'];

    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i <= 98; i++) {
      try {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const bank = banks[i % banks.length];
        const pixKeyType = pixKeyTypes[i % pixKeyTypes.length];
        
        // Generate unique email and phone
        const email = `user${i}@test.com`;
        const phone = `1199999${String(i).padStart(4, '0')}`;
        const cpf = `${String(i).padStart(11, '0')}`;
        const pixKey = pixKeyType === 'email' ? email : 
                      pixKeyType === 'cpf' ? cpf : 
                      pixKeyType === 'phone' ? phone : 
                      `random${i}@pix.com`;
        
        const userData = {
          ...baseUser,
          firstName: `${firstName}${i}`,
          lastName: `${lastName}${i}`,
          email,
          phone,
          cpf,
          pixKey,
          pixKeyType,
          pixOwnerName: `${firstName} ${lastName}${i}`,
          address: `Rua Teste ${i}, Bairro Teste, Cidade Teste - SP`,
          addressNumber: String(1000 + i),
          bank,
          agency: String(1000 + i),
          account: String(1000000 + i),
          pixCopyPaste: `pix${i}@copy.com`,
          btcAddress: `1FfmbHfnpaZjKFvyi1okTjJJusN455paPH${i}`,
          usdtAddress: `0x165CD37b4C644C2921454429E7F9358d18A452e${String(i).padStart(2, '0')}`,
        };

        await this.usersService.createWithHashedPassword(userData);
        successCount++;
        
        if (i % 10 === 0) {
          this.logger.log(`Generated ${i}/98 users...`);
        }
      } catch (error) {
        errorCount++;
        this.logger.error(`Error creating user ${i}:`, error.message);
      }
    }

    this.logger.log(`Test users generation completed. Success: ${successCount}, Errors: ${errorCount}`);
  }
}

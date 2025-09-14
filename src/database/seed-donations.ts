import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { DonationsService } from '../donations/donations.service';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { DonationStatus, DonationType } from '../donations/entities/donation.entity';

async function seedDonations() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const donationsService = app.get(DonationsService);

    try {
        console.log('🌱 Starting donations seed...');

        // Create test users with different statuses
        const testUsers = [
            {
                firstName: 'João',
                lastName: 'Silva',
                email: 'joao.silva@test.com',
                phone: '+5511987654321',
                password: 'senha123',
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                pixKey: 'joao.silva@test.com',
                adminApproved: true,
            },
            {
                firstName: 'Maria',
                lastName: 'Santos',
                email: 'maria.santos@test.com',
                phone: '+5511976543210',
                password: 'senha123',
                role: UserRole.USER,
                status: UserStatus.ACTIVE_PARTICIPANT,
                pixKey: 'maria.santos@test.com',
                adminApproved: true,
            },
            {
                firstName: 'Pedro',
                lastName: 'Oliveira',
                email: 'pedro.oliveira@test.com',
                phone: '+5511965432109',
                password: 'senha123',
                role: UserRole.USER,
                status: UserStatus.APPROVED,
                pixKey: 'pedro.oliveira@test.com',
                adminApproved: true,
            },
            {
                firstName: 'Ana',
                lastName: 'Costa',
                email: 'ana.costa@test.com',
                phone: '+5511954321098',
                password: 'senha123',
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                pixKey: 'ana.costa@test.com',
                adminApproved: true,
            },
            {
                firstName: 'Carlos',
                lastName: 'Rodrigues',
                email: 'carlos.rodrigues@test.com',
                phone: '+5511943210987',
                password: 'senha123',
                role: UserRole.USER,
                status: UserStatus.ACTIVE_PARTICIPANT,
                pixKey: 'carlos.rodrigues@test.com',
                adminApproved: true,
            },
            {
                firstName: 'Lucas',
                lastName: 'Fernandes',
                email: 'lucas.fernandes@test.com',
                phone: '+5511932109876',
                password: 'senha123',
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                pixKey: 'lucas.fernandes@test.com',
                adminApproved: true,
            },
            {
                firstName: 'Beatriz',
                lastName: 'Almeida',
                email: 'beatriz.almeida@test.com',
                phone: '+5511921098765',
                password: 'senha123',
                role: UserRole.USER,
                status: UserStatus.APPROVED,
                pixKey: 'beatriz.almeida@test.com',
                adminApproved: true,
            },
            {
                firstName: 'Rafael',
                lastName: 'Lima',
                email: 'rafael.lima@test.com',
                phone: '+5511910987654',
                password: 'senha123',
                role: UserRole.USER,
                status: UserStatus.ACTIVE_PARTICIPANT,
                pixKey: 'rafael.lima@test.com',
                adminApproved: true,
            },
            {
                firstName: 'Wesley',
                lastName: 'Ferreira R. Canjo',
                email: 'wesleyferreirarcanjo@gmail.com',
                phone: '+5511998765432',
                password: 'senha123',
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                pixKey: 'wesleyferreirarcanjo@gmail.com',
                adminApproved: true,
            },
        ];

        console.log('Creating test users...');
        const createdUsers = [];

        for (const userData of testUsers) {
            try {
                const existingUser = await usersService.findByEmail(userData.email);
                if (existingUser) {
                    console.log(`User ${userData.email} already exists`);
                    createdUsers.push(existingUser);
                } else {
                    const user = await usersService.create(userData);
                    console.log(`Created user: ${user.email}`);
                    createdUsers.push(user);
                }
            } catch (error) {
                console.error(`Error creating user ${userData.email}:`, error);
            }
        }

        // Create donations with all possible statuses
        const donationTemplates = [
            // PENDING_PAYMENT - Doações aguardando pagamento
            {
                donorIndex: 0, // João
                receiverIndex: 1, // Maria
                amount: 100.00,
                type: DonationType.PULL,
                status: DonationStatus.PENDING_PAYMENT,
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h no futuro
                comprovante_url: null,
                completed_at: null,
                notes: 'Primeira doação PULL'
            },
            {
                donorIndex: 1, // Maria
                receiverIndex: 2, // Pedro
                amount: 50.00,
                type: DonationType.CASCADE_N1,
                status: DonationStatus.PENDING_PAYMENT,
                deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h no futuro
                comprovante_url: null,
                completed_at: null,
                notes: 'Doação CASCADE nível 1'
            },
            {
                donorIndex: 2, // Pedro
                receiverIndex: 3, // Ana
                amount: 200.00,
                type: DonationType.UPGRADE_N2,
                status: DonationStatus.PENDING_PAYMENT,
                deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12h no futuro
                comprovante_url: null,
                completed_at: null,
                notes: 'Upgrade para nível 2'
            },

            // PENDING_CONFIRMATION - Doações aguardando confirmação
            {
                donorIndex: 3, // Ana
                receiverIndex: 4, // Carlos
                amount: 75.00,
                type: DonationType.REINJECTION_N2,
                status: DonationStatus.PENDING_CONFIRMATION,
                deadline: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h atrás
                comprovante_url: 'https://example.com/comprovante-1.jpg',
                completed_at: null,
                notes: 'Reinjeção nível 2 - aguardando confirmação'
            },
            {
                donorIndex: 4, // Carlos
                receiverIndex: 5, // Lucas
                amount: 150.00,
                type: DonationType.UPGRADE_N3,
                status: DonationStatus.PENDING_CONFIRMATION,
                deadline: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h atrás
                comprovante_url: 'https://example.com/comprovante-2.jpg',
                completed_at: null,
                notes: 'Upgrade para nível 3 - comprovante enviado'
            },

            // CONFIRMED - Doações confirmadas
            {
                donorIndex: 5, // Lucas
                receiverIndex: 6, // Beatriz
                amount: 300.00,
                type: DonationType.REINFORCEMENT_N3,
                status: DonationStatus.CONFIRMED,
                deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h atrás
                comprovante_url: 'https://example.com/comprovante-3.jpg',
                completed_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h atrás
                notes: 'Reforço nível 3 - confirmado'
            },
            {
                donorIndex: 6, // Beatriz
                receiverIndex: 7, // Rafael
                amount: 500.00,
                type: DonationType.ADM_N3,
                status: DonationStatus.CONFIRMED,
                deadline: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48h atrás
                comprovante_url: 'https://example.com/comprovante-4.jpg',
                completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h atrás
                notes: 'ADM nível 3 - pago e confirmado'
            },
            {
                donorIndex: 7, // Rafael
                receiverIndex: 0, // João
                amount: 1000.00,
                type: DonationType.FINAL_PAYMENT_N3,
                status: DonationStatus.CONFIRMED,
                deadline: new Date(Date.now() - 72 * 60 * 60 * 1000), // 72h atrás
                comprovante_url: 'https://example.com/comprovante-5.jpg',
                completed_at: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48h atrás
                notes: 'Pagamento final nível 3 - concluído'
            },

            // EXPIRED - Doações expiradas
            {
                donorIndex: 0, // João
                receiverIndex: 2, // Pedro
                amount: 25.00,
                type: DonationType.CASCADE_N1,
                status: DonationStatus.EXPIRED,
                deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h atrás
                comprovante_url: null,
                completed_at: null,
                notes: 'Doação expirada - prazo não cumprido'
            },
            {
                donorIndex: 1, // Maria
                receiverIndex: 3, // Ana
                amount: 80.00,
                type: DonationType.PULL,
                status: DonationStatus.EXPIRED,
                deadline: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48h atrás
                comprovante_url: null,
                completed_at: null,
                notes: 'PULL expirado - não foi pago no prazo'
            },

            // CANCELLED - Doações canceladas
            {
                donorIndex: 2, // Pedro
                receiverIndex: 5, // Lucas
                amount: 120.00,
                type: DonationType.UPGRADE_N2,
                status: DonationStatus.CANCELLED,
                deadline: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h atrás
                comprovante_url: null,
                completed_at: null,
                notes: 'Doação cancelada por desistência'
            },
            {
                donorIndex: 3, // Ana
                receiverIndex: 6, // Beatriz
                amount: 90.00,
                type: DonationType.CASCADE_N1,
                status: DonationStatus.CANCELLED,
                deadline: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36h atrás
                comprovante_url: 'https://example.com/comprovante-cancelled.jpg',
                completed_at: null,
                notes: 'Cancelada após envio do comprovante'
            },

            // Doações envolvendo Wesley Ferreira R. Canjo
            {
                donorIndex: 8, // Wesley
                receiverIndex: 0, // João
                amount: 250.00,
                type: DonationType.PULL,
                status: DonationStatus.PENDING_PAYMENT,
                deadline: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36h no futuro
                comprovante_url: null,
                completed_at: null,
                notes: 'Doação PULL de Wesley - aguardando pagamento'
            },
            {
                donorIndex: 1, // Maria
                receiverIndex: 8, // Wesley
                amount: 180.00,
                type: DonationType.CASCADE_N1,
                status: DonationStatus.PENDING_CONFIRMATION,
                deadline: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h atrás
                comprovante_url: 'https://example.com/comprovante-wesley-1.jpg',
                completed_at: null,
                notes: 'Doação CASCADE para Wesley - comprovante enviado, aguardando confirmação'
            },
            {
                donorIndex: 8, // Wesley
                receiverIndex: 2, // Pedro
                amount: 400.00,
                type: DonationType.UPGRADE_N2,
                status: DonationStatus.CONFIRMED,
                deadline: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48h atrás
                comprovante_url: 'https://example.com/comprovante-wesley-2.jpg',
                completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h atrás
                notes: 'Doação UPGRADE_N2 de Wesley - confirmada e concluída'
            },
        ];

        console.log('Creating donations with all statuses...');

        // Use the donations repository to create donations with custom data

        for (const template of donationTemplates) {
            try {
                const donor = createdUsers[template.donorIndex];
                const receiver = createdUsers[template.receiverIndex];

                const donation = await donationsService.createDonationWithCustomData({
                    donor_id: donor.id,
                    receiver_id: receiver.id,
                    amount: template.amount,
                    type: template.type,
                    status: template.status,
                    deadline: template.deadline,
                    comprovante_url: template.comprovante_url,
                    completed_at: template.completed_at,
                    notes: template.notes,
                    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last 7 days
                });

                console.log(`Created ${template.status} donation: ${template.amount} from ${donor.email} to ${receiver.email} (${template.type})`);

            } catch (error) {
                console.error('Error creating donation:', error);
            }
        }

        console.log('✅ Donations seed completed successfully!');
        console.log('📊 Summary of created data:');
        console.log(`   👥 Users: ${createdUsers.length}`);
        console.log(`   💰 Donations: ${donationTemplates.length}`);
        console.log(`      - ${donationTemplates.filter(d => d.status === DonationStatus.PENDING_PAYMENT).length} PENDING_PAYMENT`);
        console.log(`      - ${donationTemplates.filter(d => d.status === DonationStatus.PENDING_CONFIRMATION).length} PENDING_CONFIRMATION`);
        console.log(`      - ${donationTemplates.filter(d => d.status === DonationStatus.CONFIRMED).length} CONFIRMED`);
        console.log(`      - ${donationTemplates.filter(d => d.status === DonationStatus.EXPIRED).length} EXPIRED`);
        console.log(`      - ${donationTemplates.filter(d => d.status === DonationStatus.CANCELLED).length} CANCELLED`);

    } catch (error) {
        console.error('❌ Error in donations seed:', error);
    } finally {
        await app.close();
    }
}

seedDonations();

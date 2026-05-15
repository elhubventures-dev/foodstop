import { Module } from '@nestjs/common';

import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { MerchantBankAccountsController } from './merchant-bank-accounts.controller';
import { MerchantWalletController } from './merchant-wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [SupabaseModule, MerchantAuthModule],
  controllers: [MerchantWalletController, MerchantBankAccountsController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}

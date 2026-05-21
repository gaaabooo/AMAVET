import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuditQueryService } from '../common/audit-query.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AuditQueryService],
})
export class AdminModule {}

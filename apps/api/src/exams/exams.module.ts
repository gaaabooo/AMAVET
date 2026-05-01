import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { SupabaseService } from '../supabase.service';

@Module({
  controllers: [ExamsController],
  providers: [ExamsService, SupabaseService],
})
export class ExamsModule {}
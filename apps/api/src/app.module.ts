import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { ExamsModule } from './exams/exams.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, PetsModule, ExamsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BatchController } from './sneakers-batch.controller';
import { BatchService } from './sneakers-batch.service';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from 'apps/sneakers-api/src/schemas/Member.model';
import ProductSchema from 'apps/sneakers-api/src/schemas/Product.model';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(), //job schedule larni ishlatish uchun
		MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]), //import qilyapmiz
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]), //import qilyapmiz
	],

	controllers: [BatchController],
	providers: [BatchService],
})
export class BatchModule {}

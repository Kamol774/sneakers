import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { LikeModule } from '../like/like.module';
import { FollowModule } from '../follow/follow.module';
import FollowSchema from '../../schemas/Follow.model';
import { MemberResolver } from './member.resolver';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }]),
		AuthModule,
		ViewModule,
		LikeModule,
		MemberModule,
		NotificationModule,
	],

	providers: [MemberResolver, MemberService],
	exports: [MemberService],
})
export class MemberModule {}

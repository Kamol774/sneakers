import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NoticeService } from './notice.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { ObjectId } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class NoticeResolver {
	constructor(private readonly noticeService: NoticeService) {}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard)
	@Query(() => Notices)
	public async getNotices(@Args('input') input: NoticesInquiry): Promise<Notices> {
		console.log('Query: getNotice');

		return await this.noticeService.getNotices(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard)
	@Mutation(() => Notice)
	public async createNoticeByAdmin(
		@Args('input') input: NoticeInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notice> {
		console.log('Mutation: createNotice');

		input.memberId = memberId;
		return await this.noticeService.createNotice(input);
	}
}

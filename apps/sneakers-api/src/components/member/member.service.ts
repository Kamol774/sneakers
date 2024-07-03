import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Schema } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { T } from '../../libs/types/common';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		// @InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private authService: AuthService,
		// private viewService: ViewService,
		// private likeService: LikeService,
	) {}

	public async signup(input: MemberInput): Promise<Member> {
		input.memberPassword = await this.authService.hashPassword(input.memberPassword);

		try {
			const result = await this.memberModel.create(input);
			result.accessToken = await this.authService.createToken(result);
			// console.log('accessToken:', accessToken);

			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}

	public async login(input: LoginInput): Promise<Member> {
		try {
			const { memberNick, memberPassword } = input;
			const response: Member = await this.memberModel
				.findOne({ memberNick: memberNick })
				.select('+memberPassword')
				.exec();

			if (!response || response.memberStatus === MemberStatus.DELETE) {
				throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
			} else if (response.memberStatus === MemberStatus.BLOCK) {
				throw new InternalServerErrorException(Message.BLOCKED_USER);
			}

			const isMatch = await this.authService.comparePasswords(input.memberPassword, response.memberPassword);
			if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);
			response.accessToken = await this.authService.createToken(response);

			return response;
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(err);
		}
	}

	public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
		const result: Member = await this.memberModel
			.findOneAndUpdate(
				{
					_id: memberId,
					memberStatus: MemberStatus.ACTIVE,
				},
				input,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		result.accessToken = await this.authService.createToken(result);
		return result;
	}

	public async getMember(memberId: ObjectId, targetId: ObjectId): Promise<Member> {
		const search: T = {
			_id: targetId,
			memberStatus: {
				$in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
			},
		};
		const targetMember = await this.memberModel.findOne(search).lean().exec();
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		// if (memberId) {
		// 	// record view
		// 	const viewInput: ViewInput = { memberId: memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER };
		// 	const newView = await this.viewService.recordView(viewInput);
		// 	if (newView) {
		// 		//increase memberView
		// 		await this.memberModel.findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true }).exec();
		// 		targetMember.memberViews++;
		// 	}
		// }

		// meLiked
		// const likeInput = { memberId: memberId, likeRefId: targetId, likeGroup: LikeGroup.MEMBER };
		// targetMember.meLiked = await this.likeService.checkLikeExistence(likeInput);

		//meFollowed
		// targetMember.meFollowed = await this.checkSubscription(memberId, targetId);

		return targetMember;
	}

	// Authorization: ADMIN

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { memberStatus, memberType, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC }; //bu ->
		// -> shu mantiq bn bir xil korinish bn boladi
		// const sort: T = { createdAt: -1 };

		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;
		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		console.log('match:', match);

		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		// console.log('result:', result);
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}

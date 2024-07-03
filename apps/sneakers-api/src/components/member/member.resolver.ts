import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { Member, Members } from '../../libs/dto/member/member';
import { LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}

	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		console.log('Mutation: signup');
		return await this.memberService.signup(input);
	}

	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		console.log('Mutation: login');
		return await this.memberService.login(input);
	}

	// @UseGuards(AuthGuard)
	@Mutation(() => Member)
	// authMemberni xoxlagan nom bn atash mumkin   authMember=data=memberNick
	// memberimini umumiy malumoti kerak bolsa @AuthMember()ni ichiga xechnimani qoymeymiz
	public async updateMember(
		@Args('input') input: MemberUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		console.log('Mutation: updateMember');
		console.log('memberId', memberId);
		delete input._id;
		console.log(input._id);

		return await this.memberService.updateMember(memberId, input);
	}

	// @UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(@Args('memberId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Member> {
		console.log('Query: getMember');
		// console.log('memberId:', memberId);
		const targetId = shapeIntoMongoObjectId(input);
		return await this.memberService.getMember(memberId, targetId);
	}

	/** ADMIN **/
	// @Roles(MemberType.ADMIN)
	// @UseGuards(RolesGuard)
	@Query(() => Members)
	public async getAllMembersByAdmin(@Args('input') input: MembersInquiry): Promise<Members> {
		console.log('Query: getAllMembersByAdmin');
		return await this.memberService.getAllMembersByAdmin(input);
	}
}

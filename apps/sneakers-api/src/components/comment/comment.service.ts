import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comments, Comment } from '../../libs/dto/comment/comment';
import { MemberService } from '../member/member.service';
import { ProductService } from '../product/product.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { Model, ObjectId } from 'mongoose';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Member } from '../../libs/dto/member/member';
import { Product } from '../../libs/dto/product/product';
import { BoardArticle } from '../../libs/dto/board-article/board-article';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		private readonly memberService: MemberService,
		private readonly productService: ProductService,
		private readonly boardArticleService: BoardArticleService,
		private readonly notificationService: NotificationService,
	) {}

	public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
		input.memberId = memberId;

		let result = null;

		try {
			result = await this.commentModel.create(input);
		} catch (err) {
			console.log('Error on Service model createComment', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		switch (input.commentGroup) {
			case CommentGroup.PRODUCT:
				await this.productService.productStatsEditor({
					_id: input.commentRefId,
					targetKey: 'productComments',
					modifier: 1,
				});
				// notification part on product comment
				const product = await this.productModel.findOne({ _id: input.commentRefId }).exec();
				if (product) {
					const authMember: Member = await this.memberModel
						.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE })
						.exec();

					if (!authMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

					const notificInput = {
						notificationType: NotificationType.COMMENT,
						notificationStatus: NotificationStatus.WAIT,
						notificationGroup: NotificationGroup.PRODUCT,
						notificationTitle: 'New Comment',
						notificationDesc: `${authMember.memberNick} commented on your product ${product.productBrand}`,
						authorId: memberId,
						receiverId: product.memberId,
						productId: input.commentRefId,
					};
					await this.notificationService.createNotification(notificInput);
				}
				break;

			case CommentGroup.ARTICLE:
				await this.boardArticleService.boardArticleStatsEditor({
					_id: input.commentRefId,
					targetKey: 'articleComments',
					modifier: 1,
				});
				// notification part on product comment
				const article = await this.boardArticleModel.findOne({ _id: input.commentRefId }).exec();
				if (article) {
					const authMember: Member = await this.memberModel
						.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE })
						.exec();

					if (!authMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
					const notificInput = {
						notificationType: NotificationType.COMMENT,
						notificationStatus: NotificationStatus.WAIT,
						notificationGroup: NotificationGroup.ARTICLE,
						notificationTitle: 'New Comment',
						notificationDesc: `${authMember.memberNick} commented on your article ${article.articleTitle}`,
						authorId: memberId,
						receiverId: article.memberId,
						productId: input.commentRefId,
					};
					await this.notificationService.createNotification(notificInput);
				}
				break;

			case CommentGroup.MEMBER:
				await this.memberService.memberStatsEditor({
					_id: input.commentRefId,
					targetKey: 'memberComments',
					modifier: 1,
				});
				const member = await this.memberModel.findOne({ _id: input.commentRefId }).exec();
				if (member) {
					const notificInput = {
						notificationType: NotificationType.COMMENT,
						notificationStatus: NotificationStatus.WAIT,
						notificationGroup: NotificationGroup.MEMBER,
						notificationTitle: 'New Comment',
						notificationDesc: `${member.memberNick} commented on your profile`,
						authorId: memberId,
						receiverId: article.memberId,
					};
					await this.notificationService.createNotification(notificInput);
				}
				break;
		}

		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);

		return result;
	}

	public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
		const { _id } = input;
		const result = await this.commentModel
			.findOneAndUpdate(
				{
					_id: _id,
					memberId: memberId,
					commentStatus: CommentStatus.ACTIVE,
				},
				input,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentRefId } = input.search;
		const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result: Comments[] = await this.commentModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							//me liked
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
		const result = await this.commentModel.findByIdAndDelete(input).exec();

		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}

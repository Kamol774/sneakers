/* eslint-disable prefer-const */
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';

import {
	AgentProductsInquiry,
	AllProductsInquiry,
	ProductsInquiry,
	ProductInput,
	OrdinaryInquiry,
} from '../../libs/dto/product/product.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { ProductStatus } from '../../libs/enums/product.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';

import * as moment from 'moment';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { MemberStatus } from '../../libs/enums/member.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Product, Products } from '../../libs/dto/product/product';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import { Member } from '../../libs/dto/member/member';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ProductService {
	constructor(
		@InjectModel('Product')
		private readonly productModel: Model<Product>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
		private notificationService: NotificationService,
	) {}

	public async createProduct(input: ProductInput): Promise<Product> {
		try {
			const result = await this.productModel.create(input);
			//increase memberProducts
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberProducts',
				modifier: 1,
			});

			return result;
		} catch (err) {
			console.log('Error, createProduct service', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getProduct(memberId: ObjectId, productId: ObjectId): Promise<Product> {
		const search: T = {
			_id: productId,
			productStatus: ProductStatus.ACTIVE,
		};

		const targetProduct: Product = await this.productModel.findOne(search).lean().exec();
		if (!targetProduct) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: productId, viewGroup: ViewGroup.PRODUCT };
			const newView = await this.viewService.recordView(viewInput);

			if (newView) {
				await this.productStatsEditor({ _id: productId, targetKey: 'productViews', modifier: 1 });
				targetProduct.productViews++;
			}
			//me liked
			const likeInput = { memberId: memberId, likeRefId: productId, likeGroup: LikeGroup.PRODUCT };
			targetProduct.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}
		// null bolishligiga sabab kim korayotganligini korishimiz shartmas
		targetProduct.memberData = await this.memberService.getMember(null, targetProduct.memberId);
		return targetProduct;
	}

	public async updateProduct(memberId: ObjectId, input: ProductUpdate): Promise<Product> {
		// destruction
		let { productStatus, soldAt, deletedAt } = input;

		// declaration of searching mehanizmi
		const search: T = {
			_id: input._id,
			memberId: memberId,
			productStatus: ProductStatus.ACTIVE,
		};

		if (productStatus === ProductStatus.SOLD) soldAt = moment().toDate();
		else if (productStatus === ProductStatus.DELETE) deletedAt = moment().toDate();

		const result = await this.productModel.findOneAndUpdate(search, input, { new: true }).exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (soldAt || deletedAt) {
			await this.memberService.memberStatsEditor({ _id: memberId, targetKey: 'memberProducts', modifier: -1 });
		}

		return result;
	}

	public async getProducts(memberId: ObjectId, input: ProductsInquiry): Promise<Products> {
		const match: T = { productStatus: ProductStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);
		console.log('match:', match);

		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						// list nomi bn quyidagilarni search qilib berishi
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },

							// meliked
							lookupAuthMemberLiked(memberId),

							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		return await this.likeService.getFavoriteProducts(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		return await this.viewService.getVisitedProducts(memberId, input);
	}

	public async getAgentProducts(memberId: ObjectId, input: AgentProductsInquiry): Promise<Products> {
		const { productStatus } = input.search;
		if (productStatus === ProductStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			productStatus: productStatus ?? { $ne: ProductStatus.DELETE },
		};

		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};

		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	/**  Like **/
	public async likeTargetProduct(memberId: ObjectId, likeRefId: ObjectId): Promise<Product> {
		const target: Product = await this.productModel
			.findOne({ _id: likeRefId, productStatus: ProductStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.PRODUCT,
		};

		// Like TOGGLE -1 +1 via Like Modules
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.productStatsEditor({
			_id: likeRefId,
			targetKey: 'productLikes',
			modifier,
		});

		//notification
		const authMember: Member = await this.memberModel
			.findOne({
				_id: memberId,
				memberStatus: MemberStatus.ACTIVE,
			})
			.exec();
		if (!authMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const notificInput: NotificationInput = {
			notificationType: NotificationType.LIKE,
			notificationStatus: NotificationStatus.WAIT,
			notificationGroup: NotificationGroup.PRODUCT,
			notificationTitle: 'Like',
			notificationDesc: `${authMember.memberNick} like your property`,
			authorId: memberId,
			receiverId: target.memberId,
		};
		await this.notificationService.createNotification(notificInput);

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	private shapeMatchQuery(match: T, input: ProductsInquiry): void {
		const { memberId, typeList, brandList, colorsList, pricesRange, seasonList, options, text } = input.search;

		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (typeList && typeList.length) match.productType = { $in: typeList };
		if (brandList && brandList.length) match.productBrand = { $in: brandList };
		if (colorsList && colorsList.length) match.productColor = { $in: colorsList };
		if (seasonList && seasonList.length) match.productSeason = { $in: seasonList };
		if (pricesRange) match.productPrice = { $gte: pricesRange.start, $lte: pricesRange.end };

		if (text) match.productTitle = { $regex: new RegExp(text, 'i') };
		if (options) {
			match['$or'] = options.map((ele) => {
				return { [ele]: true };
			});
		}
	}

	/**************************
	 *         ADMIN        *
	 *************************/
	public async getAllProductsByAdmin(input: AllProductsInquiry): Promise<Products> {
		const { productStatus } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (productStatus) match.productStatus = productStatus;
		// if (productLocationList) match.productLocation = { $in: productLocationList };

		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		//console.log('lookupMember:', lookupMember);
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateProductByAdmin(input: ProductUpdate): Promise<Product> {
		// deconstruction
		let { productStatus, soldAt, deletedAt } = input;

		const search: T = {
			_id: input._id,
			productStatus: ProductStatus.ACTIVE,
		};

		if (productStatus === ProductStatus.SOLD) soldAt = moment().toDate();
		else if (productStatus === ProductStatus.DELETE) deletedAt = moment().toDate();

		const result = await this.productModel.findOneAndUpdate(search, input, { new: true }).exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (soldAt || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberProducts',
				modifier: -1,
			});
		}
		return result;
	}

	public async removeProductByAdmin(productId: ObjectId): Promise<Product> {
		const search: T = { _id: productId, productStatus: ProductStatus.DELETE };
		const result = await this.productModel.findOneAndDelete(search).exec();

		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async productStatsEditor(input: StatisticModifier): Promise<Product> {
		const { _id, targetKey, modifier } = input;

		return await this.productModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } },
				{
					new: true,
				},
			)
			.exec();
	}
}

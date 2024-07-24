import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { T } from '../../libs/types/common';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class NoticeService {
	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	public async createNotice(input: NoticeInput): Promise<Notice> {
		try {
			const result = await this.noticeModel.create(input);
			return result;
		} catch (err) {
			console.log('Error, createNotice service', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		const { noticeRefId, noticeCategory, text } = input.search;
		const match: T = { noticeStatus: NoticeStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (noticeCategory) match.noticeCategory = noticeCategory;
		if (text) match.noticeTitle = { $regex: new RegExp(text, 'i') };
		if (input.search?.memberId) {
			match.memberId = shapeIntoMongoObjectId(input.search.memberId);
		}
		console.log('match:', match);

		const result = await this.noticeModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						// list nomi bn quyidagilarni search qilib berishi
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}

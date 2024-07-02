import { Schema } from 'mongoose';
import { ProductLocation, ProductStatus, ProductType } from '../libs/enums/product.enum';

const ProductSchema = new Schema(
	{
		productType: {
			type: String,
			enum: ProductType,
			required: true,
		},

		productStatus: {
			type: String,
			enum: ProductStatus,
			default: ProductStatus.ACTIVE,
		},

		productLocation: {
			type: String,
			enum: ProductLocation,
			required: true,
		},

		productAddress: {
			type: String,
			required: true,
		},

		productTitle: {
			type: String,
			required: true,
		},

		productPrice: {
			type: Number,
			required: true,
		},

		productSquare: {
			type: Number,
			required: true,
		},

		productBeds: {
			type: Number,
			required: true,
		},

		productRooms: {
			type: Number,
			required: true,
		},

		productViews: {
			type: Number,
			default: 0,
		},

		productLikes: {
			type: Number,
			default: 0,
		},

		productComments: {
			type: Number,
			default: 0,
		},

		productRank: {
			type: Number,
			default: 0,
		},

		productImages: {
			type: [String],
			required: true,
		},

		productDesc: {
			type: String,
		},

		productBarter: {
			type: Boolean,
			default: false,
		},

		productRent: {
			type: Boolean,
			default: false,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		soldAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},

		constructedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'products' },
);

ProductSchema.index({ productType: 1, productLocation: 1, productTitle: 1, productPrice: 1 }, { unique: true });

export default ProductSchema;
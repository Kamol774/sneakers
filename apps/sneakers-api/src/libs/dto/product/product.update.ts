import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ProductBrand, ProductColor, ProductSeason, ProductStatus, ProductType } from '../../enums/product.enum';

@InputType()
export class ProductUpdate {
	// aynan qaysi productni yangilamoqchimiz
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => ProductType, { nullable: true })
	productType?: ProductType;

	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@Field(() => ProductBrand, { nullable: true })
	productBrand?: ProductBrand;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	productTitle?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	productPrice?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	productSize?: number;

	@IsOptional()
	@Field(() => ProductColor, { nullable: true })
	productColor?: ProductColor;

	@IsOptional()
	@Field(() => ProductSeason, { nullable: true })
	productSeason?: ProductSeason;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	productImages?: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	productDesc?: string;

	soldAt?: Date;
	deletedAt?: Date;
}

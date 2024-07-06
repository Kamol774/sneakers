/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { ProductService } from './product.service';

import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

import { AuthGuard } from '../auth/guards/auth.guard';
import { Product, Products } from '../../libs/dto/product/product';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import {
	AgentProductsInquiry,
	AllProductsInquiry,
	ProductInput,
	ProductsInquiry,
} from '../../libs/dto/product/product.input';

@Resolver()
export class ProductResolver {
	constructor(private readonly productService: ProductService) {}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async createProduct(
		@Args('input') input: ProductInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Product> {
		console.log('Mutation: createProduct');

		// aynan osha product qoshayotgan memberni ID sini va uni AuthMember decorator orqali olyabmiz
		input.memberId = memberId;
		return await this.productService.createProduct(input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Product)
	public async getProduct(@Args('productId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Product> {
		console.log('Query: getProduct');

		const productId = shapeIntoMongoObjectId(input);
		return await this.productService.getProduct(memberId, productId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Product)
	public async updateProduct(
		@Args('input') input: ProductUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Product> {
		console.log('Mutation: updateProduct');

		// memberId => murojatchini id si

		input._id = shapeIntoMongoObjectId(input._id);
		return await this.productService.updateProduct(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Products)
	public async getProducts(
		@Args('input') input: ProductsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Products> {
		console.log('Query: getProducts');

		return await this.productService.getProducts(memberId, input);
	}

	// @UseGuards(AuthGuard)
	// @Query(() => Products)
	// public async getFavorites(
	// 	@Args('input') input: OrdinaryInquiry,
	// 	@AuthMember('_id') memberId: ObjectId,
	// ): Promise<Products> {
	// 	console.log('Query: getFavorites');

	// 	return await this.productService.getFavorites(memberId, input);
	// }

	// @UseGuards(AuthGuard)
	// @Query(() => Products)
	// public async getVisited(
	// 	@Args('input') input: OrdinaryInquiry,
	// 	@AuthMember('_id') memberId: ObjectId,
	// ): Promise<Products> {
	// 	console.log('Query: getVisited');

	// 	return await this.productService.getVisited(memberId, input);
	// }

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query((returns) => Products)
	public async getAgentProducts(
		@Args('input') input: AgentProductsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Products> {
		console.log('Query: getAgetnsProducts');

		return await this.productService.getAgentProducts(memberId, input);
	}

	/** Like **/
	// @UseGuards(AuthGuard)
	// @Mutation(() => Product)
	// public async likeTargetProduct(
	// 	@Args('productId') input: string,
	// 	@AuthMember('_id') memberId: ObjectId,
	// ): Promise<Product> {
	// 	console.log('Mutation: likeTargetProduct');
	// 	const likeRefId = shapeIntoMongoObjectId(input);
	// 	return await this.productService.likeTargetProduct(memberId, likeRefId);
	// }

	/**  ADMIN  **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Products) //-> Products
	public async getAllProductsByAdmin(
		@Args('input') input: AllProductsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Products> {
		console.log('Query: getAllProductsByAdmin');

		return await this.productService.getAllProductsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Product)
	public async updateProductByAdmin(@Args('input') input: ProductUpdate): Promise<Product> {
		console.log('Mutation: updateProductByAdmin');

		input._id = shapeIntoMongoObjectId(input._id);

		return await this.productService.updateProductByAdmin(input);
	}

	// productlarimizni ochirish mantigini faqatgina admin amalga oshiroladi
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Product)
	//qaysi productIdni databasdan ochirmoqchimiz
	public async removeProductByAdmin(@Args('productId') input: string): Promise<Product> {
		console.log('Mutation: removeProductByAdmin');

		const productId = shapeIntoMongoObjectId(input);
		return await this.productService.removeProductByAdmin(productId);
	}
}

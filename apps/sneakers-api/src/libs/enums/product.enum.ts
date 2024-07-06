import { registerEnumType } from '@nestjs/graphql';

export enum ProductType {
	UNISEX = 'UNISEX',
	MAN = 'MAN',
	WOMEN = 'WOMEN',
	CHILDREN = 'CHILDREN',
}
registerEnumType(ProductType, {
	name: 'ProductType',
});

export enum ProductStatus {
	ACTIVE = 'ACTIVE',
	SOLD = 'SOLD',
	DELETE = 'DELETE',
}
registerEnumType(ProductStatus, {
	name: 'ProductStatus',
});

export enum ProductBrand {
	ADIDAS = 'ADIDAS',
	PUMA = 'PUMA',
	ULTRA_FASHION = 'ULTRA_FASHION',
	WORLD_CUP = 'WORLD_CUP',
	TOP_TEN = 'TOP_TEN',
	FILA = 'FILA',
	ELSO = 'ELSO',
	NEW_BALANCE = 'NEW_BALANCE',
	NIKE = 'NIKE',
	AIR_MAX = 'AIR_MAX',
}
registerEnumType(ProductBrand, {
	name: 'ProductBrand',
});

export enum ProductColor {
	BLACK = 'BLACK',
	GRAY = 'GRAY',
	SILVER = 'SILVER',
	RED = 'RED',
	ORANGE = 'ORANGE',
	YELLOW = 'YELLOW',
	GREEN = 'GREEN',
	BLUE = 'BLUE',
	PURPLE = 'PURPLE',
	PINK = 'PINK',
	WHITE = 'WHITE',
	BROWN = 'BROWN',
	GOLD = 'GOLD',
	MIX = 'MIX',
	OTHER = 'OTHER',
}
registerEnumType(ProductColor, {
	name: 'ProductColor',
});

export enum ProductSeason {
	ALL_SEASONS = 'ALL_SEASONS',
	SPRING_FALL = 'SPRING_FALL',
	SUMMER = 'SUMMER',
	WINTER = 'WINTER',
}
registerEnumType(ProductSeason, {
	name: 'ProductSeason',
});

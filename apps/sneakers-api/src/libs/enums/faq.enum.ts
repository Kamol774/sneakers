import { registerEnumType } from '@nestjs/graphql';

export enum FaqType {
	SNEAKERS = 'Sneakers',
	PAYMENT = 'Payment',
	BUYERS = 'Buyers',
	AGENTS = 'Agents',
	MEMBERSHIP = 'Membership',
	COMMUNITY = 'Community',
	OTHER = 'Other',
}
registerEnumType(FaqType, {
	name: 'FaqType',
});

export enum FaqStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}

registerEnumType(FaqStatus, {
	name: 'FaqStatus',
});
